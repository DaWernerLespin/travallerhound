import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/chat-bubble';
import { Icon } from '@/components/icon';
import { FEATURES } from '@/constants/features';
import { colors, fonts, radius } from '@/constants/theme';
import type { MenuItem } from '@/features/menu-input/types';
import { ORDER_NOTES, withNotes } from '@/features/order/notes';
import type { WishState } from '@/features/order/order-state';
import type { ChatMessage, StaffReply } from '@/features/staff-chat/types';
import { useRenderedPhrases } from '@/features/staff-chat/use-rendered';
import { useVisitChat } from '@/features/staff-chat/use-visit-chat';

/** Result cards are for the traveller: German dish name when the dish is known, else the menu name. */
const germanName = (item?: MenuItem) => (item ? (item.match?.dish.de ?? item.name) : undefined);

const back = () => (router.canGoBack() ? router.back() : router.replace('/analysis'));

/**
 * The one staff conversation of the visit. The chat is the focus:
 * - header: back, progress (one segment per Wunschliste dish), the only way to the Bestellliste
 * - chat: messages + a clear result card per dish (safe / not safe)
 * - dock: current dish with its questions, free text (later), "add more dishes" last
 * Colours: neutral, green/red only as verdict signal, accent yellow only when all dishes are checked.
 */
