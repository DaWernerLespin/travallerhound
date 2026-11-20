import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { CollapsibleGroup } from '@/components/collapsible-group';
import { DishCard } from '@/components/dish-card';
import { PrimaryButton } from '@/components/primary-button';
import { RatingExplainer } from '@/components/rating-explainer';
import { ScanArea } from '@/components/scan-area';
import { TopBar } from '@/components/top-bar';
import { colors, fonts } from '@/constants/theme';
import type { DishStatus } from '@/features/dish-rating/types';
import { germanLabel } from '@/features/menu-input/german-label';
import { sectionTitle } from '@/features/menu-input/section-names';
import type { MenuItem } from '@/features/menu-input/types';
import { groupDishes } from '@/features/menu-session/group-dishes';
import { useMenuSession } from '@/features/menu-session/session-context';
import { useScan } from '@/features/menu-session/use-scan';
import { useVisitChat } from '@/features/staff-chat/use-visit-chat';

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
  const { items, sourceLabel, wishlist, addToWishlist, removeFromWishlist } = useMenuSession();
  const scan = useScan();
  const { overview } = useVisitChat({ active: false });
  const toggleWish = (id: string) => (wishlist.includes(id) ? removeFromWishlist(id) : addToWishlist(id));
  const [hideRisk, setHideRisk] = useState(false);
  const [explain, setExplain] = useState(false);

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
        <Text style={styles.title}>{scan.done ? (sourceLabel ?? 'Deine Karte') : 'Ich prüfe die Karte …'}</Text>
        <View style={styles.meta}>
          <Text style={styles.source} numberOfLines={1}>
            {scan.done ? `${items.length} ${items.length === 1 ? 'Gericht' : 'Gerichte'} geprüft` : (sourceLabel ?? '')}
          </Text>
          <Pressable onPress={() => setExplain((value) => !value)} hitSlop={8} accessibilityRole="button" accessibilityState={{ expanded: explain }}>
            <Text style={styles.metaLink}>Wie bewerte ich?</Text>
          </Pressable>
        </View>
        {!scan.done && (
          <View style={styles.bar} accessibilityLabel={`Noch ${scan.secondsLeft} Sekunden`}>
            <View style={[styles.barFill, { width: `${Math.min(100, scan.progress * 100)}%` }]} />
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {explain && <RatingExplainer bare />}

        {!scan.done ? (
          <ScanArea active progress={scan.progress} remaining={scan.duration - scan.elapsed}>
            {items.map((item, index) => {
              const header = item.section && item.section !== items[index - 1]?.section ? item.section : null;
              const state = scan.states[item.id];
              return (
                <View key={item.id}>
                  {header && <Text style={styles.section}>{sectionTitle(header)}</Text>}
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
                    ? `${riskCount} ${riskCount === 1 ? 'Gericht' : 'Gerichte'} mit Risiko ausgeblendet. Anzeigen`
                    : `${riskCount} ${riskCount === 1 ? 'Gericht' : 'Gerichte'} mit Risiko ausblenden`}
                </Text>
              </Pressable>
            )}
            {groups.map((group) => (
              <CollapsibleGroup
                key={group.title}
                title={sectionTitle(group.title)}
                subtitle={`${group.entries.length} ${group.entries.length === 1 ? 'Gericht' : 'Gerichte'}`}
                initiallyOpen
              >
                {group.entries.map((entry) => (
                  <Dish
                    key={entry.item.id}
                    item={entry.item}
                    number={entry.number}
                    status={entry.status}
                    wished={wishlist.includes(entry.item.id)}
                    // Risky dishes can't go on the Wunschliste; ordered ones are done.
                    onToggleWish={
                      entry.status === 'unsafe' || overview.ordered.includes(entry.item.id) ? undefined : () => toggleWish(entry.item.id)
                    }
                  />
                ))}
              </CollapsibleGroup>
            ))}
          </>
        )}

        <Text style={styles.hint}>
          {scan.done
            ? 'Mit + setzt du Gerichte auf deine Wunschliste. Dann klärst du alle in einem Gespräch mit dem Personal und bestellst zusammen.'
            : 'Du kannst Gerichte schon während der Prüfung öffnen.'}
        </Text>
      </ScrollView>

      {scan.done && wishlist.length > 0 && (
        <View style={styles.footer}>
          {overview.pending.length > 0 && (
            <PrimaryButton label={`Personal fragen (${overview.pending.length})`} icon="chevron" onPress={() => router.push('/gespraech')} />
          )}
          {(overview.confirmed.length > 0 || overview.pending.length === 0) && (
            <PrimaryButton
              label={`Bestellliste (${overview.confirmed.length})`}
              icon="list"
              variant={overview.pending.length > 0 ? 'outline' : 'ink'}
              onPress={() => router.push('/bestellung')}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function Dish({
  item,
  number,
  status,
  checking,
  wished,
  onToggleWish,
}: {
  item: MenuItem;
  number: number;
  status?: DishStatus;
  checking?: string;
  wished?: boolean;
  onToggleWish?: () => void;
}) {
  return (
    <DishCard
      number={number}
      title={item.name}
      subtitle={[germanLabel(item), item.price && `${item.price} €`].filter(Boolean).join(' · ')}
      status={status}
      checking={checking}
      confirmed={status === 'safe'}
      wished={wished}
      onToggleWish={onToggleWish}
      onPress={() => openDish(item.id)}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  content: { padding: 24 },
  head: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 12 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, color: colors.ink, letterSpacing: -0.5 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  source: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  metaLink: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  bar: { height: 4, borderRadius: 2, backgroundColor: colors.line, marginTop: 12, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2, backgroundColor: colors.ink },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 4 },
  section: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.muted, marginTop: 10, marginBottom: 8, marginLeft: 6 },
  filter: { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingVertical: 7, paddingHorizontal: 12, marginVertical: 4 },
  filterActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  filterTextActive: { color: colors.paper },
  footer: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8, gap: 8, borderTopWidth: 1, borderTopColor: colors.line },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 16 },
});
