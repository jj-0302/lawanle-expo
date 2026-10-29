import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { COMFORT, DURATION, SYMPTOMS, TYPES, dateInput, parseDateInput } from '../domain';
import { useStore } from '../store';
import { Button, C, Card, Chip, Heading, Label, Screen, Stool, confirm, errorText, message, s } from '../ui';
export default function Record() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { entries, save, remove, busy } = useStore(); const existing = entries.find(e => e.id === id);
  const [step, setStep] = useState(existing ? 1 : 0);
  const [n, setN] = useState<number | null>(existing?.n ?? null);
  const [smooth, setSmooth] = useState<number | null>(existing?.smooth ?? null);
  const [dur, setDur] = useState<number | null>(existing?.dur ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [time, setTime] = useState(() => dateInput(existing?.ts ?? Date.now()));
  const [symptoms, setSymptoms] = useState(existing?.symptoms ?? []);
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (n === null || saving) return; setSaving(true);
    try { await save({ id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2,10)}`, ts: parseDateInput(time), n, smooth, dur, note: note.trim(), symptoms }); router.back(); }
    catch(e) { message('未能保存', errorText(e)); } finally { setSaving(false); }
  }
  if (id && !existing) return <Screen><Heading eyebrow="记录" title="记录已不存在" /><Button title="返回" onPress={() => router.back()} /></Screen>;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen>
    <View style={s.spread}><Text style={s.eyebrow}>{existing ? '编辑记录' : `记录 · ${step + 1} / 2`}</Text><Button title="关闭" secondary disabled={saving} onPress={() => router.back()} /></View>
    <Heading eyebrow="CHECK IN" title={step === 0 ? '这次是哪一型？' : '再记一点感受'} detail={step === 0 ? '布里斯托形态分类 · 选择最接近的一项' : '感受和备注可以留空。记录时间也可以修改。'} />
    {step === 0 ? <>{TYPES.map(t => <Pressable key={t.n} accessibilityRole="radio" accessibilityState={{ checked: n === t.n }} onPress={() => setN(t.n)} style={[s.card, s.row, { padding: 14, borderColor: n === t.n ? C.green : C.border }]}><Stool n={t.n} color={n === t.n ? C.green : C.muted} /><View style={{ flex: 1 }}><Text style={s.label}>{t.title}</Text><Text style={[s.body, { fontSize: 12 }]}>{t.description}</Text></View><Text style={{ color: C.green }}>{t.n}</Text></Pressable>)}<Button title="下一步" disabled={n === null} onPress={() => setStep(1)} /></> : <>
      <Card><Label>形态</Label><View style={s.chips}>{TYPES.map(t => <Chip key={t.n} title={`${t.n} 型`} selected={n === t.n} onPress={() => setN(t.n)} />)}</View></Card>
      <Label>记录时间</Label><TextInput accessibilityLabel="记录时间" style={s.input} value={time} onChangeText={setTime} placeholder="2026-10-29 09:30" placeholderTextColor={C.muted} autoCapitalize="none" />
      <Label>顺畅程度 · 可选</Label><View style={s.chips}>{COMFORT.map((label,i) => <Chip key={label} title={label} selected={smooth === i} onPress={() => setSmooth(smooth === i ? null : i)} />)}</View>
      <Label>用时 · 可选</Label><View style={s.chips}>{DURATION.map((label,i) => <Chip key={label} title={label} selected={dur === i} onPress={() => setDur(dur === i ? null : i)} />)}</View>
      <Label>是否有这些不适？· 可选</Label><View style={s.chips}>{SYMPTOMS.map(label => <Chip key={label} title={label} selected={symptoms.includes(label)} onPress={() => setSymptoms(symptoms.includes(label) ? symptoms.filter(s => s !== label) : [...symptoms, label])} />)}</View>
      {symptoms.length ? <Card><Text style={s.danger}>这些情况需要医护人员评估；症状明显、出血较多或伴晕厥时，应及时寻求紧急帮助。不要等待 AI 分析。</Text></Card> : null}
      <Label>备注 · 可选</Label><TextInput accessibilityLabel="备注" multiline maxLength={500} value={note} onChangeText={setNote} placeholder="比如今天的饮食、作息、感受……" placeholderTextColor={C.muted} style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]} />
      <Button title="保存记录" loading={saving} disabled={busy || n === null} onPress={() => void submit()} />
      {!existing ? <Button title="返回选择形态" secondary disabled={saving} onPress={() => setStep(0)} /> : <Button title="删除这条记录" danger disabled={busy || saving} onPress={() => confirm('删除记录？', '删除后无法撤销。', () => { void remove(existing.id).then(() => router.back()).catch(e => message('删除失败', errorText(e))); }, true)} />}
    </>}
  </Screen></KeyboardAvoidingView>;
}
