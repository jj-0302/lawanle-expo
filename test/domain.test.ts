import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { analysisPayload, createBackup, dayKey, normalizeEntry, parseBackup, parseDateInput, recentEntries, statistics, streak, validateServerUrl, type Entry } from '../src/domain';
const now = new Date(2026, 9, 29, 12).getTime();
const make = (ts: number, n = 4): Entry => ({ id: `e-${ts}-${n}`, ts, n, smooth: null, dur: null, note: '私人备注', symptoms: [] });
test('本地日期、闰日、非法日期和未来时间', () => {
  assert.equal(dayKey(now), '2026-10-29');
  assert.equal(new Date(parseDateInput('2024-02-29 09:30', now)).getDate(), 29);
  for (const text of ['2025-02-29 09:30', '2026-13-01 10:00', '2026-10-29 25:00', '2026-10-30 09:30']) assert.throws(() => parseDateInput(text, now));
});
test('21 天窗口边界不计入未来和 21 天之前的数据', () => {
  const start = new Date(2026, 9, 9).getTime();
  const list = [make(start), make(start - 1), make(now), make(now + 60000)];
  assert.equal(recentEntries(list, 21, now).length, 2);
});
test('连续记录允许昨天结束，不把缺一天算连续', () => {
  const yesterday = new Date(2026, 9, 28, 12).getTime();
  const before = new Date(2026, 9, 27, 12).getTime();
  assert.equal(streak([make(yesterday), make(before)], now), 2);
  assert.equal(streak([make(before)], now), 0);
  assert.equal(streak([make(now), make(yesterday), make(before)], now), 3);
});
test('统计区分无数据和零占比，不丢失未选字段', () => {
  assert.equal(statistics([], now).formed, null);
  assert.equal(statistics([make(now, 1)], now).formed, 0);
  assert.equal(statistics([make(now), make(now - 1000, 3), make(now - 2000, 7)], now).formed, 67);
  assert.equal(statistics([make(now)], now).days.at(-1)?.count, 1);
});
test('备份往返、旧版迁移及损坏数据拒绝', () => {
  const entry = make(now);
  assert.deepEqual(parseBackup(createBackup([entry]), now), [entry]);
  const old = parseBackup(JSON.stringify([{ ts: now, n: 3, smooth: 0, dur: null }]), now)[0];
  assert.equal(old.smooth, 0); assert.equal(old.dur, null);
  assert.throws(() => parseBackup('{bad', now));
  assert.throws(() => parseBackup(JSON.stringify([entry, entry]), now));
  assert.throws(() => normalizeEntry({ ...entry, n: 8 }, 0, now));
  assert.throws(() => normalizeEntry({ ...entry, symptoms: ['未知症状'] }, 0, now));
});
test('仅发送近期记录，备注默认排除，身份编号与精确时间不上传', () => {
  const entry = make(now);
  const data = analysisPayload([entry, make(new Date(2026, 8, 1).getTime())], '  帮我看看  ', false, now);
  assert.equal(data.records.length, 1); assert.equal(data.question, '帮我看看');
  assert.equal('note' in data.records[0], false); assert.equal('id' in data.records[0], false); assert.equal('ts' in data.records[0], false);
  assert.equal(analysisPayload([entry], '', true, now).records[0].note, '私人备注');
});
test('生产服务地址必须 HTTPS，不允许内嵌密码或附加参数', () => {
  assert.equal(validateServerUrl('https://example.com/'), 'https://example.com');
  assert.equal(validateServerUrl('http://192.168.1.2:8787', true), 'http://192.168.1.2:8787');
  for (const url of ['http://example.com', 'https://user:secret@example.com', 'https://example.com/?key=secret', 'https://example.com/api']) assert.throws(() => validateServerUrl(url));
});
