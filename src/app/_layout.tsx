import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '../store';
import { C } from '../ui';
function Navigation() {
  const { ready, error } = useStore();
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 30 }}>{error ? <Text style={{ color: C.danger }}>{error}</Text> : <ActivityIndicator color={C.green} />}</View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="record" options={{ presentation: 'modal' }} /></Stack>;
}
export default function Layout() { return <SafeAreaProvider><StoreProvider><StatusBar style="light" /><Navigation /></StoreProvider></SafeAreaProvider>; }
