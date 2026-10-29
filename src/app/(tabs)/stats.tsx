import { Text, View } from 'react-native';
import { statistics, TYPES } from '../../domain';
import { useStore } from '../../store';
import { C, Card, Heading, Label, Screen, s } from '../../ui';
export default function Stats() {
  const { entries } = useStore(); const data = statistics(entries);
  const max = Math.max(1, ...data.days.map(d => d.count));
  return <Screen><Heading eyebrow="YOUR RHYTHM · 近 21 天" title="看见自己的节奏" detail="记录呈现变化，单一形态和频率不能判断健康状况。" />
    <View style={s.row}><Card style={{ flex: 1 }}><Text style={[s.number, { color: C.green }]}>{data.total}</Text><Text style={s.body}>记录次数</Text></Card><Card style={{ flex: 1 }}><Text style={s.number}>{data.formed ?? '—'}<Text style={{ fontSize: 18 }}>{data.formed === null ? '' : '%'}</Text></Text><Text style={s.body}>3–4 型占比</Text></Card></View>
    <Card><Label>近 7 天 · 每日记录次数</Label><View style={{ flexDirection: 'row', height: 180, gap: 12, alignItems: 'flex-end', marginTop: 10 }}>{data.days.map((d,i) => <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}><Text style={s.body}>{d.count}</Text><View style={{ height: Math.max(4, d.count / max * 112), width: '100%', backgroundColor: i === 6 ? C.green : '#41684F', borderRadius: 5 }} /><Text style={s.body}>{d.label}</Text></View>)}</View></Card>
    <Card><Label>近 21 天 · 形态分布</Label>{TYPES.map((t, i) => <View key={t.n} style={s.row}><Text style={[s.body, { width: 32 }]}>{t.n} 型</Text><View style={{ flex: 1, backgroundColor: C.border, height: 9, borderRadius: 5 }}><View style={{ width: `${data.total ? data.counts[i] / data.total * 100 : 0}%`, backgroundColor: t.n === 3 || t.n === 4 ? C.green : '#7C9584', height: 9, borderRadius: 5 }} /></View><Text style={[s.body, { width: 26, textAlign: 'right' }]}>{data.counts[i]}</Text></View>)}</Card>
    <Text style={s.body}>{data.total ? '留意相对你平时的变化，也可以在 AI 分析中补充饮食、作息或不适情况。' : '开始记录后，这里会出现你的数据。没有记录的日期不代表当天没有排便。'}</Text>
  </Screen>;
}
