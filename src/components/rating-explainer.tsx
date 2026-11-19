import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

import { CollapsibleGroup } from './collapsible-group';

const ROWS: { color: string; title: string; text: string }[] = [
  { color: colors.red, title: 'Risiko', text: 'Erdnuss oder Lupine steht auf der Karte oder steckt sicher im Gericht.' },
  {
    color: colors.orange,
    title: 'Unklar',
    text: 'Gericht unbekannt, zu allgemein, oder eine Zutat kann in Frankreich Erdnuss oder Lupine verstecken.',
  },
  {
    color: colors.lightGreen,
    title: 'Wahrscheinlich sicher',
    text: 'Bekanntes Gericht ohne typische Risiken – trotzdem kurz beim Personal nachfragen.',
  },
  { color: colors.green, title: 'Sicher', text: 'Nur wenn das Personal Erdnuss, Lupine und Kreuzkontamination ausschließt.' },
];

/** Collapsible explanation of how Bruno rates a dish, incl. the France-specific hidden risks. */
export function RatingExplainer() {
  return (
    <CollapsibleGroup title="Wie bewerte ich?">
      <View style={styles.box}>
        <Text style={styles.text}>
          Ich prüfe den Namen des Gerichts, die Zutaten auf der Karte und die typischen Zutaten aus meiner Datenbank.
        </Text>
        {ROWS.map((row) => (
          <View key={row.title} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: row.color }]} />
            <Text style={styles.text}>
              <Text style={styles.bold}>{row.title}: </Text>
              {row.text}
            </Text>
          </View>
        ))}
        <Text style={styles.france}>
          Typisch Frankreich: Frittiertes, Dressings und Mayonnaise oft mit Erdnussöl – Brot, Teig und Gebäck teils mit
          Lupinenmehl. Darauf achte ich besonders.
        </Text>
      </View>
    </CollapsibleGroup>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.paper, borderRadius: radius.card, borderWidth: 1, borderColor: '#ece9df', padding: 14, gap: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  text: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink },
  bold: { fontFamily: fonts.bodyBold },
  france: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, color: colors.orangeText },
});
