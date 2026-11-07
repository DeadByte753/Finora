import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAGLINE } from '@finora/core';
import { supabase } from '@/lib/supabase';
import { fonts, useTheme } from '@/lib/theme';
import { Btn, H, LogoMark, Row, T, ThemeToggle, styles } from '@/components/ui';

function Coin({ left, delay }: { left: `${number}%`; delay: number }) {
  const y = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!reduce) y.value = withDelay(delay, withRepeat(withTiming(-700, { duration: 8000, easing: Easing.linear }), -1));
  }, [y, delay, reduce]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${(y.value / 700) * 360}deg` }] }));
  if (reduce) return null;
  return (
    <Animated.View style={[{ position: 'absolute', bottom: -30, left, width: 24, height: 24, borderWidth: 3, borderColor: '#7C2D12', backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }, style]}>
      <T size={14} style={{ color: '#7C2D12' }}>₱</T>
    </Animated.View>
  );
}

export default function Login() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ error?: string; info?: string }>({});
  const [busy, setBusy] = useState(false);
  const [first, second] = TAGLINE.split('. ');

  async function submit() {
    setMsg({});
    if (!email.trim() || !password) return setMsg({ error: 'Enter your email and password.' });
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setMsg({ error: 'That email and password don’t match. Try again.' });
      } else {
        if (!name.trim()) return setMsg({ error: 'Enter your name.' });
        if (password.length < 8) return setMsg({ error: 'Use at least 8 characters for your password.' });
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
        if (error) setMsg({ error: error.message });
        else if (!data.session) setMsg({ info: 'Check your email to confirm your account, then sign in.' });
      }
    } finally {
      setBusy(false);
    }
  }

  const input = [styles.input, { borderColor: colors.outline, backgroundColor: colors.surface, color: colors.text }];

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1B3F' }}>
      <Coin left="10%" delay={0} />
      <Coin left="45%" delay={2500} />
      <Coin left="80%" delay={1200} />
      <SafeAreaView edges={['top']} style={{ padding: 24, gap: 24 }}>
        <Row>
          <LogoMark size={36} />
          <H size={14} style={{ color: '#FFFFFF', flex: 1 }}>Finora</H>
          <ThemeToggle />
        </Row>
        <Animated.View entering={FadeIn.delay(200)}>
          <H size={22} style={{ color: '#FFFFFF', lineHeight: 34 }}>{first}.</H>
          <H size={22} style={{ color: '#6EE7B7', lineHeight: 34 }}>{second}</H>
        </Animated.View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View entering={SlideInDown.duration(600)} style={{ backgroundColor: colors.surface, borderTopWidth: 4, borderColor: '#10B981', padding: 24, gap: 14 }}>
          <Row style={{ borderWidth: 3, borderColor: colors.outline, gap: 0 }}>
            {(['in', 'up'] as const).map((m) => (
              <Btn key={m} title={m === 'in' ? 'Sign in' : 'Create account'} variant={mode === m ? 'primary' : 'plain'} onPress={() => setMode(m)} style={{ flex: 1, borderWidth: 0, elevation: 0, shadowOpacity: 0 }} accessibilityState={{ selected: mode === m }} />
            ))}
          </Row>
          {mode === 'up' && (
            <TextInput accessibilityLabel="Full name" placeholder="Full name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} autoComplete="name" style={input} />
          )}
          <TextInput accessibilityLabel="Email address" placeholder="juan@school.edu.ph" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={input} />
          <TextInput accessibilityLabel="Password" placeholder="Password" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'in' ? 'password' : 'new-password'} style={input} />
          {(msg.error || msg.info) && <T accessibilityLiveRegion="polite" style={{ color: msg.error ? colors.over : colors.positive }}>{msg.error ?? msg.info}</T>}
          <Btn title={busy ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'} variant="primary" disabled={busy} onPress={submit} />
          <T muted size={18} style={{ textAlign: 'center', fontFamily: fonts.body }}>Personal finance for students</T>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
