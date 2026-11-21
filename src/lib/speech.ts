import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/**
 * Reads French text aloud for the staff.
 * 1. Azure Speech (neural voice, online) when a key is configured: EXPO_PUBLIC_AZURE_SPEECH_KEY / _REGION / _VOICE
 *    (put them in `.env.local`, and in Vercel's environment variables for the web build).
 * 2. Otherwise, or if Azure fails (offline, quota): the device voice via expo-speech, preferring an "Enhanced" French voice.
 * Security is out of scope for the MVP: the key ships with the app.
 */
const AZURE_KEY = process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION ?? 'westeurope';
const AZURE_VOICE = process.env.EXPO_PUBLIC_AZURE_SPEECH_VOICE ?? 'fr-FR-DeniseNeural';
/** Speaking speed of the Azure voice relative to normal, e.g. '-10%' slower, '35%' faster. */
const AZURE_RATE = '35%';

/** Audio already generated in this session, so the same sentence costs one request only. */
const audioCache = new Map<string, string>();
let player: AudioPlayer | null = null;
let audioModeSet = false;

/** Text currently being read aloud (or loading), so its button can turn into a stop button. */
let speakingText: string | null = null;
const listeners = new Set<() => void>();
/** Bumped on every start/stop, so callbacks of an older playback are ignored. */
let generation = 0;

function setSpeaking(text: string | null): void {
  speakingText = text;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True while `text` is being read aloud. */
export function useIsSpeaking(text: string): boolean {
  return useSyncExternalStore(subscribe, () => speakingText === text);
}

export function speakFrench(text: string): void {
  stopSpeaking();
  const id = ++generation;
  setSpeaking(text);
  const current = () => id === generation;
  const done = () => {
    if (current()) setSpeaking(null);
  };
  if (!AZURE_KEY) {
    void speakWithDevice(text, done, current);
    return;
  }
  azureAudio(text)
    .then((uri) => {
      if (current()) return play(uri, done);
    })
    .catch(() => {
      if (current()) return speakWithDevice(text, done, current);
    });
}

export function stopSpeaking(): void {
  generation++;
  Speech.stop();
  player?.pause();
  setSpeaking(null);
}

/** Starts reading `text`, or stops it if it is the one being read. */
export function toggleFrench(text: string): void {
  if (speakingText === text) stopSpeaking();
  else speakFrench(text);
}

async function azureAudio(text: string): Promise<string> {
  const cached = audioCache.get(text);
  if (cached) return cached;
  const ssml =
    `<speak version="1.0" xml:lang="fr-FR"><voice name="${AZURE_VOICE}">` +
    `<prosody rate="${AZURE_RATE}">${escapeXml(text)}</prosody></voice></speak>`;
  const response = await fetch(`https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY ?? '',
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
    },
    body: ssml,
  });
  if (!response.ok) throw new Error(`Azure TTS ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());

  let uri: string;
  if (Platform.OS === 'web') {
    uri = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
  } else {
    const file = new File(Paths.cache, `tts-${hash(AZURE_VOICE + text)}.mp3`);
    file.create({ overwrite: true });
    file.writeSync(bytes);
    uri = file.uri;
  }
  audioCache.set(text, uri);
  return uri;
}

async function play(uri: string, onDone: () => void): Promise<void> {
  if (!audioModeSet) {
    audioModeSet = true;
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }
  player?.remove();
  player = createAudioPlayer(uri);
  player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) onDone();
  });
  player.play();
}

/** Device voice as fallback: an "Enhanced" French voice if the phone has one, else the default fr-FR voice. */
let deviceVoice: string | null | undefined;
async function speakWithDevice(text: string, onDone: () => void, current: () => boolean): Promise<void> {
  if (deviceVoice === undefined) {
    const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
    const french = voices.filter((voice) => voice.language.toLowerCase().startsWith('fr'));
    const best = french.find((voice) => voice.quality === Speech.VoiceQuality.Enhanced) ?? french[0];
    deviceVoice = best?.identifier ?? null;
  }
  if (!current()) return;
  Speech.speak(text, {
    language: 'fr-FR',
    rate: 0.95,
    voice: deviceVoice ?? undefined,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function hash(text: string): string {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) | 0;
  return (value >>> 0).toString(36);
}
