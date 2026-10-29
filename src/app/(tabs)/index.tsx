import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { dayKey, streak, TYPES, dateInput } from '../../domain';
import { useStore } from '../../store';
import { Button, C, Card, Heading, Label, Screen, Stool, s } from '../../ui';
export default function Today() {
  const { entries } = useStore();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); const sub = AppState.addEventListener('change', () => setNow(Date.now())); return () => { clearInterval(timer); sub.remove(); }; }, []);
  const today = entries.filter(e => dayKey(e.ts) === dayKey(now));
  return <Screen>
    <View style={s.spread}><Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>拉完了<Text style={{ color: C.green }}>▪</Text></Text><Text style={s.body}>{new Date(now).getMonth()+1} 月 {new Date(now).getDate()} 日</Text></View>
    <View style={{ paddingVertical: 20 }}><Text style={s.eyebrow}>一点记录，多一点了解</Text><View style={[s.row, { alignItems: 'baseline' }]}><Text style={{ color: C.text, fontSize: 112, fontWeight: '900', letterSpacing: -7 }}>{streak(entries, now)}</Text><View><Text style={s.label}>天</Text><Text style={s.body}>连续记录</Text></View></View></View>
    <Card><Heading eyebrow={today.length ? 'TODAY · 已记录' : 'TODAY · 从今天开始'} title={today.length ? '今天，也照顾自己' : '身体的日常，记一下'} detail={today.length ? `今天已记录 ${today.length} 次。每一次变化，都值得被看见。` : '形态、感受、用时。十几秒，留下一个观察自己的线索。'} /><Button title="＋ 记录一次" onPress={() => router.push('/record')} /></Card>
    <View style={[s.spread, { marginTop: 12 }]}><Label>最近记录</Label><Text style={s.body}>共 {entries.length} 条</Text></View>
    {!entries.length ? <Card><Text style={s.body}>还没有记录。这里将按时间展示你的排便记录，点击记录可以修改或删除。</Text></Card> : entries.slice(0, 30).map(e => <Pressable key={e.id} accessibilityRole="button" accessibilityLabel={`编辑 ${dateInput(e.ts)} 的记录`} onPress={() => router.push({ pathname: '/record', params: { id: e.id } })} style={[s.row, { paddingVertical: 12, borderBottomWidth: 1, borderColor: C.border }]}><Stool n={e.n} color={e.n === 3 || e.n === 4 ? C.green : C.muted} /><View style={{ flex: 1, gap: 4 }}><Text style={s.label}>{e.n} 型 · {TYPES[e.n-1].title}</Text><Text style={s.body}>{dateInput(e.ts)}{e.symptoms.length ? ' · 有不适' : ''}</Text></View><Text style={{ color: C.muted }}>›</Text></Pressable>)}
    {entries.length > 30 ? <Text style={s.body}>这里展示最近 30 条，完整记录可在设置中导出。</Text> : null}
    <Text style={[s.body, { fontSize: 12 }]}>● 记录保存在本机。AI 分析仅在你确认后发送所选数据。</Text>
  </Screen>;
}
