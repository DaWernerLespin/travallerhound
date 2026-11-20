import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/chat-bubble';
import { CollapsibleGroup } from '@/components/collapsible-group';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { StaffChecklist } from '@/components/staff-checklist';
import { StatusBadge } from '@/components/status-badge';
import { FEATURES } from '@/constants/features';
import { colors, fonts } from '@/constants/theme';
import { ORDER_NOTES } from '@/features/order/notes';
import type { StaffReply } from '@/features/staff-chat/types';
import { useRenderedPhrases } from '@/features/staff-chat/use-rendered';
import { useVisitChat } from '@/features/staff-chat/use-visit-chat';

const back = () => (router.canGoBack() ? router.back() : router.replace('/analysis'));

/**
 * The one staff conversation of the visit. It checks the dishes of the Wunschliste one after another;
 * safe ones go to the Bestellliste. More dishes can be added any time without losing earlier answers.
 */
export default function VisitChatScreen() {
  const chat = useVisitChat();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const { pending, confirmed, dropped, ordered } = chat.overview;
  const wishCount = pending.length + confirmed.length + dropped.length + ordered.length;
  const staffMode = chat.activeQuestion !== null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={back} accessibilityLabel="Zurück" hitSlop={10}>
          <Icon name="arrow" />
        </Pressable>
        <Text style={styles.title}>Gespräch mit dem Personal</Text>
        <Pressable onPress={() => router.push('/bestellung')} style={styles.orderChip} accessibilityRole="button">
          <Icon name="list" size={16} />
          <Text style={styles.orderChipText}>{confirmed.length}</Text>
        </Pressable>
      </View>

      {pending.length > 1 && !staffMode && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pendingBar} contentContainerStyle={styles.pending}>
          {pending.map((id) => (
            <Pressable
              key={id}
              onPress={() => chat.choose(id)}
              style={[styles.pendingChip, chat.focus?.id === id && styles.pendingChipActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.pendingText, chat.focus?.id === id && styles.pendingTextActive]} numberOfLines={1}>
                {chat.itemOf(id)?.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {chat.focus && (
        <View style={styles.focus}>
          <View style={styles.focusRow}>
            <Text style={styles.focusLabel}>Jetzt</Text>
            <Text style={styles.focusName} numberOfLines={1}>
              {chat.focus.name}
            </Text>
            {chat.focusRating && <StatusBadge status={chat.focusRating.status} />}
          </View>
          {chat.virtualStaff && <Text style={styles.demoHint}>Demo · virtuelles Personal: {chat.virtualStaff}</Text>}
          {chat.checklist.length > 0 && <StaffChecklist items={chat.checklist} />}
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {wishCount === 0 && (
          <Text style={styles.empty}>
            Deine Wunschliste ist leer. Füge auf der Karte Gerichte mit + hinzu, dann frage ich das Personal nach jedem davon.
          </Text>
        )}
        {chat.messages.map((message) => (
          <ChatBubble key={message.id} side={message.side} fr={message.fr} de={message.de} />
        ))}
        {chat.staffTyping && <Text style={styles.typing}>Personal antwortet …</Text>}
      </ScrollView>

      {staffMode ? (
        <StaffPanel key={chat.activeQuestion?.id} replies={chat.staffReplies} onReply={chat.reply} />
      ) : (
        <View style={styles.footer}>
          {chat.focus && chat.openQuestions.length > 0 && (
            <CollapsibleGroup
              title={`Frage zu „${chat.focus.name}“`}
              subtitle={`${chat.openQuestions.length} ${chat.openQuestions.length === 1 ? 'Frage' : 'Fragen'} offen`}
              initiallyOpen
            >
              <View style={styles.questions}>
                {chat.openQuestions.map((question) => (
                  <Pressable key={question.id} onPress={() => chat.ask(question)} style={({ pressed }) => [styles.question, pressed && styles.pressed]}>
                    <Text style={styles.questionText}>{question.label}</Text>
                    <Icon name="chevron" size={18} color={colors.coral} />
                  </Pressable>
                ))}
              </View>
            </CollapsibleGroup>
          )}
          {pending.length === 0 && confirmed.length > 0 && (
            <PrimaryButton label={`Zur Bestellliste (${confirmed.length})`} icon="list" onPress={() => router.push('/bestellung')} />
          )}
          <PrimaryButton label="Weitere Gerichte hinzufügen" icon="plus" variant="outline" onPress={() => router.push('/analysis')} />
          {/* Later: free text with online translation. Built as a placeholder, switched off by FEATURES.freeChat. */}
          <View style={[styles.freeText, !FEATURES.freeChat && styles.disabled]}>
            <TextInput
              style={styles.freeInput}
              editable={FEATURES.freeChat}
              placeholder={FEATURES.freeChat ? 'Eigene Nachricht schreiben' : 'Freie Nachricht · bald verfügbar'}
              placeholderTextColor={colors.muted}
            />
            <Icon name="arrow" size={18} color={colors.muted} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/**
 * Shown while the phone is with the staff: French only, big tap targets. Can be folded away to read the chat.
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
          <Text style={styles.staffHint}>📱 Gib dem Personal jetzt dein Handy.</Text>
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
              style={({ pressed }) => [styles.reply, styles[reply.tone], pressed && styles.pressed]}
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
            <Pressable
              key={note.id}
              onPress={() => onReply(needsNote, note.id)}
              style={({ pressed }) => [styles.reply, styles.positive, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.replyText}>{note.fr}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setNeedsNote(null)} style={({ pressed }) => [styles.reply, styles.neutral, pressed && styles.pressed]}>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  title: { flex: 1, fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  orderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  orderChipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  pendingBar: { flexGrow: 0, flexShrink: 0 },
  pending: { paddingHorizontal: 16, gap: 6, paddingBottom: 6, alignItems: 'center' },
  pendingChip: { borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingVertical: 5, paddingHorizontal: 10, maxWidth: 200 },
  pendingChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pendingText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  pendingTextActive: { color: colors.paper },
  focus: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 4 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20 },
  focusLabel: { fontFamily: fonts.display, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.coral },
  focusName: { flex: 1, fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
  messages: { paddingHorizontal: 16, paddingVertical: 14 },
  empty: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 20, paddingHorizontal: 20 },
  footer: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8, gap: 8 },
  questions: { gap: 8 },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  questionText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  pressed: { opacity: 0.6 },
  staffPanel: { backgroundColor: colors.ink, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingVertical: 14, gap: 7 },
  staffHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chevronUp: { transform: [{ rotate: '-90deg' }] },
  chevronDown: { transform: [{ rotate: '90deg' }] },
  staffHint: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.yellow },
  staffTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.cream, marginTop: 2 },
  replyList: { maxHeight: 360 },
  replyGap: { gap: 7 },
  reply: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  positive: { backgroundColor: colors.greenSoft },
  negative: { backgroundColor: colors.redSoft },
  neutral: { backgroundColor: colors.paper },
  replyText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  demoHint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginHorizontal: 20, marginTop: 2 },
  typing: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted, marginVertical: 6, marginLeft: 4 },
  freeText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  disabled: { opacity: 0.5 },
  freeInput: { flex: 1, minHeight: 40, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
});
