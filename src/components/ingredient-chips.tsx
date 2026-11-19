import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { IngredientEntry } from '@/features/dish-rating/dish-ingredients';

const LOOK: Record<IngredientEntry['level'], { color: string; background: string }> = {
  contains: { color: colors.red, background: colors.redSoft },
  hidden: { color: colors.orangeText, background: colors.orangeSoft },
  unknown: { color: colors.orangeText, background: colors.orangeSoft },
  none: { color: colors.ink, background: colors.paper },
};

/** Ingredients as chips, coloured by risk; menu-listed ones are marked with "Karte". */
export function IngredientChips({ entries }: { entries: IngredientEntry[] }) {
  return (
    <View style={styles.wrap}>
      {entries.map((entry) => {
        const look = LOOK[entry.level];
        return (
          <View key={entry.key} style={[styles.chip, { backgroundColor: look.background }]}>
            <Text style={[styles.label, { color: look.color }]}>
              {entry.level === 'unknown' ? `${entry.label} (?)` : entry.label}
            </Text>
            {entry.onMenu && <Text style={styles.tag}>Karte</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ece9df',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  tag: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
});
