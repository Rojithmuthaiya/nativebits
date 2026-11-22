import React, { memo, useEffect } from 'react';
import {
  Platform,
  View,
  type StyleProp,
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

export interface SplitTextProps {
  /** Text to reveal one character at a time. */
  text: string;
  /** Duration of each character animation, in milliseconds. */
  duration?: number;
  /** Delay between the start of adjacent character animations, in milliseconds. */
  stagger?: number;
  /** Delay before the first character starts, in milliseconds. */
  delay?: number;
  /** Initial vertical offset, in logical pixels. */
  fromY?: number;
  /** Text style applied to each character. */
  style?: StyleProp<TextStyle>;
  /** Optional style applied to each animated character. */
  characterStyle?: StyleProp<TextStyle>;
  /** Optional style for the wrapping container. */
  containerStyle?: StyleProp<ViewStyle>;
}

interface CharacterProps {
  character: string;
  index: number;
  duration: number;
  stagger: number;
  delay: number;
  fromY: number;
  style?: StyleProp<TextStyle>;
  characterStyle?: StyleProp<TextStyle>;
}

const AnimatedCharacter = memo(({
  character,
  index,
  duration,
  stagger,
  delay,
  fromY,
  style,
  characterStyle,
}: CharacterProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay + index * stagger,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delay, duration, index, progress, stagger]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * fromY }],
  }), Platform.OS === 'web' ? [fromY] : undefined);

  return (
    <Animated.Text style={[style, characterStyle, animatedStyle]}>
      {character === ' ' ? '\u00A0' : character}
    </Animated.Text>
  );
});

AnimatedCharacter.displayName = 'AnimatedCharacter';

/**
 * Reveals text character-by-character with a staggered fade and vertical rise.
 *
 * The initial MVP splits text by Unicode code point. Complex emoji made from
 * multiple code points may animate as multiple pieces.
 */
export const SplitText = ({
  text,
  duration = 450,
  stagger = 35,
  delay = 0,
  fromY = 16,
  style,
  characterStyle,
  containerStyle,
}: SplitTextProps) => {
  const characters = Array.from(text);

  return (
    <View
      accessible
      accessibilityLabel={text}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }, containerStyle]}
    >
      {characters.map((character, index) => (
        <AnimatedCharacter
          key={`${index}-${character}`}
          character={character}
          index={index}
          duration={duration}
          stagger={stagger}
          delay={delay}
          fromY={fromY}
          style={style}
          characterStyle={characterStyle}
        />
      ))}
    </View>
  );
};
