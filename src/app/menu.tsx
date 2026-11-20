import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Icon, type IconName } from '@/components/icon';
import { MenuTextEntry } from '@/components/menu-text-entry';
import { TopBar } from '@/components/top-bar';
import { FEATURES } from '@/constants/features';
import { colors, fonts, radius } from '@/constants/theme';
import { DEMO_MENUS } from '@/features/menu-input/demo-menus';
import { useMenuInput } from '@/features/menu-input/use-menu-input';

export default function MenuInputScreen() {
  const input = useMenuInput(() => router.push('/analysis'));
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [demosOpen, setDemosOpen] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  // Keep the text field above the keyboard: scroll down once the keyboard has opened.
  const revealEntry = () => setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 300);
  const textEntry = (
    <MenuTextEntry value={text} onChange={setText} onSubmit={() => input.submitText(text)} onFocus={revealEntry} />
  );

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText variant="display">Zeig mir die Speisekarte</AppText>
          <AppText style={styles.lead}>Scanne den QR-Code auf der Karte oder tippe die Gerichte ab.</AppText>

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
              {textEntry}
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
          ) : (
            <View style={styles.options}>
              <Option icon="qr" title="QR-Code scannen" onPress={() => router.push('/scan')} />
              {FEATURES.menuUpload && <Option icon="file" title="Bild oder PDF hochladen" onPress={input.uploadFile} />}
              <Option icon="text" title="Text eingeben" onPress={() => setTyping((value) => !value)} open={typing} />
              {typing && textEntry}
              <Option
                icon="camera"
                title="Foto aufnehmen"
                text={FEATURES.menuPhoto ? undefined : 'Bald verfügbar'}
                onPress={input.takePhoto}
                disabled={!FEATURES.menuPhoto}
              />
              <Pressable onPress={() => setDemosOpen(true)} style={styles.demoLink} accessibilityRole="button">
                <Text style={styles.demoLinkText}>Demo-Karte ohne QR-Code öffnen</Text>
              </Pressable>
            </View>
          )}

          {input.busy && <ActivityIndicator color={colors.coral} style={styles.busy} />}
          {input.error && <Text style={styles.error}>{input.error}</Text>}
        </ScrollView>

      </KeyboardAvoidingView>

      {/* Demo menus slide up as a sheet; the screen behind stays where it is. */}
      <Modal visible={demosOpen} transparent animationType="slide" onRequestClose={() => setDemosOpen(false)}>
        <Pressable style={styles.dim} onPress={() => setDemosOpen(false)} accessibilityLabel="Schließen" />
        <View style={styles.sheet}>
          <View style={styles.grip} />
          <Text style={styles.sheetTitle}>Demo-Karten</Text>
          <View style={styles.demoList}>
            {DEMO_MENUS.map((menu, index) => (
              <Pressable
                key={menu.id}
                onPress={() => {
                  setDemosOpen(false);
                  input.loadDemo(menu);
                }}
                style={({ pressed }) => [styles.demoRow, index > 0 && styles.demoRowBorder, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.demoName} numberOfLines={1}>
                  {menu.title}
                </Text>
                <Icon name="chevron" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Option({
  icon,
  title,
  text,
  onPress,
  disabled = false,
  open = false,
}: {
  icon: IconName;
  title: string;
  text?: string;
  onPress: () => void;
  disabled?: boolean;
  /** Content opens below this option: the arrow points down. */
  open?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.option, pressed && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Icon name={icon} size={22} color={colors.brand} />
      <View style={styles.flex}>
        <Text style={styles.optionTitle}>{title}</Text>
        {text && <Text style={styles.optionText}>{text}</Text>}
      </View>
      {!disabled && (
        <View style={open && styles.chevronOpen}>
          <Icon name="chevron" size={16} color={colors.muted} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  // Title on top, options low in thumb reach: the free space sits in between.
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 4, paddingBottom: 20 },
  lead: { color: colors.muted, marginTop: 8 },
  options: { marginTop: 'auto', paddingTop: 24, gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
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
  busy: { marginTop: 20 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.red, marginTop: 14 },
  cancel: { alignItems: 'center', paddingTop: 4 },
  cancelText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
  demoLink: { alignItems: 'center', paddingTop: 8 },
  demoLinkText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  dim: { flex: 1, backgroundColor: 'rgba(20,47,54,0.35)' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28 },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 12 },
  sheetTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink, marginBottom: 10, marginLeft: 4 },
  demoList: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14 },
  demoRowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  demoName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
});
