export const TYPES = [
  { n: 1, title: '一颗颗硬球', description: '分离的小硬块，像坚果' },
  { n: 2, title: '块状硬便', description: '香肠状，表面结块' },
  { n: 3, title: '带裂纹香肠', description: '成形，表面有裂缝' },
  { n: 4, title: '光滑香肠', description: '柔软、光滑、成形' },
  { n: 5, title: '边缘清晰软块', description: '柔软的小块，轮廓清楚' },
  { n: 6, title: '糊状蓬松', description: '边缘毛糙，比较松散' },
  { n: 7, title: '水样', description: '几乎都是液体' },
] as const;
export const COMFORT = ['很顺畅', '正常', '有点费劲', '很费劲'];
export const DURATION = ['不足 1 分钟', '1–3 分钟', '3–5 分钟', '超过 5 分钟'];
export const SYMPTOMS = ['血便或黑便', '持续或剧烈腹痛', '发热或呕吐', '明显口渴、尿少或头晕'] as const;
export type Entry = { id: string; ts: number; n: number; smooth: number | null; dur: number | null; note: string; symptoms: string[] };
export type Analysis = { summary: string; observations: string[]; suggestions: string[]; seekCare: string[]; limitations: string };
export type Settings = { serverUrl: string };

export function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function dateInput(ts: number) {
  const d = new Date(ts);
  return `${dayKey(ts)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export function parseDateInput(value: string, now = Date.now()) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error('时间格式应为 2026-10-29 09:30');
  const [, y, month, day, h, min] = m.map(Number);
  const d = new Date(y, month - 1, day, h, min);
  if (dateInput(d.getTime()) !== value || d.getTime() < new Date(2000, 0, 1).getTime() || d.getTime() > now + 60000) throw new Error('请选择有效的过去或当前时间');
  return d.getTime();
}
export function recentEntries(entries: Entry[], days = 21, now = Date.now()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - days + 1);
  return entries.filter(e => e.ts >= start.getTime() && e.ts <= now);
}
export function streak(entries: Entry[], now = Date.now()) {
  const keys = new Set(entries.filter(e => e.ts <= now).map(e => dayKey(e.ts)));
  const d = new Date(now);
  if (!keys.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  let count = 0;
  while (keys.has(dayKey(d.getTime()))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}
export function statistics(entries: Entry[], now = Date.now()) {
  const list = recentEntries(entries, 21, now);
  const counts = TYPES.map(t => list.filter(e => e.n === t.n).length);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now); date.setDate(date.getDate() - 6 + i);
    return { label: i === 6 ? '今' : '日一二三四五六'[date.getDay()], count: list.filter(e => dayKey(e.ts) === dayKey(date.getTime())).length };
  });
  return { list, counts, days, total: list.length, formed: list.length ? Math.round((counts[2] + counts[3]) / list.length * 100) : null };
}
function integer(value: unknown, min: number, max: number): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max; }
export function normalizeEntry(value: unknown, index = 0, now = Date.now()): Entry {
  if (!value || typeof value !== 'object') throw new Error('记录格式不正确');
  const e = value as Record<string, unknown>;
  if (typeof e.ts !== 'number' || !Number.isFinite(e.ts) || e.ts < new Date(2000, 0, 1).getTime() || e.ts > now + 60000 || !integer(e.n, 1, 7)) throw new Error('记录日期或类型无效');
  if (e.smooth != null && !integer(e.smooth, 0, 3) || e.dur != null && !integer(e.dur, 0, 3)) throw new Error('记录选项无效');
  if (e.note != null && (typeof e.note !== 'string' || e.note.length > 500)) throw new Error('备注最多 500 字');
  if (e.symptoms != null && (!Array.isArray(e.symptoms) || e.symptoms.some(s => !SYMPTOMS.includes(s as typeof SYMPTOMS[number])))) throw new Error('症状选项无效');
  return { id: typeof e.id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(e.id) ? e.id : `legacy-${e.ts}-${index}`, ts: e.ts, n: e.n, smooth: (e.smooth ?? null) as number | null, dur: (e.dur ?? null) as number | null, note: (e.note ?? '') as string, symptoms: (e.symptoms ?? []) as string[] };
}
export function parseBackup(text: string, now = Date.now()): Entry[] {
  const data = JSON.parse(text);
  const rows = Array.isArray(data) ? data : data?.version === 1 && Array.isArray(data.entries) ? data.entries : null;
  if (!rows || rows.length > 10000) throw new Error('请选择有效的备份文件（最多 10000 条）');
  const result: Entry[] = rows.map((e: unknown, i: number) => normalizeEntry(e, i, now));
  if (new Set(result.map(e => e.id)).size !== result.length) throw new Error('备份中有重复的记录编号');
  return result;
}
export function createBackup(entries: Entry[]) { return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries }, null, 2); }
export function analysisPayload(entries: Entry[], question: string, includeNotes: boolean, now = Date.now()) {
  return { version: 1, question: question.trim(), records: recentEntries(entries, 21, now).sort((a, b) => a.ts - b.ts).map(e => ({ date: dayKey(e.ts), type: e.n, comfort: e.smooth === null ? null : COMFORT[e.smooth], duration: e.dur === null ? null : DURATION[e.dur], symptoms: e.symptoms, ...(includeNotes ? { note: e.note } : {}) })) };
}
export function validateServerUrl(value: string, development = false) {
  const url = new URL(value.trim());
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('请填写服务端根地址，不包含路径、密码或参数');
  if (url.protocol !== 'https:' && !(development && url.protocol === 'http:')) throw new Error('正式使用需要 HTTPS 地址');
  return url.origin;
}
