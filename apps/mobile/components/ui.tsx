import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type PressableProps, type TextProps, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LOGO_PATH, formatPeso } from '@finora/core';
import { fonts, useTheme } from '@/lib/theme';

/* ---------- text ---------- */

export function T({ style, muted, size = 20, ...rest }: TextProps & { muted?: boolean; size?: number }) {
  const { colors } = useTheme();
  return <Text {...rest} style={[{ fontFamily: fonts.body, fontSize: size, color: muted ? colors.textMuted : colors.text }, style]} />;
}

export function H({ style, size = 12, ...rest }: TextProps & { size?: number }) {
  const { colors } = useTheme();
  return <Text accessibilityRole="header" {...rest} style={[{ fontFamily: fonts.pixel, fontSize: size, lineHeight: size * 1.5, color: colors.text }, style]} />;
}

/** Peso amount in the pixel font, never wrapping. */
export function Money({ value, size = 11, color, sign }: { value: number; size?: number; color?: string; sign?: boolean }) {
  const { colors } = useTheme();
  return (
    <Text numberOfLines={1} style={{ fontFamily: fonts.pixel, fontSize: size, lineHeight: size * 1.5, color: color ?? colors.text }}>
      {formatPeso(value, { sign })}
    </Text>
  );
}

/* ---------- layout ---------- */

export function Screen({
  children,
  title,
  right,
  refreshing,
  onRefresh
}: {
  children: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <H size={15} style={{ flex: 1 }}>
            {title}
            <Blink />
          </H>
          {right}
          <ThemeToggle />
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function Blink() {
  const o = useSharedValue(1);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!reduce) o.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 0 }), withTiming(0, { duration: 500 }), withTiming(1, { duration: 0 })), -1);
  }, [o, reduce]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.Text style={[style, { color: '#10B981' }]}>_</Animated.Text>;
}

/** Card with a thick outline and a hard pixel shadow. `index` staggers its entrance. */
export function Card({ children, style, index = 0, tone }: { children: React.ReactNode; style?: ViewStyle; index?: number; tone?: 'hero' }) {
  const { colors } = useTheme();
  const hero = tone === 'hero';
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(500)} style={{ marginRight: 5, marginBottom: 5 }}>
      <View style={[StyleSheet.absoluteFill, { transform: [{ translateX: 5 }, { translateY: 5 }], backgroundColor: hero ? colors.accent : colors.shadow }]} />
      <View
        style={[
          { borderWidth: 3, borderColor: hero ? colors.hero : colors.outline, backgroundColor: hero ? colors.hero : colors.surface, padding: 16, gap: 10 },
          style
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
}

/** Progress bar that fills smoothly after the card appears. */
export function Bar({ pct, color = '#10B981', label }: { pct: number; color?: string; label: string }) {
  const { colors } = useTheme();
  const w = useSharedValue(0);
  const target = Math.max(0, Math.min(100, pct));
  useEffect(() => {
    w.value = withDelay(400, withTiming(target, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, [target, w]);
  const style = useAnimatedStyle(() => ({ width: `${Math.min(100, w.value)}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target) }}
      style={{ height: 14, borderWidth: 2, borderColor: colors.outline, backgroundColor: colors.track, overflow: 'hidden' }}
    >
      <Animated.View style={[{ height: '100%', backgroundColor: color }, style]} />
    </View>
  );
}

export function Btn({ title, variant = 'plain', style, ...rest }: PressableProps & { title: string; variant?: 'plain' | 'primary' | 'mint'; style?: ViewStyle }) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.primaryBg : variant === 'mint' ? colors.accent : colors.surface;
  const fg = variant === 'primary' ? colors.primaryText : variant === 'mint' ? colors.accentText : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      onPressIn={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        rest.onPressIn?.(e);
      }}
      style={({ pressed }) => [
        {
          minHeight: 48,
          paddingHorizontal: 14,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: colors.outline,
          backgroundColor: bg,
          transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : [],
          shadowColor: colors.shadow,
          shadowOffset: pressed ? { width: 0, height: 0 } : { width: 3, height: 3 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: pressed ? 0 : 3,
          opacity: rest.disabled ? 0.6 : 1
        },
        style
      ]}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 21, color: fg }}>{title}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>{children}</View>;
}

/* ---------- brand ---------- */

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden>
      <Rect width={32} height={32} fill="#10B981" />
      <Path transform="matrix(0.0449 0 0 0.0449 -7.97 -7.93)" d={LOGO_PATH} fill="#0B1B3F" />
    </Svg>
  );
}

/** Counts up to `value` (centavos) after a short delay, one update per frame. */
export function CountUp({ value, size = 26, color = '#FFFFFF', delay = 300 }: { value: number; size?: number; color?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) return setShown(value);
    const duration = 1400;
    let frame = 0;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now + delay;
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setShown(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, delay, reduce]);
  return (
    <Text numberOfLines={1} style={{ fontFamily: fonts.pixel, fontSize: size, lineHeight: size * 1.4, color }}>
      {formatPeso(shown)}
    </Text>
  );
}

/* ---------- theme toggle with pixel wipe ---------- */

export function ThemeToggle() {
  const { mode, toggle, colors } = useTheme();
  return (
    <>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        accessibilityState={{ checked: mode === 'dark' }}
        style={{ width: 48, height: 48, borderWidth: 3, borderColor: colors.outline, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="square">
          {mode === 'dark' ? (
            <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
          ) : (
            <Path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
          )}
        </Svg>
      </Pressable>
    </>
  );
}

export const styles = StyleSheet.create({
  input: { minHeight: 52, borderWidth: 3, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 22 }
});
