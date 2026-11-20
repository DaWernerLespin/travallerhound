import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { colors } from '@/constants/theme';

export type IconName =
  | 'arrow'
  | 'camera'
  | 'chevron'
  | 'shield'
  | 'spark'
  | 'check'
  | 'close'
  | 'question'
  | 'file'
  | 'text'
  | 'menu'
  | 'qr'
  | 'plus'
  | 'speaker'
  | 'list';

/** Line icons from the Click-Dummy (24×24). */
export function Icon({ name, size = 22, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {PATHS[name]}
      </G>
    </Svg>
  );
}

const PATHS: Record<IconName, React.ReactNode> = {
  plus: <Path d="M12 5v14M5 12h14" />,
  speaker: (
    <>
      <Path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <Path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  list: (
    <>
      <Path d="M9 6h11M9 12h11M9 18h11" />
      <Path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </>
  ),
  qr: (
    <>
      <Rect x="4" y="4" width="6" height="6" rx="1" />
      <Rect x="14" y="4" width="6" height="6" rx="1" />
      <Rect x="4" y="14" width="6" height="6" rx="1" />
      <Path d="M14 14h2v2h-2zM18 14h2M14 18v2M18 18h2v2h-2z" />
    </>
  ),
  arrow: (
    <>
      <Path d="M19 12H5" />
      <Path d="m12 19-7-7 7-7" />
    </>
  ),
  camera: (
    <>
      <Path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z" />
      <Circle cx="12" cy="13" r="3.5" />
    </>
  ),
  chevron: <Path d="m9 18 6-6-6-6" />,
  shield: (
    <>
      <Path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Z" />
      <Path d="m9 12 2 2 4-4" />
    </>
  ),
  spark: (
    <>
      <Path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
      <Path d="m5 16 .7 2.3L8 19l-2.3.7L5 22l-.7-2.3L2 19l2.3-.7L5 16Z" />
    </>
  ),
  check: <Path d="m5 12 4 4L19 6" />,
  close: (
    <>
      <Path d="m6 6 12 12" />
      <Path d="M18 6 6 18" />
    </>
  ),
  question: (
    <>
      <Path d="M9.4 9a3 3 0 1 1 4.1 2.8c-1 .5-1.5 1.1-1.5 2.2" />
      <Path d="M12 18h.01" />
    </>
  ),
  file: (
    <>
      <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <Path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  text: (
    <>
      <Path d="M4 7V5h16v2M12 5v14M9 19h6" />
    </>
  ),
  menu: (
    <>
      <Rect x="4" y="3" width="16" height="18" rx="2" />
      <Path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
};
