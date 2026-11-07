import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { parsePeso } from '@finora/core';
import { shortDate, useFinances } from '@/lib/finances';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Btn, Card, CountUp, H, Money, Row, Screen, T, styles } from '@/components/ui';

const KIND = { cash: 'Cash', ewallet: 'E-wallet', bank: 'Bank account' } as const;

export default function Wallets() {
  const { data, loading, refresh } = useFinances();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'cash' | 'ewallet' | 'bank'>('ewallet');
  const [opening, setOpening] = useState('');
  const [msg, setMsg] = useState('');
  if (!data) return <Screen title="Wallets">{null}</Screen>;

  const total = data.wallets.reduce((s, w) => s + w.balance, 0);
  const spendable = data.wallets.filter((w) => w.spendable).reduce((s, w) => s + w.balance, 0);
  const walletName = new Map(data.wallets.map((w) => [w.id, w.name]));
  const input = [styles.input, { borderColor: colors.outline, backgroundColor: colors.surface, color: colors.text }];

  async function add() {
    const value = parsePeso(opening || '0');
    if (!name.trim()) return setMsg('Name the wallet, like "Maya".');
    if (value === null) return setMsg('Enter the current balance, or 0.');
    const { error } = await supabase.from('wallets').insert({ name: name.trim(), kind, opening_balance: value, spendable: kind !== 'bank' });
    if (error) return setMsg(error.message);
    setName('');
    setOpening('');
    setMsg('Wallet added.');
    refresh();
  }

  async function toggleSpendable(id: string, next: boolean) {
    await supabase.from('wallets').update({ spendable: next }).eq('id', id);
    refresh();
  }

  return (
    <Screen title="Wallets" refreshing={loading} onRefresh={refresh}>
      <Card tone="hero" index={0}>
        <T style={{ color: '#B8C2D9' }}>Total in wallets</T>
        <CountUp value={total} size={20} />
        <T style={{ color: '#6EE7B7' }}>Spendable now</T>
        <Money value={spendable} size={11} color="#6EE7B7" />
      </Card>

      {data.wallets.map((w, i) => (
        <Card key={w.id} index={i + 1}>
          <Row>
            <View style={{ width: 40, height: 40, borderWidth: 2, borderColor: colors.outline, backgroundColor: colors.okBg, alignItems: 'center', justifyContent: 'center' }}>
              <H size={11} style={{ color: colors.positive }}>{w.name[0]}</H>
            </View>
            <View style={{ flex: 1 }}>
              <T size={22}>{w.name}</T>
              <T muted size={16}>{KIND[w.kind]}</T>
            </View>
            <Money value={w.balance} size={10} />
          </Row>
          <Btn title={w.spendable ? 'Used for daily spending ✓' : 'Not for spending · turn on'} onPress={() => toggleSpendable(w.id, !w.spendable)} />
        </Card>
      ))}

      <Card index={5}>
        <H size={11}>Add a wallet</H>
        <TextInput accessibilityLabel="Wallet name" placeholder="Maya" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} style={input} />
        <Row>
          {(['cash', 'ewallet', 'bank'] as const).map((k) => (
            <Btn key={k} title={KIND[k]} variant={kind === k ? 'mint' : 'plain'} onPress={() => setKind(k)} style={{ flex: 1, paddingHorizontal: 4 }} />
          ))}
        </Row>
        <TextInput accessibilityLabel="Current balance in pesos" placeholder="Current balance (₱)" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={opening} onChangeText={setOpening} style={input} />
        {!!msg && <T style={{ color: msg.endsWith('added.') ? colors.positive : colors.over }}>{msg}</T>}
        <Btn title="Add wallet" variant="primary" onPress={add} />
      </Card>

      {data.transfers.length > 0 && (
        <Card index={6}>
          <H size={11}>Recent transfers</H>
          {data.transfers.slice(0, 5).map((t) => (
            <Row key={t.id} style={{ paddingVertical: 6, borderBottomWidth: 2, borderStyle: 'dashed', borderColor: colors.track }}>
              <View style={{ flex: 1 }}>
                <T>{walletName.get(t.from)} → {walletName.get(t.to)}</T>
                <T muted size={16}>{shortDate(t.occurredOn)}{t.note ? ` · ${t.note}` : ''}</T>
              </View>
              <Money value={t.amount} size={9} />
            </Row>
          ))}
        </Card>
      )}
    </Screen>
  );
}
