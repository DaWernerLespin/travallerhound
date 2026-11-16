import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

/** French text big, German translation small – like the Click-Dummy chat. */
export function ChatBubble({ side, fr, de }: { side: 'traveler' | 'staff'; fr: string; de: string }) {
  const traveler = side === 'traveler';
  return (
    <View style={[styles.row, traveler ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, traveler ? styles.traveler : styles.staff]}>
        <Text style={[styles.label, traveler && styles.labelLight]}>{traveler ? 'Du' : 'Personal'}</Text>
        <Text style={[styles.fr, traveler && styles.frLight]}>{fr}</Text>
        <View style={[styles.divider, traveler && styles.dividerLight]} />
        <Text style={[styles.de, traveler && styles.deLight]}>{de}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 5 },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '86%', borderRadius: 18, paddingVertical: 11, paddingHorizontal: 14 },
  traveler: { backgroundColor: colors.ink, borderBottomRightRadius: 5 },
  staff: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 5 },
  label: { fontFamily: fonts.display, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.coral, marginBottom: 4 },
  labelLight: { color: colors.yellow },
  fr: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 21, color: colors.ink },
  frLight: { color: colors.white },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 7 },
  dividerLight: { backgroundColor: 'rgba(255,255,255,0.18)' },
  de: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.muted },
  deLight: { color: colors.welcomeText },
});
