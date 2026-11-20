import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import { findDemoMenu } from '@/features/menu-input/menu-link';
import { useMenuSession } from '@/features/menu-session/session-context';

/** Entry point of a demo menu QR code: /karte/<id> loads the stored menu and starts the analysis. */
export default function DemoMenuLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadMenuText } = useMenuSession();
  const menu = findDemoMenu(id ?? '');

  useEffect(() => {
    if (!menu) return;
    loadMenuText(menu.text, menu.title, menu.id);
    router.replace('/analysis');
  }, [menu, loadMenuText]);

  if (!menu) return <Redirect href="/menu" />;
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={colors.coral} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
});
