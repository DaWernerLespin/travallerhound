import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { colors } from '@/constants/theme';

export type Allergen = 'peanut' | 'lupin';

/** Peanut or lupin drawn inside a red "no" sign (24×24). */
export function AllergenIcon({ allergen, size = 22 }: { allergen: Allergen; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G transform="translate(4.8 4.8) scale(0.6)" stroke={colors.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {GLYPHS[allergen]}
      </G>
      <Circle cx="12" cy="12" r="10" stroke={colors.red} strokeWidth={2} />
      <Line x1="5" y1="5" x2="19" y2="19" stroke={colors.red} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

const GLYPHS: Record<Allergen, React.ReactNode> = {
  // Peanut shell: two lobes with a waist.
  peanut: (
    <>
      <Path d="M12 2.5c-3 0-4.8 2.3-4.8 4.8 0 1.7.8 2.7.8 3.8s-1 2.1-1 4.1c0 3.1 2.2 6.3 5 6.3s5-3.2 5-6.3c0-2-1-3-1-4.1s.8-2.1.8-3.8c0-2.5-1.8-4.8-4.8-4.8Z" />
      <Path d="M10.5 6.5h.01M13.5 8h.01M10.5 15h.01M13.5 17h.01" />
    </>
  ),
  // Lupin: flower spike on a stem.
  lupin: (
    <>
      <Path d="M12 22V9" />
      <Path d="M12 18c-2 0-3.5-1-4-2.5M12 18c2 0 3.5-1 4-2.5" />
      <Circle cx="12" cy="3.5" r="1.4" />
      <Circle cx="10" cy="6.5" r="1.5" />
      <Circle cx="14" cy="6.5" r="1.5" />
      <Circle cx="9.4" cy="10" r="1.6" />
      <Circle cx="14.6" cy="10" r="1.6" />
    </>
  ),
};
