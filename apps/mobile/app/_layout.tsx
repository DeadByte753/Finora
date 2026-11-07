import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { FinancesProvider } from '@/lib/finances';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { mode, colors } = useTheme();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    const onLogin = segments[0] === 'login';
    if (!session && !onLogin) router.replace('/login');
    if (session && onLogin) router.replace('/');
  }, [session, segments, router]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {session ? (
        <FinancesProvider key={session.user.id}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add" options={{ presentation: 'modal' }} />
            <Stack.Screen name="login" />
          </Stack>
        </FinancesProvider>
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      )}
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ PressStart2P_400Regular, VT323_400Regular });
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Gate />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
