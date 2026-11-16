import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { DishCard } from '@/components/dish-card';
import { PrimaryButton } from '@/components/primary-button';
import { ProgressRing } from '@/components/progress-ring';
import { TopBar } from '@/components/top-bar';
import { colors, fonts } from '@/constants/theme';
import { useMenuSession } from '@/features/menu-session/session-context';
import { useScan } from '@/features/menu-session/use-scan';

export default function AnalysisScreen() {
  const { items, sourceLabel } = useMenuSession();
  const scan = useScan();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <TopBar onBack={() => router.back()} />
        <View style={styles.content}>
          <AppText variant="title">Noch keine Speisekarte geladen.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText variant="eyebrow">{scan.done ? 'Analyse abgeschlossen' : 'Live-Analyse'}</AppText>
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
        <ScanArea active={!scan.done} progress={scan.progress} remaining={scan.duration - scan.elapsed}>
          {items.map((item, index) => {
            const header = item.section && item.section !== items[index - 1]?.section ? item.section : null;
            const state = scan.states[item.id];
            return (
              <View key={item.id}>
                {header && <Text style={styles.section}>{header}</Text>}
                <DishCard
                  number={index + 1}
                  title={item.name}
                  subtitle={item.match?.dish.de ?? 'Unbekanntes Gericht'}
                  status={state.status}
                  checking={state.checking}
                  confirmed={state.status === 'safe'}
                  onPress={() => router.push({ pathname: '/dish/[id]', params: { id: item.id } })}
                />
              </View>
            );
          })}
        </ScanArea>
        <Text style={styles.hint}>
          {scan.done ? 'Tippe auf ein Gericht für Details und um beim Personal nachzufragen.' : 'Du kannst Gerichte schon während der Prüfung öffnen.'}
        </Text>
      </ScrollView>

      {scan.done && (
        <View style={styles.footer}>
          <PrimaryButton label="Meine sichere Karte" icon="shield" onPress={() => router.push('/safe-menu')} />
        </View>
      )}
    </SafeAreaView>
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

/** List wrapper with the coral scan line sweeping over the dishes. */
function ScanArea({ active, progress, remaining, children }: { active: boolean; progress: number; remaining: number; children: React.ReactNode }) {
  const [height, setHeight] = useState(0);
  // Animated.Value kept in state (not a ref) so render may read it.
  const [position] = useState(() => new Animated.Value(progress));

  useEffect(() => {
    if (!active) return;
    const animation = Animated.timing(position, {
      toValue: 1,
      duration: Math.max(0, remaining * 1000),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // Start once per activation; progress/remaining are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)} style={styles.scanArea}>
      {children}
      {active && height > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.scanLine, { transform: [{ translateY: position.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] }]}
        />
      )}
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
  legend: { flexDirection: 'row', gap: 14, paddingHorizontal: 24, paddingBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  scanArea: { gap: 9 },
  section: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.muted, marginTop: 10, marginBottom: 8, marginLeft: 6 },
  scanLine: {
    position: 'absolute',
    left: -16,
    right: -16,
    top: 0,
    height: 3,
    backgroundColor: colors.coral,
    shadowColor: colors.coral,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 16 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, backgroundColor: colors.canvas },
});
