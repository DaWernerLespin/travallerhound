import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

/** List wrapper with the coral scan line sweeping over the dishes while the analysis runs. */
export function ScanArea({
  active,
  progress,
  remaining,
  children,
}: {
  active: boolean;
  progress: number;
  remaining: number;
  children: ReactNode;
}) {
  const [height, setHeight] = useState(0);
  // Animated.Value kept in state (not a ref) so render may read it.
  const [position] = useState(() => new Animated.Value(progress));

  useEffect(() => {
    if (!active) return;
    const animation = Animated.timing(position, {
      toValue: 1,
      duration: Math.max(0, remaining * 1000),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // Start once per activation; progress/remaining are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)} style={styles.area}>
      {children}
      {active && height > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.line, { transform: [{ translateY: position.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { gap: 9 },
  line: {
    position: 'absolute',
    left: -16,
    right: -16,
    top: 0,
    height: 3,
    backgroundColor: colors.coral,
    shadowColor: colors.coral,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
});
