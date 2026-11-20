import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, shadow } from '@/constants/theme';

import { Icon, type IconName } from './icon';

type Variant = 'ink' | 'cream' | 'outline';

export function PrimaryButton({
  label,
  onPress,
  icon = 'chevron',
  variant = 'ink',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: Variant;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, styles[variant], (pressed || disabled) && styles.pressed]}
    >
      <Text style={[styles.label, variant === 'ink' ? styles.labelLight : styles.labelDark]}>{label}</Text>
      <View style={[styles.iconBox, variant === 'outline' && styles.iconBoxOutline]}>
        <Icon name={icon} size={20} color={variant === 'outline' ? colors.ink : colors.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: radius.button,
    paddingVertical: 7,
    paddingLeft: 22,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ink: { backgroundColor: colors.ink, ...shadow },
  cream: { backgroundColor: colors.paper, ...shadow },
  outline: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  pressed: { opacity: 0.6 },
  label: { fontFamily: fonts.displayBold, fontSize: 15, flexShrink: 1 },
  labelLight: { color: colors.white },
  labelDark: { color: colors.ink },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  iconBoxOutline: { backgroundColor: colors.cream },
});
