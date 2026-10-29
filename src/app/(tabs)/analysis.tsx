import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Switch, Text, TextInput, View } from 'react-native';
import { apiRequest, readAnalysis } from '../../api';
import { analysisPayload, recentEntries, type Analysis, type Entry } from '../../domain';
import { useStore } from '../../store';
import { Button, C, Card, Heading, Label, Screen, confirm, errorText, s } from '../../ui';
export default function AnalysisScreen() {
  const { entries, settings, token } = useStore();
  const [question, setQuestion] = useState(''); const [includeNotes, setIncludeNotes] = useState(false);
  const [report, setReport] = useState<{ analysis: Analysis; entries: Entry[]; url: string; token: string } | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), [entries, settings.serverUrl, token]);
  const result = report?.entries === entries && report.url === settings.serverUrl && report.token === token ? report.analysis : null;
  const records = recentEntries(entries);
  const hasSymptoms = records.some(e => e.symptoms.length);
  async function analyze() {
    if (controller.current) return;
    const request = new AbortController(); controller.current = request;
    const timeout = setTimeout(() => request.abort(), 60000);
    setLoading(true); setError(''); setReport(null);
    try { const data = await apiRequest(settings.serverUrl, token, '/api/analyze', analysisPayload(entries, question, includeNotes), request.signal); setReport({ analysis: readAnalysis(data.analysis), entries, url: settings.serverUrl, token }); setGeneratedAt(new Date().toLocaleString('zh-CN')); }
    catch(e) { setError(request.signal.aborted ? '请求已取消或超时。可以稍后重试。' : errorText(e)); }
    finally { clearTimeout(timeout); controller.current = null; setLoading(false); }
  }
  function requestAnalysis() {
    confirm('发送这些数据给 DeepSeek？', `将发送最近 21 天的 ${records.length} 条记录（日期、形态、顺畅程度、用时、不适选项）${includeNotes ? '、记录备注' : '，不含记录备注'}，以及你输入的补充情况。数据经过你配置的服务端转发给 DeepSeek；应用不自动上传其他记录。`, () => void analyze());
  }
  return <Screen><Heading eyebrow="POWERED BY DEEPSEEK" title="多了解一点自己" detail="结合你的记录，梳理变化、整理日常建议和就医时可以补充的信息。" />
    <Card><View style={s.spread}><Label>近 21 天</Label><Text style={{ color: C.green, fontWeight: '800' }}>{records.length} 条记录</Text></View><Text style={s.body}>记录不等于完整病史。AI 不能诊断疾病或代替医护人员，也不能确认没有记录的日期是否排便。</Text></Card>
    {hasSymptoms ? <Card style={{ borderColor: '#825143' }}><Text style={s.danger}>你近期记录了需要关注的不适。请及时联系医护人员；出血较多、剧烈腹痛或伴晕厥等情况应立即寻求帮助，无需等待分析。</Text></Card> : null}
    <Label>想补充什么？· 可选</Label><TextInput accessibilityLabel="分析补充情况" value={question} onChangeText={value => { setQuestion(value); setReport(null); }} editable={!loading} maxLength={1000} multiline placeholder="比如最近的饮食变化、作息、症状持续多久……请勿填写姓名、电话等身份信息。" placeholderTextColor={C.muted} style={[s.input, { minHeight: 130, textAlignVertical: 'top' }]} />
    <View style={s.spread}><View style={{ flex: 1 }}><Label>同时发送记录备注</Label><Text style={s.body}>默认关闭，可减少分享的信息。</Text></View><Switch accessibilityLabel="发送记录备注" value={includeNotes} onValueChange={setIncludeNotes} disabled={loading} trackColor={{ true: '#315E42', false: C.border }} thumbColor={includeNotes ? C.green : C.muted} /></View>
    {!settings.serverUrl || !token ? <Card><Text style={s.body}>尚未连接 AI 服务。在设置中连接你的 DeepSeek 服务端后即可使用。</Text><Button title="前往设置" secondary onPress={() => router.push('/settings')} /></Card> : <Button title={loading ? '正在分析…' : '生成 AI 分析'} loading={loading} disabled={!records.length && !question.trim() || records.length > 1000} onPress={requestAnalysis} />}
    {loading ? <Button title="取消分析" secondary onPress={() => controller.current?.abort()} /> : null}
    {records.length > 1000 ? <Text style={s.danger}>近期记录超过单次分析上限（1000 条），请先整理数据。</Text> : null}
    {error ? <Card><Text accessibilityRole="alert" style={s.danger}>{error}</Text><Text style={s.body}>你的本地记录不受影响。</Text></Card> : null}
    {result ? <><View style={s.divider} /><Text style={s.eyebrow}>分析生成于 {generatedAt}</Text><Card style={{ borderColor: C.green }}><Label>记录概览</Label><Text style={{ color: C.text, fontSize: 17, lineHeight: 28 }}>{result.summary}</Text></Card>{([{ title: '观察到的变化', rows: result.observations }, { title: '可以尝试的日常调整', rows: result.suggestions }, { title: '何时寻求帮助', rows: result.seekCare }]).map(group => <Card key={group.title}><Label>{group.title}</Label>{group.rows.length ? group.rows.map((text,i) => <Text key={i} style={s.body}>• {text}</Text>) : <Text style={s.body}>未提供额外信息，不能据此排除健康问题。</Text>}</Card>)}<Text style={s.body}>{result.limitations}</Text><Button title="清除本次分析" secondary onPress={() => setReport(null)} /></> : null}
    <Text style={[s.body, { fontSize: 12 }]}>参考健康信息来自 NIDDK；AI 输出未经医生审核，不应作为诊断、处方或紧急处置依据。</Text><Button title="查看参考资料" secondary onPress={() => { void Linking.openURL('https://www.niddk.nih.gov/health-information/digestive-diseases').catch(() => setError('无法打开参考资料')); }} />
  </Screen>;
}

