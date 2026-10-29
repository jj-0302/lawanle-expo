import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ReactNode } from 'react';
export const C = { bg: '#0A0C0B', card: '#151A17', green: '#66D69A', muted: '#96A59B', text: '#F0F2E9', border: '#29362E', danger: '#FFB19B' };
export function Screen({ children }: { children: ReactNode }) { return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>{children}</ScrollView></SafeAreaView>; }
export function Heading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) { return <View style={{ gap: 9, marginBottom: 24 }}><Text style={s.eyebrow}>{eyebrow}</Text><Text accessibilityRole="header" style={s.title}>{title}<Text style={{ color: C.green }}>▪</Text></Text>{detail ? <Text style={s.body}>{detail}</Text> : null}</View>; }
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) { return <View style={[s.card, style]}>{children}</View>; }
export function Button({ title, onPress, disabled, secondary, danger, loading }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; danger?: boolean; loading?: boolean }) { return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled || !!loading }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, danger && { backgroundColor: '#42241E' }, (disabled || loading) && { opacity: .45 }, pressed && { opacity: .7 }]}>{loading ? <ActivityIndicator color={secondary ? C.green : C.bg} /> : null}<Text style={[s.buttonText, secondary && { color: C.text }, danger && { color: C.danger }]}>{title}</Text></Pressable>; }
export function Label({ children }: { children: ReactNode }) { return <Text style={s.label}>{children}</Text>; }
export function Chip({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={[s.chip, selected && { backgroundColor: '#203C2C', borderColor: C.green }]}><Text style={{ color: selected ? C.green : C.muted, fontWeight: '600' }}>{title}</Text></Pressable>; }
export function Stool({ n, color = C.green }: { n: number; color?: string }) {
  return <Svg width={52} height={34} viewBox="0 0 56 38" fill="none" stroke={color} strokeWidth={2}>
    {n === 1 ? [12, 28, 44].map(x => <Circle key={x} cx={x} cy={19} r={5} />) : n === 2 ? <Path d="M7 19q0-8 8-5q5-5 10-1q6-4 11 0q12-1 12 7q0 8-10 5q-8 4-13 0q-5 4-10-1q-8 2-8-5Z" /> : n === 3 || n === 4 ? <><Rect x={6} y={13} width={44} height={13} rx={n === 4 ? 7 : 4} />{n === 3 ? <Path d="M19 13l3 6l-3 7M33 13l-3 6l3 7" /> : null}</> : n === 5 ? <><Rect x={7} y={12} width={17} height={15} rx={6} /><Rect x={30} y={12} width={17} height={15} rx={6} /></> : n === 6 ? [10, 22, 34, 46].map((x, i) => <Rect key={x} x={x-3} y={i % 2 ? 19 : 11} width={7} height={7} rx={1} />) : <Path d="M5 13q6-5 12 0t12 0t12 0t10 0M5 24q6-5 12 0t12 0t12 0t10 0" />}
  </Svg>;
}
export function message(title: string, body: string) { if (Platform.OS === 'web') window.alert(`${title}\n\n${body}`); else Alert.alert(title, body); }
export function confirm(title: string, body: string, action: () => void, destructive = false) {
  if (Platform.OS === 'web') { if (window.confirm(`${title}\n\n${body}`)) action(); }
  else Alert.alert(title, body, [{ text: '取消', style: 'cancel' }, { text: destructive ? '确认删除' : '确认并继续', style: destructive ? 'destructive' : 'default', onPress: action }]);
}
export const errorText = (error: unknown) => error instanceof Error ? error.message : '操作失败，请重试';
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, page: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 24, paddingBottom: 40, gap: 16 },
  eyebrow: { color: C.green, fontSize: 11, fontWeight: '800', letterSpacing: 2 }, title: { color: C.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  body: { color: C.muted, fontSize: 14, lineHeight: 23 }, card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 20, borderRadius: 20, gap: 12 },
  label: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 2 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  button: { backgroundColor: C.green, paddingVertical: 16, paddingHorizontal: 18, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  buttonText: { color: C.bg, fontWeight: '800', fontSize: 15 }, secondary: { backgroundColor: '#202B24', borderWidth: 1, borderColor: C.border },
  input: { backgroundColor: C.bg, borderColor: C.border, borderWidth: 1, borderRadius: 12, color: C.text, padding: 14, fontSize: 15, minHeight: 50 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, minHeight: 44, justifyContent: 'center' },
  number: { color: C.text, fontSize: 48, fontWeight: '900', letterSpacing: -2 }, divider: { height: 1, backgroundColor: C.border }, danger: { color: C.danger, fontSize: 14, lineHeight: 23 },
});
