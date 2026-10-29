import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { normalizeEntry, parseBackup, type Entry, type Settings } from './domain';

const RECORD_KEY = 'lawanle.entries.v1';
const SETTING_KEY = 'lawanle.settings.v1';
const TOKEN_KEY = 'lawanle.server-token';
const DEFAULT_SETTINGS: Settings = { serverUrl: process.env.EXPO_PUBLIC_API_URL ?? '' };
const readToken = () => Platform.OS === 'web' ? Promise.resolve(sessionStorage.getItem(TOKEN_KEY) ?? '') : SecureStore.getItemAsync(TOKEN_KEY).then(v => v ?? '');
async function writeToken(value: string) {
  if (Platform.OS === 'web') { if (value) sessionStorage.setItem(TOKEN_KEY, value); else sessionStorage.removeItem(TOKEN_KEY); }
  else if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
type Store = {
  entries: Entry[]; ready: boolean; busy: boolean; error: string; settings: Settings; token: string;
  save: (entry: Entry) => Promise<void>; remove: (id: string) => Promise<void>; merge: (entries: Entry[]) => Promise<void>; clear: () => Promise<void>;
  configure: (settings: Settings, token: string) => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef<Entry[]>([]);
  const locked = useRef(false);
  useEffect(() => {
    let alive = true;
    Promise.all([AsyncStorage.getItem(RECORD_KEY), AsyncStorage.getItem(SETTING_KEY), readToken()]).then(([records, config, access]) => {
      const loaded = records ? parseBackup(records) : [];
      const candidate = config ? JSON.parse(config) : DEFAULT_SETTINGS;
      if (!alive) return;
      latest.current = loaded; setEntries(loaded);
      setSettings(typeof candidate?.serverUrl === 'string' ? candidate : DEFAULT_SETTINGS); setToken(access); setReady(true);
    }).catch(() => { if (alive) setError('本地数据读取失败。为保护已有记录，暂时停止写入；请关闭后重试。'); });
    return () => { alive = false; };
  }, []);
  async function change(update: (rows: Entry[]) => Entry[]) {
    if (!ready || locked.current) throw new Error('正在处理，请稍后再试');
    locked.current = true; setBusy(true);
    try {
      const next = update(latest.current).sort((a, b) => b.ts - a.ts);
      await AsyncStorage.setItem(RECORD_KEY, JSON.stringify({ version: 1, entries: next }));
      latest.current = next; setEntries(next);
    } finally { locked.current = false; setBusy(false); }
  }
  async function configure(next: Settings, access: string) {
    await writeToken(access.trim());
    await AsyncStorage.setItem(SETTING_KEY, JSON.stringify(next));
    setSettings(next); setToken(access.trim());
  }
  return <Context.Provider value={{ entries, ready, busy, error, settings, token, configure,
    save: entry => change(rows => [normalizeEntry(entry), ...rows.filter(e => e.id !== entry.id)]),
    remove: id => change(rows => rows.filter(e => e.id !== id)),
    merge: imported => change(rows => { const map = new Map(rows.map(e => [e.id, e])); imported.forEach(e => { if (!map.has(e.id)) map.set(e.id, normalizeEntry(e)); }); return [...map.values()]; }),
    clear: () => change(() => []),
  }}>{children}</Context.Provider>;
}
export function useStore() { const value = useContext(Context); if (!value) throw new Error('Missing StoreProvider'); return value; }
