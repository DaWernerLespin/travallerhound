import * as Speech from 'expo-speech';

/** Reads French text aloud for the staff (device voice, works offline on most phones and in the browser). */
export function speakFrench(text: string): void {
  Speech.stop();
  Speech.speak(text, { language: 'fr-FR', rate: 0.95 });
}

export function stopSpeaking(): void {
  Speech.stop();
}
