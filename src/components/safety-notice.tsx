import { Modal, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

import { Icon } from './icon';
import { PrimaryButton } from './primary-button';

/**
 * Order notice from the Click-Dummy. Monitoring is NOT active in the MVP – the dialog says so.
 * `onSkip`: order without the check-ins, e.g. when the traveller is with someone who can help.
 */
export function SafetyNotice({
  visible,
  onCancel,
  onConfirm,
  onSkip,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onSkip: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.icon}>
            <Icon name="shield" size={27} color={colors.green} />
          </View>
          <Text style={styles.title}>Bruno bleibt an deiner Seite.</Text>
          <Text style={styles.body}>Ab der Bestellung bittet Bruno dich alle fünf Minuten zu bestätigen, dass du ansprechbar bist.</Text>
          <Text style={styles.bold}>Falls deine Bestätigung ausbleibt:</Text>
          <Text style={styles.body}>• Bruno setzt automatisch einen Notruf ab.</Text>
          <Text style={styles.body}>• Ein hörbarer Alarm wird ausgelöst.</Text>
          <Text style={styles.body}>• Deine EpiPen-Anleitung erscheint auf Französisch, Deutsch und Englisch.</Text>
          <Text style={styles.prototype}>Hinweis: In dieser Demo wird nur diese Mitteilung gezeigt. Die Überwachung ist nicht aktiv.</Text>
          <View style={styles.actions}>
            <PrimaryButton label="Verstanden & bestellen" icon="check" onPress={onConfirm} />
            <PrimaryButton label="Ich bin in Begleitung, ohne Überwachung bestellen" variant="outline" onPress={onSkip} />
            <PrimaryButton label="Abbrechen" icon="close" variant="outline" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,47,54,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 6 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 4 },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.ink },
  bold: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, marginTop: 8 },
  prototype: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.orangeText, marginTop: 10 },
  actions: { gap: 10, marginTop: 16 },
});
