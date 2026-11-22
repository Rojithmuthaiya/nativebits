
import React, { useEffect } from 'react';
import {
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface WaveTextProps {
  text: string;
  duration?: number;
  stagger?: number;
  amplitude?: number;
  loop?: boolean;
  style?: TextStyle;
  characterStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

interface AnimatedCharacterProps {
  character: string;
  index: number;
  duration: number;
  stagger: number;
  amplitude: number;
  loop: boolean;
  style?: TextStyle;
  characterStyle?: TextStyle;
}

const AnimatedCharacter = ({
  character,
  index,
  duration,
  stagger,
  amplitude,
  loop,
  style,
  characterStyle,
}: AnimatedCharacterProps) => {
  const progress = useSharedValue(0);

useEffect(() => {
  const animation = withTiming(
    1,
    {
      duration,
      easing: Easing.inOut(Easing.sin),
    },
  );

  progress.value = withDelay(
    index * stagger,
    loop
      ? withRepeat(animation, -1, true)
      : animation,
  );

  return () => {
    cancelAnimation(progress);
  };
}, [duration, index, stagger, loop]);

const animatedStyle = useAnimatedStyle(() => {
  const translateY =
    -Math.sin(progress.value * Math.PI) * amplitude;

  return {
    transform: [{ translateY }],
  };
});

  return (
    <Animated.Text
      style={[style, characterStyle, animatedStyle]}
    >
      {character === ' ' ? '\u00A0' : character}
    </Animated.Text>
  );
};

export const WaveText = ({
  text,
  duration = 500,
  stagger = 80,
  amplitude = 12,
  style,
  characterStyle,
  containerStyle,
  loop = false,
}: WaveTextProps) => {
  const characters = Array.from(text);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        containerStyle,
      ]}
    >
      {characters.map((character, index) => (
        <AnimatedCharacter
          key={`${index}-${character}`}
          character={character}
          index={index}
          duration={duration}
          stagger={stagger}
          amplitude={amplitude}
          loop={loop}
          style={style}
          characterStyle={characterStyle}
        />
      ))}
    </View>
  );
};
