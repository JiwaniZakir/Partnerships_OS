import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface WaveformProps {
  isActive: boolean;
}

const BAR_COUNT = 40;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_HEIGHT = 60;
const MIN_HEIGHT_STATIC = 4;

function WaveformBar({ index, isActive }: { index: number; isActive: boolean }) {
  const height = useSharedValue(MIN_HEIGHT_STATIC);

  // Each bar gets a pseudo-random base height and animation delay
  const baseHeight = ((Math.sin(index * 1.7 + 3.14) + 1) / 2) * 0.6 + 0.2;
  const delay = (index * 47) % 400;

  useEffect(() => {
    if (isActive) {
      const targetMin = baseHeight * MAX_HEIGHT * 0.3;
      const targetMax = baseHeight * MAX_HEIGHT;

      height.value = withDelay(
        delay,
        withRepeat(
          withTiming(targetMax, {
            duration: 300 + (index % 5) * 80,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        )
      );

      // Start from a mid value
      height.value = withDelay(
        delay,
        withRepeat(
          withTiming(targetMax, {
            duration: 300 + (index % 5) * 80,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        )
      );
    } else {
      height.value = withTiming(MIN_HEIGHT_STATIC, { duration: 300 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
      ]}
    />
  );
}

export function Waveform({ isActive }: WaveformProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <WaveformBar key={i} index={i} isActive={isActive} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: MAX_HEIGHT,
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    backgroundColor: 'rgba(241, 239, 231, 0.8)',
  },
});
