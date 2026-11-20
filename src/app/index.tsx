import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllergenIcon, type Allergen } from '@/components/allergen-icon';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { PrimaryButton } from '@/components/primary-button';
import { colors, fonts } from '@/constants/theme';
import { DISHES } from '@/features/dish-db/data/dishes';
import { INGREDIENTS } from '@/features/dish-db/data/ingredients';

const ALLERGIES: { allergen: Allergen; label: string }[] = [
  { allergen: 'peanut', label: 'Erdnussallergie' },
  { allergen: 'lupin', label: 'Lupinenallergie' },
];

// Trust signals. The certification is a concept for the course prototype: a real release would be certified first.
/** Every name the app recognises for an ingredient (main name + alternative names). */
const INGREDIENT_TERMS = INGREDIENTS.reduce((sum, ingredient) => sum + 1 + ingredient.aliases.length, 0);
const roundDown = (count: number) => Math.floor(count / 100) * 100;

const TRUST = [
  { icon: 'shield', text: 'Von Allergolog:innen geprüft' },
  { icon: 'menu', text: `Kennt über ${roundDown(DISHES.length)} Gerichte und ${roundDown(INGREDIENT_TERMS)} Zutaten` },
  //{ icon: 'spark', text: 'Erkennt versteckte Risiken wie Erdnussöl und Lupinenmehl' },
] as const;

/** Start: the only screen with the profile (name, allergies). Light like every other screen. */
export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.account} accessibilityLabel="Profil von Alex">
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
        <Text style={styles.hello}>Bonjour, Alex</Text>
      </View>

      <View style={styles.center}>
        <Logo size={124} variant="full" />
        <Text style={styles.title}>
          Ich bin <Text style={styles.highlight}>Bruno</Text>,{'\n'}deine Spürnase{'\n'}für Frankreich
        </Text>
        <View style={styles.badges}>
          {ALLERGIES.map(({ allergen, label }) => (
            <View key={allergen} style={styles.badge}>
              <AllergenIcon allergen={allergen} size={18} color={colors.brand} />
              <Text style={styles.badgeText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.trust}>
        {TRUST.map((item) => (
          <View key={item.text} style={styles.trustRow}>
            <Icon name={item.icon} size={17} color={colors.brand} />
            <Text style={styles.trustText}>{item.text}</Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Speisekarte prüfen" onPress={() => router.push('/menu')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  account: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 14 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 14, color: colors.white },
  hello: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 20 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.ink, letterSpacing: -0.6, textAlign: 'center' },
  highlight: { color: colors.brand },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 30,
    paddingVertical: 6,
    paddingLeft: 7,
    paddingRight: 11,
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink },
  trust: { paddingHorizontal: 24, paddingBottom: 16, gap: 8 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  trustText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.muted },
  footer: { paddingHorizontal: 24, paddingBottom: 20 },
});
