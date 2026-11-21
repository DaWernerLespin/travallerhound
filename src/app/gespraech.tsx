import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/chat-bubble';
import { FreeTextInput } from '@/components/free-text-input';
import { Icon } from '@/components/icon';
import { FEATURES } from '@/constants/features';
import { colors, fonts, radius } from '@/constants/theme';
import { germanLabel } from '@/features/menu-input/german-label';
import type { TravelerDecision } from '@/features/dish-rating/types';
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
  /** Accent only once every dish is checked and at least one can be ordered. */
  const orderReady = allChecked && confirmed.length > 0;
  const staffMode = chat.staffMode;

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
          style={[styles.order, orderReady && styles.orderReady]}
          accessibilityRole="button"
          accessibilityLabel={`Bestellliste, ${confirmed.length} Gerichte`}
        >
          <Icon name="list" size={16} color={orderReady ? colors.white : colors.ink} />
          <Text style={[styles.orderText, orderReady && styles.orderTextReady]}>
            Bestellliste {confirmed.length}
            {orderReady ? ' →' : ''}
          </Text>
        </Pressable>
      </View>

      {/* Pinned above the chat, so it never covers new messages. */}
      {chat.focus && chat.canDecide && <DecisionRow name={germanName(chat.focus) ?? chat.focus.name} onDecide={chat.decide} />}
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
        <StaffPanel key={chat.activeQuestion?.id ?? 'free'} replies={chat.staffReplies} onReply={chat.reply} onFreeText={chat.replyFree} />
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
                <View style={styles.flex}>
                  <Text style={styles.nowName} numberOfLines={1}>
                    {chat.focus.name}
                  </Text>
                  <Text style={styles.nowGerman} numberOfLines={1}>
                    {germanLabel(chat.focus)}
                  </Text>
                </View>
                {pending.length > 1 && <Text style={styles.nowMore}>{picking ? 'schließen' : `+${pending.length - 1} offen`}</Text>}
                {pending.length <= 1 && <Text style={styles.badge}>offen</Text>}
              </Pressable>
              {picking ? (
                <View style={styles.chips}>
                  {pending.flatMap((id) => {
                    const item = chat.itemOf(id);
                    if (!item) return [];
                    const active = id === chat.focus?.id;
                    return [
                      <Pressable
                        key={id}
                        onPress={() => {
                          chat.choose(id);
                          setPicking(false);
                        }}
                        style={[styles.chip, active && styles.chipActive]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.chipGerman, active && styles.chipGermanActive]} numberOfLines={1}>
                          {germanLabel(item)}
                        </Text>
                      </Pressable>,
                    ];
                  })}
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
          <FreeTextInput
            enabled={FEATURES.freeChat && !chat.staffTyping}
            placeholder={FEATURES.freeChat ? 'Eigene Frage auf Deutsch schreiben' : 'Freie Nachricht · bald verfügbar'}
            busyLabel="Übersetze …"
            errorLabel="Übersetzung fehlgeschlagen. Bitte erneut versuchen."
            onSend={chat.askFree}
          />
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

/** Chat message: result cards for dishes, bubbles otherwise (the intro to the staff is shown in full). */
function Message({ message, name, notes }: { message: ChatMessage; name?: string; notes?: string[] }) {
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
  return <ChatBubble side={message.side} fr={message.fr} de={message.de} free={message.free} />;
}

/** After a free-text answer, free text never rates a dish: the traveller decides themselves. */
function DecisionRow({ name, onDecide }: { name: string; onDecide: (decision: TravelerDecision) => void }) {
  return (
    <View style={styles.decision}>
      <Text style={styles.decisionText}>Bitte wähle eine Bewertung für „{name}“ wenn Du Dir sicher bist.</Text>
      <View style={styles.decisionButtons}>
        <Pressable onPress={() => onDecide('safe')} style={({ pressed }) => [styles.decide, styles.decideSafe, pressed && styles.pressed]} accessibilityRole="button">
          <Icon name="check" size={14} color={colors.white} />
          <Text style={styles.decideText}>Sicher</Text>
        </Pressable>
        <Pressable onPress={() => onDecide('unsafe')} style={({ pressed }) => [styles.decide, styles.decideUnsafe, pressed && styles.pressed]} accessibilityRole="button">
          <Icon name="close" size={14} color={colors.white} />
          <Text style={styles.decideText}>Nicht sicher</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Real product (no demo restaurant): shown while the phone is with the staff. French only, big tap targets.
 * "Oui, avec une modification" lets the staff pick the change (e.g. salad instead of fries) that makes the dish safe.
 */
function StaffPanel({
  replies,
  onReply,
  onFreeText,
}: {
  replies: StaffReply[];
  onReply: (reply: StaffReply, noteId?: string) => void;
  onFreeText: (text: string) => Promise<void>;
}) {
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
      {open && !needsNote && (
        <FreeTextInput
          dark
          enabled
          placeholder="Autre réponse : écrivez en français"
          busyLabel="Traduction …"
          errorLabel="La traduction a échoué. Réessayez."
          onSend={onFreeText}
        />
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
  orderReady: { backgroundColor: colors.brand, borderColor: colors.brand, shadowColor: colors.brand, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  orderText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  orderTextReady: { color: colors.white },
  messages: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  empty: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 20, paddingHorizontal: 20 },
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
  nowName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  nowGerman: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 },
  nowMore: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink, textDecorationLine: 'underline' },
  badge: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.muted, backgroundColor: colors.line, borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8, overflow: 'hidden' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 14, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.white, paddingVertical: 5, paddingHorizontal: 10, maxWidth: '100%' },
  chipActive: { backgroundColor: colors.ink },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink },
  chipTextActive: { color: colors.paper },
  chipGerman: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  chipGermanActive: { color: colors.line },
  pressed: { opacity: 0.5 },
  decision: { gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.paper, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  decisionText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  decisionButtons: { flexDirection: 'row', gap: 8 },
  decide: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingVertical: 8 },
  decideSafe: { backgroundColor: colors.green },
  decideUnsafe: { backgroundColor: colors.red },
  decideText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white },
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
