
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
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface RotateTextProps {
  text: string;
  duration?: number;
  stagger?: number;
  delay?: number;
  rotation?: number;
  axis?: 'x' | 'y' | 'z';
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
  axis: 'x' | 'y' | 'z';
  perspective: number;
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
  rotation,
  axis,
  perspective,
  loop,
  style,
  characterStyle,
}: AnimatedCharacterProps) {
  const rotate = useSharedValue(rotation);

  useEffect(() => {
    cancelAnimation(rotate);
    rotate.value = rotation;

    const animation = loop
      ? withRepeat(
          withSequence(
            withTiming(0, {
              duration,
              easing: Easing.out(Easing.cubic),
            }),
            withTiming(rotation, {
              duration,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          false
        )
      : withTiming(0, {
          duration,
          easing: Easing.out(Easing.cubic),
        });

    rotate.value = withDelay(
      delay + index * stagger,
      animation
    );

    return () => cancelAnimation(rotate);
  }, [
    rotation,
    duration,
    stagger,
    delay,
    index,
    loop,
    rotate,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const transform =
      axis === 'x'
        ? [
            { perspective },
            { rotateX: `${rotate.value}deg` },
          ]
        : axis === 'y'
          ? [
              { perspective },
              { rotateY: `${rotate.value}deg` },
            ]
          : [{ rotate: `${rotate.value}deg` }];

    return {
      transform,
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
}

export function RotateText({
  text,
  duration = 700,
  stagger = 50,
  delay = 0,
  rotation = 90,
  axis = 'y',
  perspective = 600,
  loop = false,
  style,
  characterStyle,
  containerStyle,
}: RotateTextProps) {
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
}
