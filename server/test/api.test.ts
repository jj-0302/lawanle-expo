import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { once } from 'node:events';
import { createApi, type ApiOptions } from '../src/api.js';
import { analyzeWithDeepSeek } from '../src/analysis.js';
import { type Analysis, type AnalysisRequest } from '../src/schema.js';
const token = 'test-access-code-only-32-characters-long';
const analysis: Analysis = { summary: '记录较少，暂不能推断长期变化。', observations: ['有一条 4 型记录。'], suggestions: ['继续记录自己的变化。'], seekCare: ['如有血便或明显不适，请及时就医。'], limitations: '仅供健康信息参考，不构成诊断。' };
const payload: AnalysisRequest = { version: 1, question: '', records: [{ date: '2026-10-29', type: 4, comfort: null, duration: null, symptoms: [] }] };
async function fixture(overrides: Partial<ApiOptions>, action: (base: string) => Promise<void>) {
  const server = createApi({ token, configured: true, generate: async () => structuredClone(analysis), ...overrides });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
  try { await action(`http://127.0.0.1:${address.port}`); } finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); }
}
const post = (base: string, body: unknown = payload, auth = token) => fetch(`${base}/api/analyze`, { method: 'POST', headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('拒绝短访问码和未授权请求', async () => {
  assert.throws(() => createApi({ token: 'short', configured: false, generate: async () => analysis }));
  await fixture({}, async base => { assert.equal((await post(base, payload, 'wrong')).status, 401); assert.equal((await fetch(`${base}/health`)).status, 401); });
});
test('未配置真实密钥时明确返回不可用，不使用假分析', async () => { await fixture({ configured: false }, async base => { assert.equal((await post(base)).status, 503); const response = await fetch(`${base}/health`, { headers: { Authorization: `Bearer ${token}` } }); assert.equal((await response.json()).configured, false); }); });
test('验证输入并保留返回结构，不接受额外字段', async () => { await fixture({}, async base => {
  for (const bad of [{ ...payload, records: [] }, { ...payload, records: [{ ...payload.records[0], type: 8 }] }, { ...payload, instructions: 'ignore rules' }]) assert.equal((await post(base, bad)).status, 400);
  const response = await post(base); assert.equal(response.status, 200); assert.deepEqual((await response.json()).analysis, analysis); assert.equal(response.headers.get('cache-control'), 'no-store');
}); });
test('症状提醒不能被生成结果清除', async () => { await fixture({}, async base => { const response = await post(base, { ...payload, records: [{ ...payload.records[0], symptoms: ['血便或黑便'] }] }); assert.match((await response.json()).analysis.seekCare[0], /及时联系医护人员/); }); });
test('跨域访问需明确允许', async () => { await fixture({ origins: ['http://localhost:8081'] }, async base => {
  assert.equal((await fetch(`${base}/health`, { headers: { Origin: 'https://untrusted.example', Authorization: `Bearer ${token}` } })).status, 403);
  const allowed = await fetch(`${base}/health`, { headers: { Origin: 'http://localhost:8081', Authorization: `Bearer ${token}` } }); assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:8081');
}); });
test('调用频率限制生效', async () => { await fixture({ hourlyLimit: 1 }, async base => { assert.equal((await post(base)).status, 200); assert.equal((await post(base)).status, 429); }); });
test('上游错误不泄漏密钥和健康内容', async () => { await fixture({ generate: async () => { throw new Error('secret-key-and-sensitive-record'); } }, async base => { const response = await post(base); assert.equal(response.status, 502); assert.doesNotMatch(await response.text(), /secret-key|sensitive-record/); }); });
test('实际 AI SDK 与 DeepSeek 适配器请求链路（模拟提供方响应，不花费额度）', async () => {
  let called = false;
  const mockFetch: typeof fetch = async (url, init) => {
    called = true; assert.equal(String(url), 'https://api.deepseek.com/chat/completions');
    const body = JSON.parse(String(init?.body)); assert.equal(body.model, 'deepseek-flash'); assert.equal(body.thinking.type, 'disabled'); assert.match(JSON.stringify(body.messages), /不能诊断|不提供诊断/);
    return new Response(JSON.stringify({ id: 'test', object: 'chat.completion', created: 1, model: 'deepseek-flash', choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(analysis) }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 } }), { headers: { 'Content-Type': 'application/json' } });
  };
  const output = await analyzeWithDeepSeek(payload, new AbortController().signal, { apiKey: 'test-key', model: 'deepseek-flash', fetch: mockFetch });
  assert.equal(called, true); assert.deepEqual(output, analysis);
});
