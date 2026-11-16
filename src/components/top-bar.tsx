import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

import { Icon } from './icon';

export function TopBar({ onBack, light = false }: { onBack?: () => void; light?: boolean }) {
  const tint = light ? colors.cream : colors.ink;
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityLabel="Zurück" hitSlop={10} style={styles.side}>
          <Icon name="arrow" color={tint} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={[styles.brand, { color: tint }]}>
        TravAller<Text style={[styles.brandStrong, { color: light ? colors.yellow : colors.coral }]}>Hound</Text>
      </Text>
      <View style={[styles.side, styles.profile]} accessibilityLabel="Profil von Alex">
        <Text style={styles.profileText}>A</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  side: { width: 36, height: 36, justifyContent: 'center' },
  brand: { fontFamily: fonts.displayBold, fontSize: 16, letterSpacing: -0.6 },
  brandStrong: { fontFamily: fonts.display },
  profile: {
    borderRadius: 18,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  profileText: { fontFamily: fonts.display, fontSize: 13, color: colors.ink },
});
