import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { SafetyNotice } from '@/components/safety-notice';
import { TopBar } from '@/components/top-bar';
import { colors, fonts, radius } from '@/constants/theme';
import { germanLabel } from '@/features/menu-input/german-label';
import { useMenuSession } from '@/features/menu-session/session-context';
import { ORDER_NOTES, withNotes } from '@/features/order/notes';
import { useVisitChat } from '@/features/staff-chat/use-visit-chat';
import { speakFrench } from '@/lib/speech';

const back = () => (router.canGoBack() ? router.back() : router.replace('/analysis'));

/**
 * Bestellliste: the dishes the staff confirmed as safe, with preset notes ("ohne Sauce").
 * Everything is ordered together; more dishes can be added and checked afterwards.
 */
export default function OrderListScreen() {
  const session = useMenuSession();
  const chat = useVisitChat({ active: false });
  const { pending, confirmed, dropped, ordered } = chat.overview;
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [watched, setWatched] = useState<boolean | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const order = async (watch: boolean) => {
    setNoticeVisible(false);
    setWatched(watch);
    await chat.orderAll();
  };
  const frenchList = confirmed.map((id) => `• ${withNotes(chat.itemOf(id)?.name ?? '', chat.notes[id] ?? [], 'fr')}`).join('\n');

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar onBack={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="eyebrow">Bestellliste</AppText>
        <AppText variant="display">Das kannst du bestellen</AppText>

        {confirmed.length === 0 && ordered.length === 0 && (
          <Text style={styles.empty}>
            Noch kein Gericht bestätigt. Setze Gerichte auf die Wunschliste und kläre sie im Gespräch mit dem Personal.
          </Text>
        )}

        {confirmed.map((id) => {
          const item = chat.itemOf(id);
          if (!item) return null;
          const notes = chat.notes[id] ?? [];
          return (
            <View key={id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.flex}>
                  <Text style={styles.dish}>{item.name}</Text>
                  <Text style={styles.sub}>{germanLabel(item)}</Text>
                </View>
                <Pressable onPress={() => session.removeFromWishlist(id)} hitSlop={8} accessibilityLabel="Entfernen">
                  <Icon name="close" size={18} color={colors.muted} />
                </Pressable>
              </View>
              {notes.length > 0 && <Text style={styles.notes}>{withNotes('', notes, 'de').replace(/^, /, '')}</Text>}
              <Pressable onPress={() => setEditing(editing === id ? null : id)} style={styles.noteToggle}>
                <Text style={styles.noteToggleText}>{editing === id ? 'Fertig' : 'Hinweis hinzufügen'}</Text>
              </Pressable>
              {editing === id && (
                <View style={styles.noteWrap}>
                  {ORDER_NOTES.map((note) => {
                    const on = notes.includes(note.id);
                    return (
                      <Pressable
                        key={note.id}
                        onPress={() => session.toggleNote(id, note.id)}
                        style={[styles.noteChip, on && styles.noteChipOn]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                      >
                        <Text style={[styles.noteChipText, on && styles.noteChipTextOn]}>{note.de}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {confirmed.length > 0 && (
          <View style={styles.staffCard}>
            <View style={styles.cardHead}>
              <Text style={[styles.flex, styles.staffTitle]}>Pour le personnel</Text>
              <Pressable onPress={() => speakFrench(`Je voudrais commander : ${frenchList.replace(/•/g, '')}`)} hitSlop={8} accessibilityLabel="Vorlesen">
                <Icon name="speaker" size={18} color={colors.yellow} />
              </Pressable>
            </View>
            <Text style={styles.staffText}>{frenchList}</Text>
          </View>
        )}

        {watched !== null && confirmed.length === 0 && ordered.length > 0 && (
          <View style={styles.banner}>
            <Icon name="check" size={22} color={colors.green} />
            <View style={styles.flex}>
              <Text style={styles.bannerTitle}>Bestellt. Guten Appetit!</Text>
              {!watched && <Text style={styles.bannerText}>Ohne Überwachung. Deine Begleitung ist für dich da.</Text>}
            </View>
          </View>
        )}

        <Group title="Noch mit dem Personal klären" ids={pending} itemOf={chat.itemOf} />
        <Group title="Fällt weg (nicht sicher)" ids={dropped} itemOf={chat.itemOf} muted />
        <Group title="Bereits bestellt" ids={ordered} itemOf={chat.itemOf} notes={chat.notes} />
      </ScrollView>

      <View style={styles.footer}>
        {confirmed.length > 0 && (
          <PrimaryButton label={`Alles bestellen (${confirmed.length})`} icon="check" onPress={() => setNoticeVisible(true)} />
        )}
        {(pending.length > 0 || (ordered.length > 0 && confirmed.length === 0)) && (
          <PrimaryButton label="Zurück zum Gespräch" icon="chevron" variant="outline" onPress={() => router.push('/gespraech')} />
        )}
        <PrimaryButton label="Weitere Gerichte hinzufügen" icon="plus" variant="outline" onPress={() => router.push('/analysis')} />
      </View>

      <SafetyNotice visible={noticeVisible} onCancel={() => setNoticeVisible(false)} onConfirm={() => order(true)} onSkip={() => order(false)} />
    </SafeAreaView>
  );
}

function Group({
  title,
  ids,
  itemOf,
  muted = false,
  notes = {},
}: {
  title: string;
  ids: string[];
  itemOf: (id: string) => { name: string } | undefined;
  muted?: boolean;
  notes?: Record<string, string[]>;
}) {
  if (ids.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {ids.map((id) => (
        <Text key={id} style={[styles.groupItem, muted && styles.groupItemMuted]}>
          {withNotes(itemOf(id)?.name ?? '', notes[id] ?? [], 'de')}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 10 },
  empty: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 8 },
  card: { backgroundColor: colors.paper, borderRadius: radius.card, borderWidth: 1, borderColor: '#ece9df', padding: 14, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dish: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  notes: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.green },
  noteToggle: { alignSelf: 'flex-start', paddingVertical: 2 },
  noteToggleText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.coral },
  noteWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  noteChip: { borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingVertical: 5, paddingHorizontal: 10 },
  noteChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  noteChipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  noteChipTextOn: { color: colors.paper },
  staffCard: { backgroundColor: colors.ink, borderRadius: radius.card, padding: 14, gap: 6 },
  staffTitle: { fontFamily: fonts.display, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.yellow },
  staffText: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22, color: colors.cream },
  banner: { flexDirection: 'row', gap: 12, borderRadius: radius.card, padding: 14, backgroundColor: colors.greenSoft },
  bannerTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  bannerText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink, marginTop: 3 },
  group: { marginTop: 8, gap: 4 },
  groupTitle: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.muted },
  groupItem: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  groupItemMuted: { color: colors.muted, textDecorationLine: 'line-through' },
  footer: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8, gap: 8 },
});
