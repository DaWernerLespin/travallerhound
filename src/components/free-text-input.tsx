import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

import { Icon } from './icon';

/**
 * Free text, translated with DeepL before it is sent. Keeps the text and shows an error if translation fails.
 * `dark` = on the staff panel.
 */
export function FreeTextInput({
  enabled,
  placeholder,
  busyLabel,
  errorLabel,
  onSend,
  dark = false,
}: {
  enabled: boolean;
  placeholder: string;
  busyLabel: string;
  errorLabel: string;
  onSend: (text: string) => Promise<void>;
  dark?: boolean;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const canSend = enabled && !busy && text.trim().length > 0;

  const submit = async () => {
    if (!canSend) return;
    setBusy(true);
    setFailed(false);
    try {
      await onSend(text);
      setText('');
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.freeWrap}>
      <View style={[styles.freeText, dark && styles.freeTextDark, !enabled && styles.disabled]}>
        <TextInput
          style={[styles.freeInput, dark && styles.freeInputDark]}
          editable={enabled && !busy}
          value={busy ? busyLabel : text}
          onChangeText={(value) => {
            setText(value);
            setFailed(false);
          }}
          onSubmitEditing={submit}
          returnKeyType="send"
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          multiline={false}
        />
        <Pressable onPress={submit} disabled={!canSend} hitSlop={8} accessibilityRole="button" accessibilityLabel={dark ? 'Envoyer' : 'Senden'}>
          <Icon name="chevron" size={16} color={canSend ? (dark ? colors.cream : colors.ink) : colors.muted} />
        </Pressable>
      </View>
      {failed && <Text style={styles.freeError}>{errorLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  freeWrap: { gap: 4 },
  freeText: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 12 },
  freeTextDark: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.3)' },
  disabled: { opacity: 0.55 },
  freeInput: { flex: 1, minHeight: 38, fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  freeInputDark: { color: colors.cream },
  freeError: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.red, marginLeft: 12 },
});
