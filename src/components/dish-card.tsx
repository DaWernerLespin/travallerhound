import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import type { DishStatus } from '@/features/dish-rating/types';

import { Icon } from './icon';
import { StatusBadge } from './status-badge';

export function DishCard({
  number,
  title,
  subtitle,
  status,
  checking,
  confirmed = false,
  wished,
  onToggleWish,
  onPress,
}: {
  number: number;
  title: string;
  subtitle?: string;
  /** undefined while scanning */
  status?: DishStatus;
  /** What is being checked right now (shown while scanning). */
  checking?: string;
  confirmed?: boolean;
  /** On the Wunschliste. Undefined = no wish button (e.g. while scanning or for risky dishes). */
  wished?: boolean;
  onToggleWish?: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button">
      <Text style={styles.number}>{String(number).padStart(2, '0')}</Text>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {checking ? (
          <Text style={styles.checking} numberOfLines={1}>
            {checking}
          </Text>
        ) : subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {confirmed && <Text style={styles.confirmed}>✓ Vom Personal bestätigt</Text>}
      </View>
      <StatusBadge status={status} />
      {onToggleWish ? (
        <Pressable
          onPress={onToggleWish}
          hitSlop={8}
          style={[styles.wish, wished && styles.wishOn]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!wished }}
          accessibilityLabel={wished ? 'Von der Wunschliste nehmen' : 'Auf die Wunschliste'}
        >
          <Icon name={wished ? 'check' : 'plus'} size={16} color={wished ? colors.paper : colors.ink} />
        </Pressable>
      ) : (
        <Icon name="chevron" size={16} color={colors.muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#ece9df',
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingLeft: 14,
    paddingRight: 11,
  },
  pressed: { opacity: 0.7 },
  number: { width: 24, fontFamily: fonts.display, fontSize: 12, color: colors.muted },
  copy: { flex: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  checking: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.red, marginTop: 2 },
  wish: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  confirmed: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.green, marginTop: 3 },
});
