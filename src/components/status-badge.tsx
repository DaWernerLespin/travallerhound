import { StyleSheet, Text, View } from 'react-native';

import { SCANNING_LOOK, STATUS_LOOK } from '@/constants/status';
import { fonts } from '@/constants/theme';
import type { DishStatus } from '@/features/dish-rating/types';

/** Coloured pill. `status` undefined = still scanning (red). */
export function StatusBadge({ status, long = false }: { status?: DishStatus; long?: boolean }) {
  const look = status ? STATUS_LOOK[status] : SCANNING_LOOK;
  return (
    <View style={[styles.badge, { backgroundColor: look.background }]}>
      <View style={[styles.dot, { backgroundColor: look.color }]} />
      <Text style={[styles.text, long && styles.textLong, { color: look.color }]}>{long ? look.label : look.short}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 9,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: fonts.bodyBold, fontSize: 11 },
  textLong: { fontSize: 13 },
});
