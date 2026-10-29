import { validateServerUrl, type Analysis } from './domain';
export async function apiRequest(serverUrl: string, token: string, path: string, body?: unknown, signal?: AbortSignal) {
  const base = validateServerUrl(serverUrl, __DEV__);
  if (!token.trim()) throw new Error('请先在设置中填写服务访问码');
  const response = await fetch(`${base}${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? `服务返回错误（${response.status}）`);
  return data;
}
export function readAnalysis(value: unknown): Analysis {
  if (!value || typeof value !== 'object') throw new Error('分析结果格式不正确，请重试');
  const a = value as Analysis;
  if (typeof a.summary !== 'string' || typeof a.limitations !== 'string' || ![a.observations, a.suggestions, a.seekCare].every(list => Array.isArray(list) && list.every(item => typeof item === 'string'))) throw new Error('分析结果不完整，请重试');
  return a;
}
