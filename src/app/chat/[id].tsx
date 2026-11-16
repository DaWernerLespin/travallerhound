import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/chat-bubble';
import { Hound } from '@/components/hound';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { SafetyNotice } from '@/components/safety-notice';
import { StatusBadge } from '@/components/status-badge';
import { colors, fonts, radius } from '@/constants/theme';
import type { DishStatus } from '@/features/dish-rating/types';
import type { StaffReply } from '@/features/staff-chat/types';
import { useRenderedPhrases } from '@/features/staff-chat/use-rendered';
import { useStaffChat } from '@/features/staff-chat/use-staff-chat';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chat = useStaffChat(id);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  if (!chat.item || !chat.rating) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.empty}>Gericht nicht gefunden.</Text>
      </SafeAreaView>
    );
  }

  const status = chat.rating.status;
  const staffMode = chat.activeQuestion !== null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Zurück" hitSlop={10}>
          <Icon name="arrow" />
        </Pressable>
        <Hound size={34} />
        <View style={styles.flex}>
          <Text style={styles.headerTitle}>Bruno übersetzt</Text>
          <Text style={styles.headerSub}>Deutsch ↔ Französisch</Text>
        </View>
      </View>
      <View style={styles.context}>
        <Text style={styles.dish} numberOfLines={1}>
          {chat.item.name}
        </Text>
        <StatusBadge status={status} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {chat.messages.length === 0 && (
          <Text style={styles.intro}>
            Wähle unten eine Frage. Ich übersetze sie ins Französische – dann gibst du dem Personal dein Handy.
          </Text>
        )}
        {chat.messages.map((message) => (
          <ChatBubble key={message.id} side={message.side} fr={message.fr} de={message.de} />
        ))}
        <ResultBanner status={status} ordered={chat.ordered} />
      </ScrollView>

      {staffMode ? (
        <StaffPanel replies={chat.staffReplies} onReply={chat.reply} />
      ) : (
        <View style={styles.footer}>
          {status === 'safe' && !chat.ordered && <PrimaryButton label="Bestellen" icon="check" onPress={() => setNoticeVisible(true)} />}
          {status === 'unsafe' && !chat.ordered && (
            <PrimaryButton
              label="Anderes Gericht wählen"
              icon="arrow"
              variant="outline"
              onPress={async () => {
                await chat.decline();
                router.back();
              }}
            />
          )}
          {status !== 'safe' && status !== 'unsafe' && chat.openQuestions.length === 0 && (
            <>
              <Text style={styles.stuck}>Das Personal konnte nicht alles bestätigen. Wähle zur Sicherheit lieber ein anderes Gericht.</Text>
              <PrimaryButton label="Anderes Gericht wählen" icon="arrow" variant="outline" onPress={() => router.back()} />
            </>
          )}
          {status !== 'safe' && status !== 'unsafe' &&
            chat.openQuestions.map((question) => (
              <Pressable key={question.id} onPress={() => chat.ask(question)} style={({ pressed }) => [styles.question, pressed && styles.pressed]}>
                <Text style={styles.questionText}>{question.label}</Text>
                <Icon name="chevron" size={18} color={colors.coral} />
              </Pressable>
            ))}
          {chat.ordered && <PrimaryButton label="Zurück zur Karte" icon="arrow" variant="outline" onPress={() => router.dismissTo('/analysis')} />}
        </View>
      )}

      <SafetyNotice
        visible={noticeVisible}
        onCancel={() => setNoticeVisible(false)}
        onConfirm={async () => {
          setNoticeVisible(false);
          await chat.order();
        }}
      />
    </SafeAreaView>
  );
}

/** Shown while the phone is with the staff: French only, big tap targets. */
function StaffPanel({ replies, onReply }: { replies: StaffReply[]; onReply: (reply: StaffReply) => void }) {
  const texts = useRenderedPhrases(
    replies.map((r) => r.phrase),
    'fr',
  );
  return (
    <View style={styles.staffPanel}>
      <Text style={styles.staffHint}>📱 Gib dem Personal jetzt dein Handy.</Text>
      <Text style={styles.staffTitle}>Pour le personnel : touchez votre réponse.</Text>
      {replies.map((reply, index) => (
        <Pressable
          key={reply.id}
          onPress={() => onReply(reply)}
          style={({ pressed }) => [styles.reply, styles[reply.tone], pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.replyText}>{texts[index] ?? '…'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ResultBanner({ status, ordered }: { status: DishStatus; ordered: boolean }) {
  if (ordered) {
    return (
      <View style={[styles.banner, styles.bannerSafe]}>
        <Icon name="check" size={22} color={colors.green} />
        <Text style={styles.bannerTitle}>Bestellt. Guten Appetit!</Text>
      </View>
    );
  }
  if (status === 'safe') {
    return (
      <View style={[styles.banner, styles.bannerSafe]}>
        <Icon name="check" size={22} color={colors.green} />
        <View style={styles.flex}>
          <Text style={styles.bannerTitle}>Dieses Gericht ist sicher.</Text>
          <Text style={styles.bannerText}>Das Personal bestätigt: keine Erdnüsse, keine Lupinen, keine Kreuzkontamination.</Text>
        </View>
      </View>
    );
  }
  if (status === 'unsafe') {
    return (
      <View style={[styles.banner, styles.bannerUnsafe]}>
        <Icon name="shield" size={22} color={colors.red} />
        <View style={styles.flex}>
          <Text style={styles.bannerTitle}>Dieses Gericht ist nicht sicher.</Text>
          <Text style={styles.bannerText}>Ein Allergierisiko kann nicht ausgeschlossen werden. Wähle bitte ein anderes Gericht.</Text>
        </View>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  empty: { padding: 24, fontFamily: fonts.body },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  headerSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#ece9df',
  },
  dish: { flex: 1, fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
  messages: { paddingHorizontal: 16, paddingVertical: 14 },
  intro: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 20, paddingHorizontal: 20 },
  footer: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8, gap: 8 },
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
  stuck: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.orangeText, textAlign: 'center' },
  staffPanel: { backgroundColor: colors.ink, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, gap: 8 },
  staffHint: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.yellow },
  staffTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.cream, marginBottom: 4 },
  reply: { borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14 },
  positive: { backgroundColor: colors.greenSoft },
  negative: { backgroundColor: colors.redSoft },
  neutral: { backgroundColor: colors.paper },
  replyText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  banner: { flexDirection: 'row', gap: 12, borderRadius: radius.card, padding: 14, marginTop: 12, alignItems: 'flex-start' },
  bannerSafe: { backgroundColor: colors.greenSoft },
  bannerUnsafe: { backgroundColor: colors.redSoft },
  bannerTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  bannerText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink, marginTop: 3 },
});
