import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllergenIcon, type Allergen } from '@/components/allergen-icon';
import { Hound } from '@/components/hound';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { TopBar } from '@/components/top-bar';
import { colors, fonts, shadow } from '@/constants/theme';
import { DISHES } from '@/features/dish-db/data/dishes';
import { INGREDIENTS } from '@/features/dish-db/data/ingredients';

const ALLERGIES: { allergen: Allergen; label: string }[] = [
  { allergen: 'peanut', label: 'Erdnussallergie gespeichert' },
  { allergen: 'lupin', label: 'Lupinenallergie gespeichert' },
];

// Trust signals. The certification is a concept for the course prototype: a real release would be certified first.
/** Every name the app recognises for an ingredient (main name + alternative names). */
const INGREDIENT_TERMS = INGREDIENTS.reduce((sum, ingredient) => sum + 1 + ingredient.aliases.length, 0);
const roundDown = (count: number) => Math.floor(count / 100) * 100;

const TRUST = [
  { icon: 'shield', text: 'Von Allergolog:innen geprüft' },
  { icon: 'menu', text: `Kennt über ${roundDown(DISHES.length)} Gerichte und über ${roundDown(INGREDIENT_TERMS)} Zutaten` },
  //{ icon: 'spark', text: 'Erkennt versteckte Risiken wie Erdnussöl und Lupinenmehl' },
] as const;

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <TopBar light />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Bonjour, Alex</Text>
        <Text style={styles.title}>
          Ich bin <Text style={styles.highlight}>Bruno,</Text>
          {'\n'}deine Spürnase{'\n'}für Frankreich
        </Text>
        <View style={styles.pills}>
          {ALLERGIES.map(({ allergen, label }) => (
            <View key={allergen} style={styles.pill}>
              <AllergenIcon allergen={allergen} size={26} />
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.mascot}>
        <Hound size={170} />
      </View>
      <View style={styles.trust}>
        {TRUST.map((item) => (
          <View key={item.text} style={styles.trustRow}>
            <Icon name={item.icon} size={16} color={colors.yellow} />
            <Text style={styles.trustText}>{item.text}</Text>
          </View>
        ))}
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
  mascot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pills: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.paper,
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 11,
    ...shadow,
  },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink },
  trust: { paddingHorizontal: 26, paddingBottom: 16, gap: 8 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  trustText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.welcomeText },
  footer: { paddingHorizontal: 24, paddingBottom: 20 },
});
