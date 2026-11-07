import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, parsePeso } from '@finora/core';
import { useFinances } from '@/lib/finances';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Btn, H, Row, T, styles } from '@/components/ui';

/** Quick add for an expense or income, opened as a modal. */
export default function Add() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const { data, refresh } = useFinances();
  const { colors } = useTheme();
  const [kind, setKind] = useState<'expense' | 'income'>(params.kind === 'income' ? 'income' : 'expense');
  const cats = kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [category, setCategory] = useState<string>(cats[0]);
  const [walletId, setWalletId] = useState(data?.wallets.find((w) => w.spendable)?.id ?? data?.wallets[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const input = [styles.input, { borderColor: colors.outline, backgroundColor: colors.surface, color: colors.text }];

  function switchKind(k: 'expense' | 'income') {
    setKind(k);
    setCategory((k === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]);
  }

  async function save() {
    const value = parsePeso(amount);
    if (!title.trim()) return setError('Give it a short name, like "Lunch at canteen".');
    if (!value) return setError('Enter an amount above ₱0, like 95 or 1,500.50.');
    if (!walletId) return setError('Add a wallet first.');
    setBusy(true);
    const { error: e } = await supabase.from('transactions').insert({
      kind,
      category,
      amount: value,
      title: title.trim(),
      wallet_id: walletId,
      occurred_on: data?.today
    });
    setBusy(false);
    if (e) return setError(e.message);
    await refresh();
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
        <H size={14}>{kind === 'income' ? 'Add income' : 'Add expense'}</H>
        <Row>
          <Btn title="Expense" variant={kind === 'expense' ? 'primary' : 'plain'} onPress={() => switchKind('expense')} style={{ flex: 1 }} />
          <Btn title="Income" variant={kind === 'income' ? 'primary' : 'plain'} onPress={() => switchKind('income')} style={{ flex: 1 }} />
        </Row>
        <TextInput accessibilityLabel="Amount in pesos" placeholder="₱ 0.00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={[input, { fontSize: 32 }]} autoFocus />
        <TextInput accessibilityLabel="What was it?" placeholder={kind === 'income' ? 'Weekly allowance' : 'Lunch at canteen'} placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} maxLength={80} style={input} />

        <T muted>Category</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {cats.map((c) => (
            <Btn key={c} title={c} variant={category === c ? 'mint' : 'plain'} onPress={() => setCategory(c)} accessibilityState={{ selected: category === c }} />
          ))}
        </View>

        <T muted>Wallet</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {data?.wallets.map((w) => (
            <Btn key={w.id} title={w.name} variant={walletId === w.id ? 'mint' : 'plain'} onPress={() => setWalletId(w.id)} accessibilityState={{ selected: walletId === w.id }} />
          ))}
        </View>

        {!!error && <T accessibilityLiveRegion="polite" style={{ color: colors.over }}>{error}</T>}
        <Btn title={busy ? 'Saving…' : 'Save'} variant="primary" disabled={busy} onPress={save} />
        <Btn title="Cancel" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
