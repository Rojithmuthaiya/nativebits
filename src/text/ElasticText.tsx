
import React, { useEffect } from 'react';
import {
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface ElasticTextProps {
  text: string;
  duration?: number;
  delay?: number;
  amplitude?: number;
  damping?: number;
  stiffness?: number;
  loop?: boolean;
  pauseDuration?: number;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

export function ElasticText({
  text,
  duration = 220,
  delay = 0,
  amplitude = 0.5,
  damping = 7,
  stiffness = 160,
  loop = false,
  pauseDuration = 1000,
  style,
  containerStyle,
}: ElasticTextProps) {
  const stretch = useSharedValue(0);

  useEffect(() => {
    const springConfig = {
      damping,
      stiffness,
    };

    const animation = withSequence(
      // Stretch horizontally and squash vertically
      withTiming(amplitude, {
        duration,
        easing: Easing.out(Easing.cubic),
      }),

      // Overshoot in the opposite direction
      withTiming(-amplitude * 0.35, {
        duration: duration * 0.65,
        easing: Easing.out(Easing.quad),
      }),

      // Settle naturally
      withSpring(0, springConfig),
    );

    const startAnimation = () => {
      if (loop) {
        stretch.value = withRepeat(
          withSequence(
            animation,
            withTiming(0, { duration: pauseDuration }),
          ),
          -1,
          false,
        );
      } else {
        stretch.value = animation;
      }
    };

    const timeout = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimation(stretch);
    };
  }, [
    amplitude,
    damping,
    delay,
    duration,
    loop,
    pauseDuration,
    stiffness,
    stretch,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const value = stretch.value;

    return {
      transform: [
        {
          scaleX: 1 + value,
        },
        {
          scaleY: 1 - value * 0.45,
        },
      ],
    };
  });

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        containerStyle,
      ]}
    >
      <Animated.Text
        style={[
          {
            includeFontPadding: false,
          },
          style,
          animatedStyle,
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

export default ElasticText;
