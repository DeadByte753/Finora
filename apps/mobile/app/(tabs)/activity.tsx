import { useMemo, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { totals } from '@finora/core';
import { shortDate, useFinances } from '@/lib/finances';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Btn, Card, Money, Row, Screen, T, styles } from '@/components/ui';

export default function Activity() {
  const { data, loading, refresh } = useFinances();
  const { colors } = useTheme();
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [q, setQ] = useState('');

  const rows = useMemo(
    () =>
      (data?.transactions ?? []).filter(
        (t) => (type === 'all' || t.kind === type) && (!q || t.title.toLowerCase().includes(q.toLowerCase()) || t.category.toLowerCase().includes(q.toLowerCase()))
      ),
    [data, type, q]
  );
  if (!data) return <Screen title="Activity">{null}</Screen>;
  const all = totals(data.transactions);
  const walletName = new Map(data.wallets.map((w) => [w.id, w.name]));

  function confirmDelete(id: string, title: string) {
    Alert.alert('Delete transaction?', `"${title}" will be removed and its wallet balance corrected.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('transactions').delete().eq('id', id);
          refresh();
        }
      }
    ]);
  }

  return (
    <Screen title="Activity" refreshing={loading} onRefresh={refresh} right={<Btn title="+" variant="mint" accessibilityLabel="New transaction" onPress={() => router.push('/add')} style={{ width: 48, paddingHorizontal: 0 }} />}>
      <Row>
        <View style={{ flex: 1 }}><Card index={0}><T muted size={17}>Income</T><Money value={all.income} size={10} color={colors.positive} /></Card></View>
        <View style={{ flex: 1 }}><Card index={1}><T muted size={17}>Expenses</T><Money value={all.expenses} size={10} /></Card></View>
      </Row>

      <TextInput
        accessibilityLabel="Search transactions"
        placeholder="Search transactions"
        placeholderTextColor={colors.textMuted}
        value={q}
        onChangeText={setQ}
        style={[styles.input, { borderColor: colors.outline, backgroundColor: colors.surface, color: colors.text }]}
      />

      <Row accessibilityRole="radiogroup">
        {(['all', 'income', 'expense'] as const).map((t) => (
          <Btn key={t} title={t[0].toUpperCase() + t.slice(1)} variant={type === t ? 'primary' : 'plain'} onPress={() => setType(t)} style={{ flex: 1 }} accessibilityState={{ selected: type === t }} />
        ))}
      </Row>

      <Card index={2}>
        {rows.length === 0 && <T muted>No transactions match.</T>}
        {rows.map((t) => (
          <Row key={t.id} style={{ paddingVertical: 8, borderBottomWidth: 2, borderStyle: 'dashed', borderColor: colors.track }}>
            <View style={{ flex: 1 }}>
              <T numberOfLines={1} onLongPress={() => confirmDelete(t.id, t.title)}>{t.title}</T>
              <T muted size={16}>{t.category} · {walletName.get(t.walletId)} · {shortDate(t.occurredOn)}</T>
            </View>
            <Money value={t.kind === 'income' ? t.amount : -t.amount} sign size={9} color={t.kind === 'income' ? colors.positive : undefined} />
          </Row>
        ))}
        {rows.length > 0 && <T muted size={16}>Long-press a transaction to delete it.</T>}
      </Card>
    </Screen>
  );
}
