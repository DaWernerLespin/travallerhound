import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/constants/theme';

/** Bruno, the bloodhound mascot from the Click-Dummy. */
export function Hound({ size = 200 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 230) / 220} viewBox="0 0 220 230" accessibilityLabel="Bruno, der Bluthund">
      <Path fill="#72432f" d="M71 64C45 48 25 72 28 116c2 31 17 59 36 67 13 5 21-7 14-22-11-25-10-56 3-76 7-11 3-17-10-21Z" />
      <Path fill="#72432f" d="M149 64c26-16 46 8 43 52-2 31-17 59-36 67-13 5-21-7-14-22 11-25 10-56-3-76-7-11-3-17 10-21Z" />
      <Path fill="#b96d3f" d="M62 89c0-39 21-66 48-66s48 27 48 66c0 28-8 48-18 62-8 11-14 18-30 18s-22-7-30-18c-10-14-18-34-18-62Z" />
      <Path fill="#e9ae71" d="M102 25c-5 27-3 47 4 63 3 7 3 15 0 22l-8 19h24l-8-19c-3-7-3-15 0-22 7-16 9-36 4-63-5-2-11-2-16 0Z" />
      <Path fill="none" stroke="#3c2a26" strokeWidth={5} strokeLinecap="round" d="M72 86c10-9 22-8 29 2M148 86c-10-9-22-8-29 2" />
      <Circle fill="#2c2624" cx="86" cy="98" r="5" />
      <Circle fill="#2c2624" cx="134" cy="98" r="5" />
      <Path fill="#e9ae71" d="M84 119c6-10 15-14 26-8 11-6 20-2 26 8 9 15 2 40-26 40s-35-25-26-40Z" />
      <Path fill="#2c2624" d="M97 120c3-7 23-7 26 0 3 8-4 14-13 14s-16-6-13-14Z" />
      <Path fill="none" stroke="#3c2a26" strokeWidth={5} strokeLinecap="round" d="M110 134v11m0 0c-7 0-11-2-14-6m14 6c7 0 11-2 14-6" />
      <Path fill={colors.yellow} d="M61 170c27 13 71 13 98 0l-8 42-41-24-41 24-8-42Z" />
      <Circle fill={colors.paper} stroke={colors.ink} strokeWidth={4} cx="110" cy="182" r="13" />
      <Path fill="none" stroke={colors.coral} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" d="m104 182 4 4 8-9" />
    </Svg>
  );
}
