import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { CollapsibleGroup } from '@/components/collapsible-group';
import { FreeTextInput } from '@/components/free-text-input';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { SafetyNotice } from '@/components/safety-notice';
import { SpeakButton } from '@/components/speak-button';
import { TopBar } from '@/components/top-bar';
import { colors, fonts, radius } from '@/constants/theme';
import { germanLabel } from '@/features/menu-input/german-label';
import { useMenuSession } from '@/features/menu-session/session-context';
import { addCustomNote, findNote, isCustomNote, ORDER_NOTES, withNotes } from '@/features/order/notes';
import { textTranslator } from '@/features/staff-chat';
import { useVisitChat } from '@/features/staff-chat/use-visit-chat';

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
  /** The traveller's own note in German, translated to French for the staff. Throws if translation fails. */
  const addOwnNote = async (itemId: string, de: string) => {
    const text = de.trim();
    if (!text) return;
    const fr = await textTranslator.translate(text, 'de', 'fr');
    session.toggleNote(itemId, addCustomNote(text, fr).id, true);
  };
  const frenchList = confirmed.map((id) => `• ${withNotes(chat.itemOf(id)?.name ?? '', chat.notes[id] ?? [], 'fr')}`).join('\n');

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar onBack={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="display">Bestellliste</AppText>

        {confirmed.length === 0 && ordered.length === 0 && (
          <Text style={styles.empty}>
            Noch kein Gericht bestätigt. Setze Gerichte auf die Wunschliste und kläre sie im Gespräch mit dem Personal.
          </Text>
        )}

        {/* One list: large French for the staff, German small underneath for the traveller. */}
        {confirmed.length > 0 && (
          <View style={styles.staffCard}>
            <View style={styles.cardHead}>
              <Text style={[styles.flex, styles.staffTitle]}>Pour le personnel</Text>
              <SpeakButton text={`Je voudrais commander : ${frenchList.replace(/•/g, '')}`} size={18} color={colors.brand} />
            </View>
            {confirmed.map((id, index) => {
              const item = chat.itemOf(id);
              if (!item) return null;
              const notes = chat.notes[id] ?? [];
              const noteText = (lang: 'de' | 'fr') => withNotes('', notes, lang).replace(/^, /, '');
              return (
                <View key={id} style={[styles.item, index > 0 && styles.itemBorder]}>
                  <View style={styles.cardHead}>
                    <View style={styles.flex}>
                      <Text style={styles.dish}>{item.name}</Text>
                      {notes.length > 0 && <Text style={styles.frNote}>{noteText('fr')}</Text>}
                      <Text style={styles.sub}>
                        {germanLabel(item)}
                        {notes.length > 0 ? ` · ${noteText('de')}` : ''}
                      </Text>
                    </View>
                    <Pressable onPress={() => session.removeFromWishlist(id)} hitSlop={8} accessibilityLabel="Entfernen">
                      <Icon name="close" size={16} color={colors.welcomeText} />
                    </Pressable>
                  </View>
                  <Pressable onPress={() => setEditing(editing === id ? null : id)} style={styles.noteToggle}>
                    <Text style={styles.noteToggleText}>
                      {editing === id ? 'Fertig' : notes.length > 0 ? 'Hinweis ändern' : 'Hinweis hinzufügen'}
                    </Text>
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
                      {notes.filter(isCustomNote).map((noteId) => (
                        <Pressable
                          key={noteId}
                          onPress={() => session.toggleNote(id, noteId, false)}
                          style={[styles.noteChip, styles.noteChipOn]}
                          accessibilityRole="button"
                          accessibilityLabel={`Eigenen Hinweis entfernen: ${findNote(noteId)?.de ?? ''}`}
                        >
                          <Text style={[styles.noteChipText, styles.noteChipTextOn]}>{findNote(noteId)?.de} ✕</Text>
                        </Pressable>
                      ))}
                      <View style={styles.ownNote}>
                        <FreeTextInput
                          dark
                          enabled
                          placeholder="Eigener Hinweis auf Deutsch, z. B. ohne Koriander"
                          busyLabel="Übersetze …"
                          errorLabel="Übersetzung fehlgeschlagen. Bitte erneut versuchen."
                          onSend={(text) => addOwnNote(id, text)}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
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
        {dropped.length > 0 && (
          <CollapsibleGroup title={`${dropped.length} ${dropped.length === 1 ? 'Gericht' : 'Gerichte'} nicht bestellbar`}>
            <Group ids={dropped} itemOf={chat.itemOf} muted />
          </CollapsibleGroup>
        )}
        <Group title="Bereits bestellt" ids={ordered} itemOf={chat.itemOf} notes={chat.notes} />
      </ScrollView>

      <View style={styles.footer}>
        {confirmed.length > 0 && (
          <PrimaryButton label={`Alles bestellen (${confirmed.length})`} icon="check" onPress={() => setNoticeVisible(true)} />
        )}
        {(pending.length > 0 || (ordered.length > 0 && confirmed.length === 0)) && (
          <PrimaryButton label="Zurück zum Gespräch" icon="chevron" variant="outline" onPress={() => router.push('/gespraech')} />
        )}
        <Pressable onPress={() => router.push('/analysis')} style={styles.addLink} accessibilityRole="button">
          <Text style={styles.addLinkText}>+ Weitere Gerichte hinzufügen</Text>
        </Pressable>
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
  title?: string;
  ids: string[];
  itemOf: (id: string) => { name: string } | undefined;
  muted?: boolean;
  notes?: Record<string, string[]>;
}) {
  if (ids.length === 0) return null;
  return (
    <View style={styles.group}>
      {title && <Text style={styles.groupTitle}>{title}</Text>}
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
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  staffCard: { backgroundColor: colors.ink, borderRadius: 20, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, marginTop: 6 },
  staffTitle: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.welcomeText },
  item: { paddingVertical: 10 },
  itemBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' },
  dish: { fontFamily: fonts.displayBold, fontSize: 16, lineHeight: 21, color: colors.white },
  frNote: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.cream, marginTop: 2 },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.welcomeText, marginTop: 4 },
  noteToggle: { alignSelf: 'flex-start', paddingVertical: 2, marginTop: 6 },
  noteToggleText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.brand },
  noteWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  ownNote: { width: '100%', marginTop: 2 },
  noteChip: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingVertical: 5, paddingHorizontal: 10 },
  noteChipOn: { backgroundColor: colors.cream, borderColor: colors.cream },
  noteChipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.cream },
  noteChipTextOn: { color: colors.ink },
  banner: { flexDirection: 'row', gap: 12, borderRadius: radius.card, padding: 14, backgroundColor: colors.greenSoft },
  bannerTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  bannerText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink, marginTop: 3 },
  group: { marginTop: 8, gap: 4 },
  groupTitle: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.muted },
  groupItem: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  groupItemMuted: { color: colors.muted, textDecorationLine: 'line-through' },
  footer: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8, gap: 8 },
  addLink: { alignItems: 'center', paddingVertical: 6 },
  addLinkText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
});
