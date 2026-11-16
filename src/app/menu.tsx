import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Icon, type IconName } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { TopBar } from '@/components/top-bar';
import { colors, fonts, radius } from '@/constants/theme';
import { BRASSERIE_MENU, CHOUCHOU_MENU } from '@/features/menu-input/demo-menus';
import { useMenuInput } from '@/features/menu-input/use-menu-input';

const TEXT_PLACEHOLDER = 'Salade Niçoise 17,90\nThon, oeuf dur, olives, tomates\nSteak frites 19,50';

export default function MenuInputScreen() {
  const input = useMenuInput(() => router.push('/analysis'));
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const showTextBox = typing || input.manualFile !== null;

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText variant="eyebrow">Schritt 1 von 2</AppText>
          <AppText variant="display">Zeig mir, was auf der Karte steht.</AppText>
          <AppText style={styles.lead}>Fotografiere die Speisekarte, lade ein Bild oder PDF hoch oder tippe die Gerichte ab.</AppText>

          {input.manualFile ? (
            <View style={styles.preview}>
              {input.manualFile.isImage ? (
                <Image source={{ uri: input.manualFile.uri }} style={styles.previewImage} contentFit="contain" />
              ) : (
                <View style={styles.previewFile}>
                  <Icon name="file" size={28} />
                  <Text style={styles.previewName} numberOfLines={1}>
                    {input.manualFile.name}
                  </Text>
                </View>
              )}
              <Text style={styles.hint}>{input.manualFile.reason}</Text>
            </View>
          ) : (
            <View style={styles.options}>
              <Option icon="camera" title="Foto aufnehmen" text="Speisekarte mit der Kamera fotografieren" onPress={input.takePhoto} />
              <Option icon="file" title="Bild oder PDF hochladen" text="PNG, JPG oder PDF der Speisekarte" onPress={input.uploadFile} />
              <Option icon="text" title="Text eingeben" text="Gerichte abtippen oder einfügen" onPress={() => setTyping(true)} />
              <AppText variant="eyebrow" style={styles.demoTitle}>
                Demo
              </AppText>
              <Option icon="menu" title="Chouchou, Paris" text="Echte Speisekarte (Vorspeisen & Salate)" onPress={() => input.loadDemo(CHOUCHOU_MENU)} />
              <Option icon="menu" title="Beispielkarte Brasserie" text="Zeigt alle Einstufungen" onPress={() => input.loadDemo(BRASSERIE_MENU)} />
            </View>
          )}

          {showTextBox && (
            <View style={styles.textBox}>
              <Text style={styles.textLabel}>Eine Zeile pro Gericht – Zutaten mit Komma in die nächste Zeile.</Text>
              <TextInput
                style={styles.input}
                multiline
                value={text}
                onChangeText={setText}
                placeholder={TEXT_PLACEHOLDER}
                placeholderTextColor="#a3adae"
                autoCorrect={false}
                textAlignVertical="top"
              />
            </View>
          )}

          {input.busy && <ActivityIndicator color={colors.coral} style={styles.busy} />}
          {input.error && <Text style={styles.error}>{input.error}</Text>}
        </ScrollView>

        {showTextBox && (
          <View style={styles.footer}>
            <PrimaryButton label="Gerichte prüfen" icon="spark" onPress={() => input.submitText(text)} disabled={!text.trim()} />
            <Pressable
              onPress={() => {
                input.clearManualFile();
                setTyping(false);
              }}
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>Andere Quelle wählen</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Option({ icon, title, text, onPress }: { icon: IconName; title: string; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && styles.pressed]} accessibilityRole="button">
      <View style={styles.optionIcon}>
        <Icon name={icon} size={22} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionText}>{text}</Text>
      </View>
      <Icon name="chevron" size={16} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },
  lead: { color: colors.muted, marginTop: 12 },
  options: { marginTop: 24, gap: 10 },
  demoTitle: { marginTop: 14, marginBottom: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#ece9df',
    padding: 14,
  },
  pressed: { opacity: 0.7 },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink },
  optionText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  preview: { marginTop: 20, gap: 10 },
  previewImage: { width: '100%', height: 260, borderRadius: radius.card, backgroundColor: colors.paper },
  previewFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    padding: 16,
  },
  previewName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.orangeText },
  textBox: { marginTop: 18 },
  textLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: 8 },
  input: {
    minHeight: 170,
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  busy: { marginTop: 20 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.red, marginTop: 14 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  cancel: { alignItems: 'center', paddingTop: 12 },
  cancelText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
