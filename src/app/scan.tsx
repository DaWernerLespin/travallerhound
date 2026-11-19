import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { TopBar } from '@/components/top-bar';
import { colors, fonts, radius } from '@/constants/theme';
import { demoMenuFromCode } from '@/features/menu-input/menu-link';

/** Scans the QR code printed on a demo menu and opens that menu. Unknown codes are ignored. */
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  // The camera reports the same code many times per second – open the menu only once.
  const opened = useRef(false);

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (opened.current) return;
    const menu = demoMenuFromCode(data);
    if (!menu) return;
    opened.current = true;
    router.replace({ pathname: '/karte/[id]', params: { id: menu.id } });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <View style={styles.content}>
        <AppText variant="eyebrow">Speisekarte scannen</AppText>
        <AppText variant="display">Halte die Kamera auf den QR-Code.</AppText>

        {!permission ? (
          <ActivityIndicator color={colors.coral} style={styles.center} />
        ) : !permission.granted ? (
          <View style={styles.permission}>
            <Text style={styles.text}>Ich brauche einmal Zugriff auf deine Kamera, um den Code auf der Speisekarte zu lesen.</Text>
            <PrimaryButton label="Kamera erlauben" icon="camera" onPress={requestPermission} />
          </View>
        ) : (
          <View style={styles.viewfinder}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={onScanned}
            />
            <View style={styles.frame} pointerEvents="none" />
            <View style={styles.hint} pointerEvents="none">
              <Icon name="spark" size={18} color={colors.paper} />
              <Text style={styles.hintText}>QR-Code im Rahmen platzieren</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  center: { marginTop: 40 },
  permission: { marginTop: 24, gap: 16 },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  viewfinder: { flex: 1, marginTop: 20, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.ink },
  camera: { flex: 1 },
  frame: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    right: '15%',
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: colors.yellow,
    borderRadius: 18,
  },
  hint: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,47,54,0.75)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  hintText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.paper },
});
