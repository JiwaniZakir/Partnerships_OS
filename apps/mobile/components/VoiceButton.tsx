import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = 120;

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
}

export function VoiceButton({
  isRecording,
  isProcessing,
  onPress,
}: VoiceButtonProps) {
  const pulseScale = useSharedValue(1);
  const ringRotation = useSharedValue(0);

  React.useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else if (isProcessing) {
      ringRotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1
      );
    } else {
      pulseScale.value = withTiming(1);
      ringRotation.value = 0;
    }
  }, [isRecording, isProcessing]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Outer glow ring */}
      <Animated.View style={[styles.ring, ringStyle, isRecording && styles.ringActive]} />

      {/* Main button */}
      <Animated.View style={[styles.buttonOuter, pulseStyle]}>
        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.buttonRecording,
            isProcessing && styles.buttonProcessing,
          ]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={[styles.micIcon, isRecording && styles.micIconActive]}>
            <View style={styles.micBody} />
            <View style={styles.micBase} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: BUTTON_SIZE + 40,
    height: BUTTON_SIZE + 40,
  },
  ring: {
    position: 'absolute',
    width: BUTTON_SIZE + 30,
    height: BUTTON_SIZE + 30,
    borderRadius: (BUTTON_SIZE + 30) / 2,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  ringActive: {
    borderColor: 'rgba(99, 102, 241, 0.8)',
    borderWidth: 3,
  },
  buttonOuter: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonRecording: {
    backgroundColor: '#EF4444',
  },
  buttonProcessing: {
    backgroundColor: '#8B5CF6',
  },
  micIcon: {
    alignItems: 'center',
  },
  micIconActive: {
    opacity: 0.9,
  },
  micBody: {
    width: 16,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  micBase: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
});
