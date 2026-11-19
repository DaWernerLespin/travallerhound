import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import type { ChecklistItem, ChecklistState } from '@/features/staff-chat/conversation';

const LOOK: Record<ChecklistState, { mark: string; text: string; color: string; background: string }> = {
  open: { mark: '○', text: 'offen', color: colors.muted, background: colors.paper },
  ok: { mark: '✓', text: 'nicht enthalten', color: colors.green, background: colors.greenSoft },
  risk: { mark: '✕', text: 'Risiko', color: colors.red, background: colors.redSoft },
  unclear: { mark: '?', text: 'unklar', color: colors.orangeText, background: colors.orangeSoft },
};

/** Checklist of what the staff still has to confirm for this dish. */
export function StaffChecklist({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((item) => item.state !== 'open').length;
  return (
    <View style={styles.box}>
      <Text style={styles.title}>
        Checkliste · {done} von {items.length} geklärt
      </Text>
      <View style={styles.wrap}>
        {items.map((item) => {
          const look = LOOK[item.state];
          return (
            <View key={item.id} style={[styles.chip, { backgroundColor: look.background }]} accessibilityLabel={`${item.label}: ${look.text}`}>
              <Text style={[styles.mark, { color: look.color }]}>{look.mark}</Text>
              <Text style={styles.label}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: 16, marginTop: 8, gap: 6 },
  title: { fontFamily: fonts.display, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.muted, marginLeft: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#ece9df',
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  mark: { fontFamily: fonts.bodyBold, fontSize: 13 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
});
