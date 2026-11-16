import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { DishCard } from '@/components/dish-card';
import { TopBar } from '@/components/top-bar';
import { colors, fonts } from '@/constants/theme';
import type { DishStatus } from '@/features/dish-rating/types';
import { useMenuSession, useRatings } from '@/features/menu-session/session-context';

const GROUPS: { status: DishStatus; title: string; text: string }[] = [
  { status: 'safe', title: 'Vom Personal bestätigt', text: 'Kannst du bestellen.' },
  { status: 'likely_safe', title: 'Wahrscheinlich sicher', text: 'Keine typischen Risiken – frag kurz beim Personal nach.' },
  { status: 'undefined', title: 'Unklar', text: 'Versteckte Zutaten möglich – nur nach Rücksprache.' },
];

/** German "safe menu": everything that is not red, confirmed dishes first. */
export default function SafeMenuScreen() {
  const { items } = useMenuSession();
  const ratings = useRatings();
  const excluded = items.filter((item) => ratings[item.id]?.status === 'unsafe').length;

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="eyebrow">Deine Karte</AppText>
        <AppText variant="display">Was du essen kannst.</AppText>
        <AppText style={styles.lead}>
          {excluded > 0
            ? `${excluded} ${excluded === 1 ? 'Gericht habe ich' : 'Gerichte habe ich'} wegen Erdnuss oder Lupine aussortiert.`
            : 'Kein Gericht enthält laut Karte oder Rezept sicher Erdnuss oder Lupine.'}
        </AppText>

        {GROUPS.map((group) => {
          const groupItems = items.filter((item) => ratings[item.id]?.status === group.status);
          if (groupItems.length === 0) return null;
          return (
            <View key={group.status} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <Text style={styles.groupText}>{group.text}</Text>
              {groupItems.map((item) => (
                <DishCard
                  key={item.id}
                  number={items.indexOf(item) + 1}
                  title={item.match?.dish.de ?? item.name}
                  subtitle={[item.name, item.price && `${item.price} €`].filter(Boolean).join(' · ')}
                  status={group.status}
                  confirmed={group.status === 'safe'}
                  onPress={() => router.push({ pathname: '/dish/[id]', params: { id: item.id } })}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  lead: { color: colors.muted, marginTop: 10 },
  group: { marginTop: 22, gap: 8 },
  groupTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  groupText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: 2 },
});
