import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { IngredientChips } from '@/components/ingredient-chips';
import { PrimaryButton } from '@/components/primary-button';
import { RatingExplainer } from '@/components/rating-explainer';
import { StatusBadge } from '@/components/status-badge';
import { TopBar } from '@/components/top-bar';
import { colors, fonts, radius } from '@/constants/theme';
import { dishKnowledge } from '@/features/dish-db';
import { buildRatingInput } from '@/features/dish-rating/build-input';
import { dishIngredients } from '@/features/dish-rating/dish-ingredients';
import { sourceLabel } from '@/features/dish-rating/rate-dish';
import type { Finding, FindingSource } from '@/features/dish-rating/types';
import { germanLabel } from '@/features/menu-input/german-label';
import { sectionTitle } from '@/features/menu-input/section-names';
import { useMenuSession, useRatings } from '@/features/menu-session/session-context';

const SOURCE_ORDER: FindingSource[] = ['staff', 'name', 'menu', 'db'];

export default function DishDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items } = useMenuSession();
  const ratings = useRatings();
  const item = items.find((i) => i.id === id);
  const rating = item ? ratings[item.id] : undefined;

  if (!item || !rating) {
    return (
      <SafeAreaView style={styles.screen}>
        <TopBar onBack={() => router.back()} />
        <AppText style={styles.pad}>Gericht nicht gefunden.</AppText>
      </SafeAreaView>
    );
  }

  const stated = rating.findings.some((f) => f.level === 'contains' && f.source !== 'staff');
  const ingredients = dishIngredients(buildRatingInput(item, dishKnowledge));

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {item.section && <AppText variant="eyebrow">{sectionTitle(item.section)}</AppText>}
        <AppText variant="display">{item.name}</AppText>
        <Text style={styles.german}>{germanLabel(item)}</Text>

        <View style={styles.statusBox}>
          <StatusBadge status={rating.status} long />
          <Text style={styles.reason}>{rating.reason}</Text>
        </View>

        <Section title="So komme ich darauf">
          {SOURCE_ORDER.map((source) => {
            const findings = rating.findings.filter((f) => f.source === source);
            if (findings.length === 0) return null;
            return (
              <View key={source} style={styles.sourceGroup}>
                <Text style={styles.sourceTitle}>{sourceLabel(source)}</Text>
                {findings.map((finding, index) => (
                  <FindingRow key={`${source}-${index}`} finding={finding} />
                ))}
              </View>
            );
          })}
          {rating.findings.length === 0 && (
            <Text style={styles.body}>
              {item.generic
                ? 'Das ist ein Oberbegriff – welches Gericht genau kommt, weiß nur das Personal.'
                : 'Keine Hinweise auf Erdnuss oder Lupine gefunden.'}
            </Text>
          )}
        </Section>

        {ingredients.length > 0 && (
          <Section title="Zutaten">
            <IngredientChips entries={ingredients} />
            {item.listedItems.length > 0 && <Text style={styles.note}>Auf der Karte: {item.listedItems.join(', ')}</Text>}
            {ingredients.some((entry) => !entry.onMenu) && (
              <Text style={styles.note}>* typische Zutaten aus meiner Datenbank – jedes Restaurant kocht anders.</Text>
            )}
          </Section>
        )}

        <View style={styles.explainer}>
          <RatingExplainer />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {stated ? (
          <>
            <Text style={styles.warning}>Dieses Gericht enthält einen deiner Auslöser. Wähle bitte ein anderes.</Text>
            <PrimaryButton label="Zurück zur Karte" icon="arrow" variant="outline" onPress={() => router.back()} />
          </>
        ) : (
          <PrimaryButton
            label={rating.status === 'safe' ? 'Zum Gespräch & bestellen' : 'Personal fragen'}
            icon="chevron"
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const LEVEL_COLOR: Record<Finding['level'], string> = {
  contains: colors.red,
  hidden: colors.orange,
  unknown: colors.orange,
  none: colors.green,
};

function FindingRow({ finding }: { finding: Finding }) {
  return (
    <View style={styles.finding}>
      <View style={[styles.findingDot, { backgroundColor: LEVEL_COLOR[finding.level] }]} />
      <Text style={styles.findingText}>{finding.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  pad: { padding: 24 },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  german: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: 8 },
  statusBox: {
    marginTop: 18,
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#ece9df',
    padding: 16,
    gap: 10,
  },
  reason: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.ink },
  section: { marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.coral },
  sourceGroup: { gap: 6, marginBottom: 6 },
  sourceTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  finding: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  findingDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  findingText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.ink },
  note: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.muted },
  explainer: { marginTop: 18 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, gap: 10 },
  warning: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.red, textAlign: 'center' },
});
