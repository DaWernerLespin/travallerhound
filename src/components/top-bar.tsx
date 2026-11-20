import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

import { Icon } from './icon';
import { Logo } from './logo';

/** Header of every screen after the start: back + small logo. No app name, no profile (that lives on the start screen). */
export function TopBar({ onBack }: { onBack?: () => void }) {
  return (
    <View style={styles.bar}>
      {onBack && (
        <Pressable onPress={onBack} accessibilityLabel="Zurück" hitSlop={10}>
          <Icon name="arrow" color={colors.ink} />
        </Pressable>
      )}
      <Logo size={28} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
});
