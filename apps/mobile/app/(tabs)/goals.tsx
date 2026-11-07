import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { formatPeso, goalPace, parsePeso } from '@finora/core';
import { shortDate, useFinances } from '@/lib/finances';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Bar, Btn, Card, CountUp, H, Row, Screen, T, styles } from '@/components/ui';

export default function Goals() {
  const { data, loading, refresh } = useFinances();
  const { colors } = useTheme();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  if (!data) return <Screen title="Goals">{null}</Screen>;

  const paces = data.goals.map((g) => goalPace(g, data.today));
  const active = paces.filter((p) => !p.reached);
  const reached = paces.filter((p) => p.reached);
  const saved = data.goals.reduce((s, g) => s + g.saved, 0);

  async function entry(goalId: string, savedNow: number, withdraw: boolean) {
    const value = parsePeso(amounts[goalId] ?? '');
    if (!value) return setMsg((m) => ({ ...m, [goalId]: 'Enter an amount above ₱0.' }));
    if (withdraw && value > savedNow) return setMsg((m) => ({ ...m, [goalId]: 'You can’t withdraw more than you’ve saved.' }));
    const { error } = await supabase.from('goal_entries').insert({ goal_id: goalId, amount: withdraw ? -value : value, label: withdraw ? 'Withdrawal' : 'Deposit' });
    if (error) return setMsg((m) => ({ ...m, [goalId]: error.message }));
    setAmounts((a) => ({ ...a, [goalId]: '' }));
    setMsg((m) => ({ ...m, [goalId]: withdraw ? 'Withdrawn.' : 'Saved! Nice one.' }));
    refresh();
  }

  return (
    <Screen title="Goals" refreshing={loading} onRefresh={refresh}>
      <Card tone="hero" index={0}>
        <T style={{ color: '#B8C2D9' }}>Total saved</T>
        <CountUp value={saved} size={20} />
        <T style={{ color: '#6EE7B7' }}>{active.length} active · {reached.length} reached</T>
      </Card>

      {active.map((p, i) => (
        <Card key={p.goal.id} index={i + 1}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T size={22}>{p.goal.name}</T>
              <T muted size={16}>{p.goal.targetDate ? `Target ${shortDate(p.goal.targetDate)}` : 'No target date'}</T>
            </View>
            <H size={11} style={{ color: colors.positive }}>{Math.round(p.pct)}%</H>
          </Row>
          <Bar pct={p.pct} label={`${p.goal.name} progress`} />
          <T size={18}>
            {formatPeso(p.goal.saved)} of {formatPeso(p.goal.target)}
            {p.perWeek !== null ? ` · ${formatPeso(p.perWeek)}/week` : ` · ${formatPeso(p.remaining)} to go`}
          </T>
          <TextInput
            accessibilityLabel={`Amount for ${p.goal.name}`}
            placeholder="Amount (₱)"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={amounts[p.goal.id] ?? ''}
            onChangeText={(v) => setAmounts((a) => ({ ...a, [p.goal.id]: v }))}
            style={[styles.input, { borderColor: colors.outline, backgroundColor: colors.surface, color: colors.text }]}
          />
          <Row>
            <Btn title="Add" variant="mint" style={{ flex: 1 }} onPress={() => entry(p.goal.id, p.goal.saved, false)} />
            <Btn title="Withdraw" style={{ flex: 1 }} onPress={() => entry(p.goal.id, p.goal.saved, true)} />
          </Row>
          {!!msg[p.goal.id] && <T accessibilityLiveRegion="polite" style={{ color: msg[p.goal.id].startsWith('Saved') || msg[p.goal.id] === 'Withdrawn.' ? colors.positive : colors.over }}>{msg[p.goal.id]}</T>}
        </Card>
      ))}

      {reached.map((p) => (
        <Card key={p.goal.id} index={6} style={{ backgroundColor: colors.okBg }}>
          <Row>
            <View style={{ width: 36, height: 36, backgroundColor: '#10B981', borderWidth: 2, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center' }}>
              <H size={12} style={{ color: '#0B1B3F' }}>✓</H>
            </View>
            <View>
              <T size={20}>{p.goal.name}</T>
              <T size={16} style={{ color: colors.positive }}>{formatPeso(p.goal.saved)} saved</T>
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
