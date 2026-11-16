import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hound } from '@/components/hound';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { TopBar } from '@/components/top-bar';
import { colors, fonts, shadow } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TopBar light />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Bonjour, Alex</Text>
        <Text style={styles.title}>
          Ich bin <Text style={styles.highlight}>Bruno.</Text>
          {'\n'}Deine Spürnase{'\n'}für Frankreich.
        </Text>
        <Text style={styles.text}>
          Ich kenne deine Erdnuss- und Lupinenallergie und prüfe für dich jedes Gericht – auch versteckte Zutaten.
        </Text>
      </View>
      <View style={styles.mascot}>
        <Hound size={190} />
        <View style={styles.pills}>
          <View style={styles.pill}>
            <Icon name="shield" size={16} />
            <Text style={styles.pillText}>Erdnussallergie gespeichert</Text>
          </View>
          <View style={styles.pill}>
            <Icon name="shield" size={16} />
            <Text style={styles.pillText}>Lupinenallergie gespeichert</Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Speisekarte prüfen" variant="cream" onPress={() => router.push('/menu')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  copy: { paddingHorizontal: 26, paddingTop: 24 },
  eyebrow: {
    fontFamily: fonts.display,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.yellow,
    marginBottom: 10,
  },
  title: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, color: colors.cream, letterSpacing: -0.8 },
  highlight: { color: colors.yellow },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.welcomeText, marginTop: 16, maxWidth: 320 },
  mascot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pills: { marginTop: -18, gap: 6, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.paper,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 13,
    ...shadow,
  },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink },
  footer: { paddingHorizontal: 24, paddingBottom: 20 },
});
