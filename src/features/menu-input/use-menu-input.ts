import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { useMenuSession } from '@/features/menu-session/session-context';

import { menuTextSource } from './index';
import type { DemoMenu } from './demo-menus';
import type { MenuFile } from './types';

/** A picked file whose text has to be typed by the user (no OCR offline). */
export type ManualFile = MenuFile & { isImage: boolean; reason: string };

/**
 * Menu input flow: photo / upload / demo / typed text → menu text → new analysis.
 * Calls `onLoaded` once dishes were found.
 */
export function useMenuInput(onLoaded: () => void) {
  const { loadMenuText } = useMenuSession();
  const [manualFile, setManualFile] = useState<ManualFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = (text: string, sourceLabel: string, menuId?: string) => {
    const count = loadMenuText(text, sourceLabel, menuId);
    if (count === 0) {
      setError('Ich habe keine Gerichte gefunden. Schreib bitte ein Gericht pro Zeile.');
      return;
    }
    setError(null);
    setManualFile(null);
    onLoaded();
  };

  const handleFile = async (file: MenuFile) => {
    setBusy(true);
    try {
      const result = await menuTextSource.extract(file);
      if (result.kind === 'text') {
        load(result.text, result.sourceLabel);
      } else {
        const isImage = (file.mimeType ?? '').startsWith('image/') || /\.(png|jpe?g|webp|heic)$/i.test(file.name);
        setManualFile({ ...file, isImage, reason: result.reason });
      }
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Ohne Kamerazugriff kann ich kein Foto machen. Du kannst die Karte auch hochladen oder abtippen.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    const asset = result.assets[0];
    await handleFile({
      uri: asset.uri,
      name: asset.fileName ?? 'foto.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize,
    });
  };

  const uploadFile = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    await handleFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
  };

  const loadDemo = (menu: DemoMenu) => load(menu.text, menu.title, menu.id);

  const submitText = (text: string) => load(text, manualFile ? manualFile.name : 'Eigene Eingabe');

  return { takePhoto, uploadFile, loadDemo, submitText, manualFile, clearManualFile: () => setManualFile(null), error, busy };
}
