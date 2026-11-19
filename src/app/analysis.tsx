import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { CollapsibleGroup } from '@/components/collapsible-group';
import { DishCard } from '@/components/dish-card';
import { ProgressRing } from '@/components/progress-ring';
import { RatingExplainer } from '@/components/rating-explainer';
import { ScanArea } from '@/components/scan-area';
import { TopBar } from '@/components/top-bar';
import { colors, fonts } from '@/constants/theme';
import type { DishStatus } from '@/features/dish-rating/types';
import { germanLabel } from '@/features/menu-input/german-label';
import type { MenuItem } from '@/features/menu-input/types';
import { groupDishes } from '@/features/menu-session/group-dishes';
import { useMenuSession } from '@/features/menu-session/session-context';
import { useScan } from '@/features/menu-session/use-scan';

/** Opened via a QR link there is no previous screen – go to the menu input instead. */
function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/menu');
}

const openDish = (id: string) => router.push({ pathname: '/dish/[id]', params: { id } });

/**
 * Analysis + safe menu in one: while scanning, dishes appear in menu order and resolve one by one.
 * Afterwards they are grouped by menu section (collapsible) and sorted by risk, safest first.
 */
export default function AnalysisScreen() {
  const { items, sourceLabel } = useMenuSession();
  const scan = useScan();
  const [hideRisk, setHideRisk] = useState(false);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <TopBar onBack={goBack} />
        <View style={styles.content}>
          <AppText variant="title">Noch keine Speisekarte geladen.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const groups = groupDishes(items, scan.ratings, hideRisk);
  const riskCount = items.filter((item) => scan.ratings[item.id]?.status === 'unsafe').length;

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar onBack={goBack} />
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">{scan.done ? 'Deine Karte' : 'Live-Analyse'}</AppText>
          <Text style={styles.title}>{scan.done ? 'Das habe ich gefunden.' : 'Einen Moment – ich schnüffle für dich.'}</Text>
          {sourceLabel && <Text style={styles.source}>{sourceLabel}</Text>}
        </View>
        <ProgressRing progress={scan.progress} secondsLeft={scan.secondsLeft} />
      </View>
      <View style={styles.legend}>
        <LegendDot color={colors.green} label="Sicher (bestätigt)" />
        <LegendDot color={colors.orange} label="Nachfragen" />
        <LegendDot color={colors.red} label="Risiko" />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <RatingExplainer />

        {!scan.done ? (
          <ScanArea active progress={scan.progress} remaining={scan.duration - scan.elapsed}>
            {items.map((item, index) => {
              const header = item.section && item.section !== items[index - 1]?.section ? item.section : null;
              const state = scan.states[item.id];
              return (
                <View key={item.id}>
                  {header && <Text style={styles.section}>{header}</Text>}
                  <Dish item={item} number={index + 1} status={state.status} checking={state.checking} />
                </View>
              );
            })}
          </ScanArea>
        ) : (
          <>
            {riskCount > 0 && (
              <Pressable
                onPress={() => setHideRisk((value) => !value)}
                style={[styles.filter, hideRisk && styles.filterActive]}
                accessibilityRole="switch"
                accessibilityState={{ checked: hideRisk }}
              >
                <Text style={[styles.filterText, hideRisk && styles.filterTextActive]}>
                  {hideRisk
                    ? `${riskCount} ${riskCount === 1 ? 'Gericht' : 'Gerichte'} mit Risiko ausgeblendet – anzeigen`
                    : `${riskCount} ${riskCount === 1 ? 'Gericht' : 'Gerichte'} mit Risiko ausblenden`}
                </Text>
              </Pressable>
            )}
            {groups.map((group) => (
              <CollapsibleGroup
                key={group.title}
                title={group.title}
                subtitle={`${group.entries.length} ${group.entries.length === 1 ? 'Gericht' : 'Gerichte'}`}
                initiallyOpen
              >
                {group.entries.map((entry) => (
                  <Dish key={entry.item.id} item={entry.item} number={entry.number} status={entry.status} />
                ))}
              </CollapsibleGroup>
            ))}
          </>
        )}

        <Text style={styles.hint}>
          {scan.done ? 'Tippe auf ein Gericht für Details und um beim Personal nachzufragen.' : 'Du kannst Gerichte schon während der Prüfung öffnen.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Dish({ item, number, status, checking }: { item: MenuItem; number: number; status?: DishStatus; checking?: string }) {
  return (
    <DishCard
      number={number}
      title={item.name}
      subtitle={[germanLabel(item), item.price && `${item.price} €`].filter(Boolean).join(' · ')}
      status={status}
      checking={checking}
      confirmed={status === 'safe'}
      onPress={() => openDish(item.id)}
    />
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  content: { padding: 24 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 14 },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31, color: colors.ink, letterSpacing: -0.5 },
  source: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 6 },
  legend: { flexDirection: 'row', gap: 14, paddingHorizontal: 24, paddingBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 4 },
  section: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.muted, marginTop: 10, marginBottom: 8, marginLeft: 6 },
  filter: { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingVertical: 7, paddingHorizontal: 12, marginVertical: 4 },
  filterActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  filterTextActive: { color: colors.paper },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 16 },
});
