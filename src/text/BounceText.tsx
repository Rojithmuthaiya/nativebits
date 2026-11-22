
import React, { useEffect } from 'react';
import {
  View,
  Text,
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
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface BounceTextProps {
  text: string;
  duration?: number;
  stagger?: number;
  delay?: number;
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
  delay: number;
  amplitude: number;
  loop: boolean;
  style?: TextStyle;
  characterStyle?: TextStyle;
}

function AnimatedCharacter({
  character,
  index,
  duration,
  stagger,
  delay,
  amplitude,
  loop,
  style,
  characterStyle,
}: AnimatedCharacterProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(translateY);
    translateY.value = 0;

    const bounce = withSequence(
      withSpring(-amplitude, {
        damping: 7,
        stiffness: 180,
        mass: 0.5,
      }),
      withSpring(0, {
        damping: 7,
        stiffness: 180,
        mass: 0.5,
      })
    );

    translateY.value = withDelay(
      delay + index * stagger,
      loop
        ? withRepeat(
            withSequence(
              bounce,
              withTiming(0, { duration })
            ),
            -1,
            false
          )
        : bounce
    );

    return () => cancelAnimation(translateY);
  }, [
    index,
    duration,
    stagger,
    delay,
    amplitude,
    loop,
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text
      style={[
        style,
        characterStyle,
        animatedStyle,
      ]}
    >
      {character === ' ' ? '\u00A0' : character}
    </Animated.Text>
  );
}

export function BounceText({
  text,
  duration = 500,
  stagger = 80,
  delay = 0,
  amplitude = 15,
  loop = false,
  style,
  characterStyle,
  containerStyle,
}: BounceTextProps) {
  const characters = Array.from(text);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
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
          delay={delay}
          amplitude={amplitude}
          loop={loop}
          style={style}
          characterStyle={characterStyle}
        />
      ))}
    </View>
  );
}
