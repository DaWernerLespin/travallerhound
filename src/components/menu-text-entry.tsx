import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

import { PrimaryButton } from './primary-button';

const EXAMPLE = 'PLATS\nSalade Niçoise 17,90\nThon, oeuf dur, olives, tomates\nSteak frites 19,50';

/** Text field for typing or pasting a menu, with the rules for separating dishes. */
export function MenuTextEntry({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.box}>
      <View style={styles.rules}>
        <Text style={styles.rulesTitle}>So trennst du die Gerichte</Text>
        <Text style={styles.rule}>• Eine Zeile = ein Gericht, Preis am Ende optional</Text>
        <Text style={styles.rule}>• Zutaten in die Zeile darunter, mit Komma getrennt</Text>
        <Text style={styles.rule}>• Überschriften in GROSSBUCHSTABEN werden zu Abschnitten</Text>
      </View>
      <TextInput
        style={styles.input}
        multiline
        value={value}
        onChangeText={onChange}
        placeholder={EXAMPLE}
        placeholderTextColor="#a3adae"
        autoCorrect={false}
        textAlignVertical="top"
      />
      <PrimaryButton label="Gerichte prüfen" icon="spark" onPress={onSubmit} disabled={!value.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 10 },
  rules: { backgroundColor: colors.yellowSoft, borderRadius: 14, padding: 12, gap: 2 },
  rulesTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink, marginBottom: 2 },
  rule: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.ink },
  input: {
    minHeight: 170,
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
});
