
import React, { useEffect, useRef, useState } from 'react';
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
  withTiming,
} from 'react-native-reanimated';

export interface MorphTextProps {
  words: string[];
  duration?: number;
  delay?: number;
  stagger?: number;
  pauseDuration?: number;
  loop?: boolean;
  enterFromY?: number;
  exitToY?: number;
  style?: TextStyle;
  characterStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

interface MorphCharacterProps {
  character: string;
  index: number;
  direction: 'enter' | 'exit';
  duration: number;
  stagger: number;
  enterFromY: number;
  exitToY: number;
  style?: TextStyle;
  characterStyle?: TextStyle;
}

function MorphCharacter({
  character,
  index,
  direction,
  duration,
  stagger,
  enterFromY,
  exitToY,
  style,
  characterStyle,
}: MorphCharacterProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * stagger,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      }),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [index, stagger, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (direction === 'enter') {
      return {
        opacity: progress.value,
        transform: [
          {
            translateY: (1 - progress.value) * enterFromY,
          },
          {
            scale: 0.85 + progress.value * 0.15,
          },
        ],
      };
    }

    return {
      opacity: 1 - progress.value,
      transform: [
        {
          translateY: progress.value * exitToY,
        },
        {
          scale: 1 - progress.value * 0.15,
        },
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
}

interface MorphWordProps {
  word: string;
  direction: 'enter' | 'exit';
  duration: number;
  stagger: number;
  enterFromY: number;
  exitToY: number;
  style?: TextStyle;
  characterStyle?: TextStyle;
}

function MorphWord({
  word,
  direction,
  duration,
  stagger,
  enterFromY,
  exitToY,
  style,
  characterStyle,
}: MorphWordProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {word.split('').map((character, index) => (
        <MorphCharacter
          key={`${index}-${character}`}
          character={character}
          index={index}
          direction={direction}
          duration={duration}
          stagger={stagger}
          enterFromY={enterFromY}
          exitToY={exitToY}
          style={style}
          characterStyle={characterStyle}
        />
      ))}
    </View>
  );
}

export function MorphText({
  words,
  duration = 500,
  delay = 0,
  stagger = 35,
  pauseDuration = 1200,
  loop = true,
  enterFromY = 16,
  exitToY = -16,
  style,
  characterStyle,
  containerStyle,
}: MorphTextProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [previousWord, setPreviousWord] = useState<string | null>(null);

  const indexRef = useRef(0);

  const maxLength = Math.max(
    1,
    ...words.map(word => word.length),
  );

  const transitionDuration =
    duration + stagger * (maxLength - 1);

  useEffect(() => {
    indexRef.current = 0;
    setWordIndex(0);
    setPreviousWord(null);
  }, [words]);

  useEffect(() => {
    if (!previousWord) {
      return;
    }

    const timeout = setTimeout(() => {
      setPreviousWord(null);
    }, duration + stagger * Math.max(0, previousWord.length - 1));

    return () => clearTimeout(timeout);
  }, [previousWord, duration, stagger]);

  useEffect(() => {
    if (words.length < 2) {
      return;
    }

    let interval: ReturnType<typeof setInterval> | undefined;

    const advance = () => {
      const currentIndex = indexRef.current;
      let nextIndex = currentIndex + 1;

      if (nextIndex >= words.length) {
        if (!loop) {
          if (interval) {
            clearInterval(interval);
          }
          return;
        }

        nextIndex = 0;
      }

      setPreviousWord(words[currentIndex]);
      indexRef.current = nextIndex;
      setWordIndex(nextIndex);
    };

    const timeout = setTimeout(() => {
      advance();

      interval = setInterval(
        advance,
        transitionDuration + pauseDuration,
      );
    }, delay + pauseDuration);

    return () => {
      clearTimeout(timeout);

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    words,
    loop,
    delay,
    pauseDuration,
    transitionDuration,
  ]);

  if (words.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        {
          position: 'relative',
          alignSelf: 'flex-start',
          overflow: 'visible',
        },
        containerStyle,
      ]}
    >
      <MorphWord
        word={words[wordIndex] ?? ''}
        direction="enter"
        duration={duration}
        stagger={stagger}
        enterFromY={enterFromY}
        exitToY={exitToY}
        style={style}
        characterStyle={characterStyle}
      />

      {previousWord !== null && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 1,
          }}
        >
          <MorphWord
            word={previousWord}
            direction="exit"
            duration={duration}
            stagger={stagger}
            enterFromY={enterFromY}
            exitToY={exitToY}
            style={style}
            characterStyle={characterStyle}
          />
        </View>
      )}
    </View>
  );
}

export default MorphText;
