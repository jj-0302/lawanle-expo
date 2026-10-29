import { timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { analysisSchema, requestSchema, type Analysis, type AnalysisRequest } from './schema.js';
export type ApiOptions = { token: string; configured: boolean; origins?: string[]; hourlyLimit?: number; generate: (data: AnalysisRequest, signal: AbortSignal) => Promise<Analysis> };
const MAX_BODY = 768 * 1024;
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
async function readJson(req: IncomingMessage) {
  let length = 0; const chunks: Buffer[] = [];
  for await (const chunk of req) { length += chunk.length; if (length > MAX_BODY) throw new HttpError(413, '请求内容过大'); chunks.push(Buffer.from(chunk)); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, '无效的 JSON 请求'); }
}
export function createApi(options: ApiOptions) {
  if (options.token.length < 32) throw new Error('APP_ACCESS_TOKEN 至少需要 32 个字符，请运行 npm run setup 生成');
  const access = Buffer.from(`Bearer ${options.token}`);
  const clients = new Map<string, { count: number; until: number }>();
  let globalHour = 0; let globalCount = 0; let active = 0;
  const server = createServer((req, res) => { void handle(req, res); });
  server.requestTimeout = 20000; server.headersTimeout = 10000;
  function send(res: ServerResponse, status: number, data: unknown) {
    if (res.destroyed || res.writableEnded) return;
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data));
  }
  async function handle(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    const origin = req.headers.origin;
    if (origin) {
      if (!options.origins?.includes(origin)) { send(res, 403, { error: '不允许的网页来源' }); return; }
      res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const now = Date.now();
    for (const [key, value] of clients) if (value.until <= now) clients.delete(key);
    const ip = req.socket.remoteAddress ?? 'unknown'; const client = clients.get(ip) ?? { count: 0, until: now + 60000 };
    if (clients.size >= 2048 && !clients.has(ip) || ++client.count > 30) { send(res, 429, { error: '请求过于频繁，请稍后再试' }); return; }
    clients.set(ip, client);
    const supplied = Buffer.from(req.headers.authorization ?? '');
    if (supplied.length !== access.length || !timingSafeEqual(supplied, access)) { send(res, 401, { error: '服务访问码不正确，请检查设置' }); return; }
    if (req.url === '/health' && req.method === 'GET') { send(res, 200, { ok: true, configured: options.configured, provider: 'DeepSeek' }); return; }
    if (req.url !== '/api/analyze' || req.method !== 'POST') { send(res, 404, { error: '接口不存在' }); return; }
    if (!options.configured) { send(res, 503, { error: '服务端尚未配置 DeepSeek API 密钥' }); return; }
    if (!req.headers['content-type']?.startsWith('application/json')) { send(res, 415, { error: '请使用 JSON 请求' }); return; }
    const hour = Math.floor(now / 3600000); if (globalHour !== hour) { globalHour = hour; globalCount = 0; }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let reserved = false;
    try {
      const parsed = requestSchema.safeParse(await readJson(req));
      if (!parsed.success) throw new HttpError(400, '记录数据无效或超出限制，请检查后重试');
      if (active >= 2 || globalCount >= (options.hourlyLimit ?? 20)) throw new HttpError(429, '当前分析次数已达上限，请稍后重试');
      globalCount++; active++; reserved = true;
      timer = setTimeout(() => controller.abort(), 45000);
      res.once('close', () => { if (!res.writableEnded) controller.abort(); });
      const generated = analysisSchema.parse(await options.generate(parsed.data, controller.signal));
      if (parsed.data.records.some(e => e.symptoms.length)) generated.seekCare = ['你勾选了需要关注的不适，请及时联系医护人员；症状严重、出血较多或伴晕厥时应立即寻求紧急帮助，不要等待 AI 分析。', ...generated.seekCare].slice(0, 6);
      send(res, 200, { analysis: generated, provider: 'DeepSeek' });
    } catch(e) {
      // Do not log prompts, health records, provider errors or credentials.
      if (e instanceof HttpError) send(res, e.status, { error: e.message });
      else if (controller.signal.aborted) send(res, 504, { error: '分析超时或请求已取消，请稍后重试' });
      else send(res, 502, { error: 'AI 服务暂时无法完成分析，请检查服务端密钥、额度和网络后重试' });
    } finally { if (timer) clearTimeout(timer); if (reserved) active--; }
  }
  return server;
}
