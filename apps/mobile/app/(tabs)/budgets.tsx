import { budgetStatus, formatPeso } from '@finora/core';
import { shortDate, useFinances } from '@/lib/finances';
import { useTheme } from '@/lib/theme';
import { Bar, Card, H, Row, Screen, T } from '@/components/ui';

export default function Budgets() {
  const { data, loading, refresh } = useFinances();
  const { colors } = useTheme();
  if (!data) return <Screen title="Budgets">{null}</Screen>;

  const rows = data.budgets.map((b) => budgetStatus(b, data.transactions, data.today));
  const limits = rows.reduce((s, r) => s + r.budget.limit, 0);
  const spent = rows.reduce((s, r) => s + r.spent, 0);
  const attention = rows.filter((r) => r.state !== 'ok').length;
  const tone = {
    over: { tag: 'Over', bg: colors.overBg, fg: colors.over, bar: '#EA580C' },
    warning: { tag: 'Near limit', bg: colors.warnBg, fg: colors.warn, bar: '#F59E0B' },
    ok: { tag: 'On track', bg: colors.okBg, fg: colors.positive, bar: '#10B981' }
  } as const;

  return (
    <Screen title="Budgets" refreshing={loading} onRefresh={refresh}>
      <Card tone="hero" index={0}>
        <T style={{ color: '#B8C2D9' }}>Spent so far</T>
        <H size={18} style={{ color: '#FFFFFF' }}>{formatPeso(spent)}</H>
        <T style={{ color: '#B8C2D9' }}>of {formatPeso(limits)} in limits{limits ? ` · ${Math.round((spent / limits) * 100)}%` : ''}</T>
        {attention > 0 && <T style={{ color: '#FDBA74' }}>{attention} {attention === 1 ? 'budget needs' : 'budgets need'} attention</T>}
      </Card>

      {rows.length === 0 && <T muted>No budgets yet. Create them on the Finora website and they'll show up here.</T>}
      {rows.map((r, i) => {
        const t = tone[r.state];
        return (
          <Card key={r.budget.id} index={i + 1}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T size={22}>{r.budget.category}</T>
              <T size={16} style={{ color: t.fg, backgroundColor: t.bg, borderWidth: 2, borderColor: colors.outline, paddingHorizontal: 6 }}>{t.tag}</T>
            </Row>
            <T muted size={16}>{r.budget.period === 'weekly' ? 'Weekly' : 'Monthly'} · {shortDate(r.start)} – {shortDate(r.end)}</T>
            <Bar pct={r.pct} color={t.bar} label={`${r.budget.category} budget used`} />
            <Row style={{ justifyContent: 'space-between' }}>
              <T size={18}>{formatPeso(r.spent)} of {formatPeso(r.budget.limit)}</T>
              <T size={18} style={{ color: r.remaining < 0 ? colors.over : colors.positive }}>
                {formatPeso(Math.abs(r.remaining))} {r.remaining < 0 ? 'over' : 'left'}
              </T>
            </Row>
          </Card>
        );
      })}
      <T muted size={17}>Alerts at 75%, 90% and over 100%.</T>
    </Screen>
  );
}
