import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts, useTheme } from '@/lib/theme';

const ICONS: Record<string, string> = {
  index: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  activity: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  wallets: 'M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7M16 14h.01',
  budgets: 'M21 12A9 9 0 1 1 12 3v9zM15 3.5A9 9 0 0 1 20.5 9H15z',
  goals: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11.5v1'
};

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 3, borderTopColor: colors.outline, height: 72, paddingTop: 6 },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 16 },
        tabBarIcon: ({ color, focused }) => (
          <View style={{ width: 44, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.okBg : 'transparent', borderWidth: focused ? 2 : 0, borderColor: colors.outline }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="square">
              <Path d={ICONS[route.name]} />
            </Svg>
          </View>
        )
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="wallets" options={{ title: 'Wallets' }} />
      <Tabs.Screen name="budgets" options={{ title: 'Budgets' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
    </Tabs>
  );
}