export default function VisitChatScreen() {
  const chat = useVisitChat();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [picking, setPicking] = useState(false);
  const { pending, confirmed, dropped, ordered } = chat.overview;
  const total = chat.wishlist.length;
  const allChecked = total > 0 && pending.length === 0;
  const staffMode = chat.activeQuestion !== null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={back} accessibilityLabel="Zurück" hitSlop={10}>
          <Icon name="arrow" />
        </Pressable>
        <View style={styles.progress} accessibilityLabel={`${total - pending.length} von ${total} Gerichten geklärt`}>
          {chat.wishlist.map((id) => (
            <View key={id} style={[styles.segment, segmentStyle(chat.stateOf(id), id === chat.focus?.id)]} />
          ))}
        </View>
        <Pressable
          onPress={() => router.push('/bestellung')}
          style={[styles.order, allChecked && confirmed.length > 0 && styles.orderReady]}
          accessibilityRole="button"
          accessibilityLabel={`Bestellliste, ${confirmed.length} Gerichte`}
        >
          <Icon name="list" size={16} />
          <Text style={styles.orderText}>
            Bestellliste {confirmed.length}
            {allChecked && confirmed.length > 0 ? ' →' : ''}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {total === 0 && (
          <Text style={styles.empty}>
            Deine Wunschliste ist leer. Füge auf der Karte Gerichte mit + hinzu, dann frage ich das Personal nach jedem davon.
          </Text>
        )}
        {chat.messages.map((message) => (
          <Message key={message.id} message={message} name={message.itemId ? germanName(chat.itemOf(message.itemId)) : undefined} notes={message.itemId ? chat.notes[message.itemId] : undefined} />
        ))}
        {chat.staffTyping && <Text style={styles.typing}>Personal antwortet …</Text>}
        {allChecked && !staffMode && (
          <Text style={styles.summary}>
            {total === ordered.length
              ? 'Alles bestellt. Guten Appetit!'
              : `${total === 1 ? 'Das Gericht ist geklärt.' : `Alle ${total} Gerichte geklärt: ${confirmed.length + ordered.length} sicher, ${dropped.length} nicht sicher.`}${confirmed.length > 0 ? ' Weiter oben rechts zur Bestellliste.' : ''}`}
          </Text>
        )}
      </ScrollView>

      {staffMode ? (
        <StaffPanel key={chat.activeQuestion?.id} replies={chat.staffReplies} onReply={chat.reply} />
      ) : (
        <View style={styles.dock}>
          {chat.focus && (
            <>
              <Pressable
                onPress={() => pending.length > 1 && setPicking((value) => !value)}
                style={styles.now}
                accessibilityRole={pending.length > 1 ? 'button' : undefined}
                accessibilityHint={pending.length > 1 ? 'Anderes Gericht wählen' : undefined}
              >
                <Text style={styles.nowLabel}>JETZT</Text>
                <Text style={styles.nowName} numberOfLines={1}>
                  {chat.focus.name}
                </Text>
                {pending.length > 1 && <Text style={styles.nowMore}>{picking ? 'schließen' : `+${pending.length - 1} offen`}</Text>}
                {pending.length <= 1 && <Text style={styles.badge}>offen</Text>}
              </Pressable>
              {picking ? (
                <View style={styles.chips}>
                  {pending.map((id) => (
                    <Pressable
                      key={id}
                      onPress={() => {
                        chat.choose(id);
                        setPicking(false);
                      }}
                      style={[styles.chip, id === chat.focus?.id && styles.chipActive]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.chipText, id === chat.focus?.id && styles.chipTextActive]} numberOfLines={1}>
                        {chat.itemOf(id)?.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.chips}>
                  {chat.openQuestions.map((question) => (
                    <Pressable
                      key={question.id}
                      onPress={() => chat.ask(question)}
                      disabled={chat.staffTyping}
                      style={({ pressed }) => [styles.chip, (pressed || chat.staffTyping) && styles.pressed]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipText}>{question.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
          {/* Later: free text with online translation (FEATURES.freeChat). */}
          <View style={[styles.freeText, !FEATURES.freeChat && styles.disabled]}>
            <TextInput
              style={styles.freeInput}
              editable={FEATURES.freeChat}
              placeholder={FEATURES.freeChat ? 'Eigene Nachricht schreiben' : 'Freie Nachricht · bald verfügbar'}
              placeholderTextColor={colors.muted}
            />
            <Icon name="chevron" size={16} color={colors.muted} />
          </View>
          <Pressable onPress={() => router.push('/analysis')} hitSlop={8} accessibilityRole="button">
            <Text style={styles.add}>+ Weitere Gerichte hinzufügen</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function segmentStyle(state: WishState, current: boolean) {
  if (state === 'confirmed' || state === 'ordered') return styles.segmentSafe;
  if (state === 'dropped') return styles.segmentUnsafe;
  return current ? styles.segmentNow : null;
}

/** Chat message: intro collapsed to one line, result cards for dishes, bubbles otherwise. */
function Message({ message, name, notes }: { message: ChatMessage; name?: string; notes?: string[] }) {
  const [open, setOpen] = useState(false);
  if (message.kind === 'intro' && !open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={styles.pill} accessibilityRole="button">
        <Text style={styles.pillText}>✓ Allergie dem Personal erklärt · anzeigen</Text>
      </Pressable>
    );
  }
  if (message.kind === 'safe' || message.kind === 'unsafe') {
    const safe = message.kind === 'safe';
    return (
      <View style={[styles.result, safe ? styles.resultSafe : styles.resultUnsafe]}>
        <View style={[styles.resultIcon, { backgroundColor: safe ? colors.green : colors.red }]}>
          <Icon name={safe ? 'check' : 'close'} size={15} color={colors.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.resultTitle}>
            {name ?? 'Gericht'} ist {safe ? 'sicher' : 'nicht sicher'}
          </Text>
          <Text style={styles.resultText}>
            {safe ? withNotes('Auf der Bestellliste', notes ?? [], 'de').replace('Bestellliste, ', 'Bestellliste · ') : message.de}
          </Text>
        </View>
      </View>
    );
  }
  return <ChatBubble side={message.side} fr={message.fr} de={message.de} />;
}

/**
 * Real product (no demo restaurant): shown while the phone is with the staff. French only, big tap targets.
 * "Oui, avec une modification" lets the staff pick the change (e.g. salad instead of fries) that makes the dish safe.
 */
function StaffPanel({ replies, onReply }: { replies: StaffReply[]; onReply: (reply: StaffReply, noteId?: string) => void }) {
  const [open, setOpen] = useState(true);
  const [needsNote, setNeedsNote] = useState<StaffReply | null>(null);
  const texts = useRenderedPhrases(
    replies.map((r) => (r.needsNote ? { ...r.phrase, params: { noteFr: '…', noteDe: '…' } } : r.phrase)),
    'fr',
  );
  return (
    <View style={styles.staffPanel}>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.staffHead} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={styles.flex}>
          <Text style={styles.staffHint}>Gib dem Personal jetzt dein Handy.</Text>
          <Text style={styles.staffTitle}>
            {needsNote ? 'Quelle modification ? Touchez-la.' : 'Pour le personnel : touchez votre réponse.'}
          </Text>
        </View>
        <View style={open ? styles.chevronDown : styles.chevronUp}>
          <Icon name="chevron" size={18} color={colors.cream} />
        </View>
      </Pressable>
      {open && !needsNote && (
        <ScrollView style={styles.replyList} contentContainerStyle={styles.replyGap}>
          {replies.map((reply, index) => (
            <Pressable
              key={reply.id}
              onPress={() => (reply.needsNote ? setNeedsNote(reply) : onReply(reply))}
              style={({ pressed }) => [styles.reply, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.replyText}>{(texts[index] ?? '…').replace(' : ….', ' …')}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {open && needsNote && (
        <ScrollView style={styles.replyList} contentContainerStyle={styles.replyGap}>
          {ORDER_NOTES.map((note) => (
            <Pressable key={note.id} onPress={() => onReply(needsNote, note.id)} style={({ pressed }) => [styles.reply, pressed && styles.pressed]} accessibilityRole="button">
              <Text style={styles.replyText}>{note.fr}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setNeedsNote(null)} style={({ pressed }) => [styles.reply, pressed && styles.pressed]}>
            <Text style={styles.replyText}>← Retour</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.line },
  segmentSafe: { backgroundColor: colors.green },
  segmentUnsafe: { backgroundColor: colors.red },
  segmentNow: { backgroundColor: colors.ink },
  order: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  orderReady: { backgroundColor: colors.yellow, borderColor: colors.yellow, shadowColor: colors.yellow, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  orderText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  messages: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  empty: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 20, paddingHorizontal: 20 },
  pill: { alignSelf: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingVertical: 5, paddingHorizontal: 11, marginVertical: 4 },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted },
  result: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, padding: 12, borderLeftWidth: 4, marginVertical: 4 },
  resultSafe: { borderLeftColor: colors.green },
  resultUnsafe: { borderLeftColor: colors.red },
  resultIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  resultText: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: colors.ink, marginTop: 2 },
  typing: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted, marginVertical: 4, marginLeft: 4 },
  summary: { alignSelf: 'center', textAlign: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.muted, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingVertical: 6, paddingHorizontal: 12, marginTop: 6 },
  dock: { backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 8 },
  now: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nowLabel: { fontFamily: fonts.display, fontSize: 10, letterSpacing: 1.2, color: colors.muted },
  nowName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  nowMore: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink, textDecorationLine: 'underline' },
  badge: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.muted, backgroundColor: colors.line, borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8, overflow: 'hidden' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.white, paddingVertical: 5, paddingHorizontal: 10, maxWidth: '100%' },
  chipActive: { backgroundColor: colors.ink },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink },
  chipTextActive: { color: colors.paper },
  pressed: { opacity: 0.5 },
  freeText: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12 },
  disabled: { opacity: 0.55 },
  freeInput: { flex: 1, minHeight: 38, fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  add: { textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  staffPanel: { backgroundColor: colors.ink, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingVertical: 14, gap: 7 },
  staffHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chevronUp: { transform: [{ rotate: '-90deg' }] },
  chevronDown: { transform: [{ rotate: '90deg' }] },
  staffHint: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.welcomeText },
  staffTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.cream, marginTop: 2 },
  replyList: { maxHeight: 360 },
  replyGap: { gap: 7 },
  reply: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.paper },
  replyText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
});
