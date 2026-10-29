import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { apiRequest } from '../../api';
import { exportBackup, importBackup } from '../../backup';
import { validateServerUrl } from '../../domain';
import { useStore } from '../../store';
import { Button, C, Card, Heading, Label, Screen, confirm, errorText, message, s } from '../../ui';
export default function Settings() {
  const { entries, settings, token, configure, merge, clear, busy } = useStore();
  const [url, setUrl] = useState(settings.serverUrl); const [access, setAccess] = useState(token); const [working, setWorking] = useState(false); const [status, setStatus] = useState('');
  async function saveSettings() { setWorking(true); try { await configure({ serverUrl: url.trim() ? validateServerUrl(url, __DEV__) : '' }, access); setStatus('设置已保存'); } catch(e) { setStatus(errorText(e)); } finally { setWorking(false); } }
  async function check() { setWorking(true); const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 10000); try { const health = await apiRequest(url, access, '/health', undefined, abort.signal); setStatus(health.configured ? '连接正常，DeepSeek 已配置。实际分析仍需要有效密钥和可用额度。' : '服务已连接，但服务端尚未配置 DeepSeek 密钥。'); } catch(e) { setStatus(abort.signal.aborted ? '连接超时，请检查地址和网络' : errorText(e)); } finally { clearTimeout(timer); setWorking(false); } }
  async function backup() { setWorking(true); try { await exportBackup(entries); } catch(e) { message('导出失败', errorText(e)); } finally { setWorking(false); } }
  async function restore() { setWorking(true); try { const imported = await importBackup(); if (imported) confirm('导入备份？', `将合并 ${imported.length} 条记录，已有编号的记录将保留。`, () => { void merge(imported).then(() => message('导入完成', '记录已合并到本机。')).catch(e => message('导入失败', errorText(e))); }); } catch(e) { message('导入失败', errorText(e)); } finally { setWorking(false); } }
  return <Screen><Heading eyebrow="YOUR SPACE" title="数据，由你掌握" detail="记录默认保存在这台设备。换手机、清除应用或卸载前，请先导出备份。" />
    <Card><Label>AI 服务连接</Label><Text style={s.body}>填写配套服务端地址和访问码。DeepSeek API 密钥仅保存在服务端，无需填入应用。</Text><TextInput accessibilityLabel="AI 服务端地址" value={url} onChangeText={value => { setUrl(value); setStatus(''); }} style={s.input} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder={__DEV__ ? 'http://电脑局域网IP:8787' : 'https://你的服务域名'} placeholderTextColor={C.muted} /><TextInput accessibilityLabel="服务访问码" value={access} onChangeText={setAccess} style={s.input} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="服务访问码（不是 DeepSeek 密钥）" placeholderTextColor={C.muted} /><Button title="保存连接设置" disabled={working} onPress={() => void saveSettings()} /><Button title="测试连接" secondary disabled={working || !url || !access} onPress={() => void check()} />{status ? <Text style={s.body}>{status}</Text> : null}</Card>
    <Card><Label>本地记录 · {entries.length} 条</Label><Text style={s.body}>备份文件包含你的健康记录，请存放在可信的位置。导入时合并记录，不覆盖已有编号。</Text><Button title="导出备份文件" secondary disabled={working || busy} onPress={() => void backup()} /><Button title="导入备份文件" secondary disabled={working || busy} onPress={() => void restore()} /></Card>
    <Card><Label>隐私说明</Label><Text style={s.body}>本机记录不自动同步。点击 AI 分析并确认后，最近 21 天的记录和输入内容会发送到所配置的服务端，再转发给 DeepSeek。备注可自行选择是否发送。</Text><Text style={s.body}>配套服务端不写入记录或分析内容，但部署平台和 AI 提供方有各自的数据处理政策。访问码在手机系统安全存储中保存；网页预览中仅保留在当前浏览器会话。</Text><Text style={s.body}>本机记录使用应用本地存储，未额外加密。AI 结果仅在当前页面内存中显示。请勿在补充情况中输入姓名、证件或联系方式。</Text></Card>
    <Button title="断开 AI 服务" secondary disabled={working} onPress={() => { void configure({ serverUrl: '' }, '').then(() => { setUrl(''); setAccess(''); setStatus('已清除连接设置和访问码'); }).catch(e => message('操作失败', errorText(e))); }} />
    <Button title="删除本机全部记录" danger disabled={busy || working || !entries.length} onPress={() => confirm('删除全部记录？', '此操作无法撤销。建议先导出备份。', () => { void clear().then(() => message('已删除', '本机记录已清空。')).catch(e => message('删除失败', errorText(e))); }, true)} />
    <Text style={[s.body, { fontSize: 12, textAlign: 'center' }]}>拉完了 1.0 · 记录日常，了解自己</Text>
  </Screen>;
}
