import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useColorScheme, useWindowDimensions } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, type ThemeColors } from '@finora/core';

export type ThemePref = 'light' | 'dark' | 'system';

interface ThemeCtx {
  colors: ThemeColors;
  mode: 'light' | 'dark';
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
  /** Flips light/dark behind a full-screen pixel wipe. */
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const KEY = 'finora-theme';

/** Light or dark exactly as chosen; "system" follows the phone. The choice is saved on the device. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [pref, setPrefState] = useState<ThemePref>('system');
  const [wiping, setWiping] = useState(false);
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const x = useSharedValue(-1);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
    });
  }, []);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    AsyncStorage.setItem(KEY, p);
  }, []);

  const mode = pref === 'system' ? system : pref;
  const flip = useRef(() => {});
  flip.current = () => setPref(mode === 'dark' ? 'light' : 'dark');

  const toggle = useCallback(() => {
    if (reduce) return flip.current();
    setWiping(true);
    x.value = -1;
    x.value = withSequence(
      withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) }, (done) => {
        if (done) runOnJS(flip.current)();
      }),
      withTiming(0, { duration: 90 }),
      withTiming(1, { duration: 300, easing: Easing.in(Easing.quad) }, () => runOnJS(setWiping)(false))
    );
  }, [reduce, x]);

  const wipe = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * width }] }));

  const value = useMemo<ThemeCtx>(() => ({ colors: themes[mode], mode, pref, setPref, toggle }), [mode, pref, setPref, toggle]);

  return (
    <Ctx.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {wiping && (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#10B981', zIndex: 100 }, wipe]}>
            <View style={{ flex: 1, borderLeftWidth: 12, borderRightWidth: 12, borderColor: '#0B1B3F' }} />
          </Animated.View>
        )}
      </View>
    </Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}

export const fonts = { pixel: 'PressStart2P_400Regular', body: 'VT323_400Regular' } as const;
