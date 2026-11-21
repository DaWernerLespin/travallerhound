import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';
import { toggleFrench, useIsSpeaking } from '@/lib/speech';

import { Icon } from './icon';

/** Reads French text aloud; while it is speaking, the same button stops it. */
export function SpeakButton({ text, size = 16, color = colors.white, dim = false }: { text: string; size?: number; color?: string; dim?: boolean }) {
  const speaking = useIsSpeaking(text);
  return (
    <Pressable
      onPress={() => toggleFrench(text)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={speaking ? 'Vorlesen stoppen' : 'Auf Französisch vorlesen'}
      style={dim && !speaking ? styles.dim : undefined}
    >
      <Icon name={speaking ? 'stop' : 'speaker'} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dim: { opacity: 0.55 },
});
