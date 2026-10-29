import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '../../ui';
export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: C.green, tabBarInactiveTintColor: C.muted, tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.border }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' }, sceneStyle: { backgroundColor: C.bg } }}>
    <Tabs.Screen name="index" options={{ title: '今日', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>◷</Text> }} />
    <Tabs.Screen name="stats" options={{ title: '统计', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>▥</Text> }} />
    <Tabs.Screen name="analysis" options={{ title: 'AI 分析', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>✧</Text> }} />
    <Tabs.Screen name="settings" options={{ title: '设置', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⚙</Text> }} />
  </Tabs>;
}
