import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { createBackup, parseBackup, type Entry } from './domain';
export async function exportBackup(entries: Entry[]) {
  const name = `lawanle-backup-${new Date().toISOString().slice(0,10)}.json`;
  const text = createBackup(entries);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error('当前设备不支持文件分享');
  const file = new File(Paths.cache, name); file.write(text);
  try { await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: '保存记录备份' }); } finally { if (file.exists) file.delete(); }
}
export async function importBackup() {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > 5 * 1024 * 1024) throw new Error('备份文件不能超过 5 MB');
  try {
    const text = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
    if (text.length > 5 * 1024 * 1024) throw new Error('备份文件过大');
    return parseBackup(text);
  } finally { if (Platform.OS !== 'web') { const file = new File(asset.uri); if (file.exists && asset.uri.startsWith(Paths.cache.uri)) file.delete(); } }
}
