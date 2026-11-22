
import React, { useEffect } from 'react';
import {
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export interface FlipTextProps {
  text: string;
  duration?: number;
  stagger?: number;
  delay?: number;
  rotation?: number;
  axis?: 'x' | 'y';
  perspective?: number;
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
  rotation: number;
  axis: 'x' | 'y';
  perspective: number;
  loop: boolean;
  style?: TextStyle;
  characterStyle?: TextStyle;
}

const AnimatedCharacter = ({
  character,
  index,
  duration,
  stagger,
  delay,
  rotation,
  axis,
  perspective,
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
        easing: Easing.out(Easing.cubic),
      },
    );

    progress.value = withDelay(
      delay + index * stagger,
      loop
        ? withTiming(1, {
            duration,
            easing: Easing.out(Easing.cubic),
          })
        : animation,
    );

    return () => {
      progress.value = 0;
    };
  }, [duration, stagger, delay, index, loop, progress]);

const animatedStyle = useAnimatedStyle(() => {
  const angle = rotation * (1 - progress.value);

  if (axis === 'x') {
    return {
      opacity: progress.value,
      transform: [
        { perspective },
        { rotateX: `${angle}deg` },
      ],
    };
  }

  return {
    opacity: progress.value,
    transform: [
      { perspective },
      { rotateY: `${angle}deg` },
    ],
  };
});

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
};

export const FlipText = ({
  text,
  duration = 600,
  stagger = 60,
  delay = 0,
  rotation = 90,
  axis = 'x',
  perspective = 600,
  loop = false,
  style,
  characterStyle,
  containerStyle,
}: FlipTextProps) => {
  const characters = Array.from(text);

  return (
    <View
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
          delay={delay}
          rotation={rotation}
          axis={axis}
          perspective={perspective}
          loop={loop}
          style={style}
          characterStyle={characterStyle}
        />
      ))}
    </View>
  );
};
