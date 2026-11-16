import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts } from '@/constants/theme';

import { Icon } from './icon';

const RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Countdown ring from the Click-Dummy. progress 0..1; shows a shield when done. */
export function ProgressRing({ progress, secondsLeft }: { progress: number; secondsLeft: number }) {
  const done = progress >= 1;
  return (
    <View style={styles.box} accessibilityLabel={done ? 'Analyse abgeschlossen' : `${secondsLeft} Sekunden verbleibend`}>
      <Svg width={46} height={46} viewBox="0 0 46 46" style={styles.svg}>
        <Circle cx="23" cy="23" r={RADIUS} stroke="#e2e1d9" strokeWidth={3} fill="none" />
        <Circle
          cx="23"
          cy="23"
          r={RADIUS}
          stroke={done ? colors.green : colors.coral}
          strokeWidth={3}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={done ? 0 : CIRCUMFERENCE * progress}
        />
      </Svg>
      <View style={styles.center}>
        {done ? <Icon name="shield" size={20} color={colors.green} /> : <Text style={styles.text}>{secondsLeft}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 46, height: 46 },
  svg: { transform: [{ rotate: '-90deg' }] },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.display, fontSize: 12, color: colors.ink },
});
