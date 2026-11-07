import { ActivityIndicator, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { addDays, budgetStatus, formatPeso, safeToSpend } from '@finora/core';
import { shortDate, useFinances } from '@/lib/finances';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Bar, Btn, Card, CountUp, H, Money, Row, Screen, T } from '@/components/ui';

export default function Home() {
  const { data, loading, error, refresh } = useFinances();
  const { colors } = useTheme();

  if (!data) {
    return (
      <Screen title="Home">
        {loading ? <ActivityIndicator color={colors.accent} /> : <T style={{ color: colors.over }}>{error}</T>}
      </Screen>
    );
  }

  const first = data.fullName.split(' ')[0];

  if (data.wallets.length === 0) {
    return (
      <Screen title={`Hi, ${first}!`}>
        <Card>
          <T>Add your first wallet to get started, or explore with Juan&apos;s demo data.</T>
          <Btn title="Add a wallet" variant="primary" onPress={() => router.push('/wallets')} />
          <Btn
            title="Load demo data"
            variant="mint"
            onPress={async () => {
              const { error: e } = await supabase.rpc('seed_demo_data');
              if (!e) refresh();
            }}
          />
        </Card>
      </Screen>
    );
  }

  const next = data.nextAllowanceOn && data.nextAllowanceOn >= data.today ? data.nextAllowanceOn : addDays(data.today, 7);
  const safe = safeToSpend({ wallets: data.wallets, transactions: data.transactions, bills: data.bills, today: data.today, nextAllowanceOn: next });
  const over = data.budgets.map((b) => budgetStatus(b, data.transactions, data.today)).filter((b) => b.state === 'over');
  const walletName = new Map(data.wallets.map((w) => [w.id, w.name]));

  return (
    <Screen title={`Hi, ${first}!`} refreshing={loading} onRefresh={refresh}>
      <Card tone="hero" index={0}>
        <H size={10} style={{ color: '#6EE7B7' }}>SAFE TO SPEND TODAY</H>
        <CountUp value={Math.max(0, safe.leftToday)} size={26} />
        <T style={{ color: '#B8C2D9' }}>left today, of {formatPeso(safe.dailyAllowance)}</T>
        <Bar pct={safe.usedPct} color={safe.leftToday < 0 ? '#EA580C' : '#10B981'} label="Spent of today's safe amount" />
        <Row style={{ justifyContent: 'space-between' }}>
          <T size={18} style={{ color: '#B8C2D9' }}>Spent today {formatPeso(safe.spentToday)}</T>
          <T size={18} style={{ color: '#B8C2D9' }}>Allowance {shortDate(next)}</T>
        </Row>
      </Card>

      <Row>
        <Btn title="+ Add expense" variant="mint" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/add', params: { kind: 'expense' } })} />
        <Btn title="Add allowance" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/add', params: { kind: 'income' } })} />
      </Row>

      <H size={11}>Wallets</H>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
        {data.wallets.map((w, i) => (
          <View key={w.id} style={{ width: 160 }}>
            <Card index={i + 1}>
              <T muted size={18}>{w.name}{w.spendable ? '' : ' · savings'}</T>
              <Money value={w.balance} size={11} />
            </Card>
          </View>
        ))}
      </ScrollView>

      {over.map((b) => (
        <Card key={b.budget.id} index={4} style={{ backgroundColor: colors.overBg }}>
          <T style={{ color: colors.over }}>Over your {b.budget.category} budget</T>
          <T size={18}>
            {formatPeso(b.spent)} spent against a {formatPeso(b.budget.limit)} {b.budget.period} limit.
          </T>
        </Card>
      ))}

      <Card index={5}>
        <Row style={{ justifyContent: 'space-between' }}>
          <H size={11}>Recent</H>
          <T style={{ color: colors.positive, textDecorationLine: 'underline' }} onPress={() => router.push('/activity')} accessibilityRole="link">View all</T>
        </Row>
        {data.transactions.slice(0, 5).map((t) => (
          <Row key={t.id} style={{ paddingVertical: 6, borderBottomWidth: 2, borderStyle: 'dashed', borderColor: colors.track }}>
            <View style={{ flex: 1 }}>
              <T numberOfLines={1}>{t.title}</T>
              <T muted size={16}>{t.category} · {walletName.get(t.walletId)} · {shortDate(t.occurredOn)}</T>
            </View>
            <Money value={t.kind === 'income' ? t.amount : -t.amount} sign size={9} color={t.kind === 'income' ? colors.positive : undefined} />
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
