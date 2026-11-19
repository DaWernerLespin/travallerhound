import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { CollapsibleGroup } from '@/components/collapsible-group';
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
          <AppText variant="eyebrow">Schritt 1 von 2</AppText>
          <AppText variant="display">Zeig mir, was auf der Karte steht</AppText>
          <AppText style={styles.lead}>Scanne den QR-Code auf der Speisekarte oder tippe die Gerichte ab.</AppText>

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
              <Option icon="qr" title="QR-Code scannen" text="Code auf der Speisekarte scannen" onPress={() => router.push('/scan')} />
              
              {FEATURES.menuUpload && (
                <Option icon="file" title="Bild oder PDF hochladen" text="PNG, JPG oder PDF der Speisekarte" onPress={input.uploadFile} />
              )}
              <Option icon="text" title="Text eingeben" text="Gerichte abtippen oder einfügen" onPress={() => setTyping((value) => !value)} open={typing} />
              {typing && textEntry}
              <Option
                icon="camera"
                title="Foto aufnehmen"
                text={FEATURES.menuPhoto ? 'Speisekarte mit der Kamera fotografieren' : 'Bald verfügbar'}
                onPress={input.takePhoto}
                disabled={!FEATURES.menuPhoto}
              />

              <CollapsibleGroup title="Demo-Karten" subtitle="Ohne QR-Code direkt öffnen">
                {DEMO_MENUS.map((menu) => (
                  <Option key={menu.id} icon="menu" title={menu.title} text={menu.description} onPress={() => input.loadDemo(menu)} />
                ))}
              </CollapsibleGroup>
            </View>
          )}

          {input.busy && <ActivityIndicator color={colors.coral} style={styles.busy} />}
          {input.error && <Text style={styles.error}>{input.error}</Text>}
        </ScrollView>

      </KeyboardAvoidingView>
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
  text: string;
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
      <View style={styles.optionIcon}>
        <Icon name={icon} size={22} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionText}>{text}</Text>
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
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },
  lead: { color: colors.muted, marginTop: 12 },
  options: { marginTop: 24, gap: 10 },
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
  disabled: { opacity: 0.45 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
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
  busy: { marginTop: 20 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.red, marginTop: 14 },
  cancel: { alignItems: 'center', paddingTop: 4 },
  cancelText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
