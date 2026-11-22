
import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

export interface ScrambleTextProps {
  text: string;
  characters?: string;
  speed?: number;
  delay?: number;
  pauseDuration?: number;
  loop?: boolean;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

const DEFAULT_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

function getRandomCharacter(characters: string) {
  const availableCharacters = Array.from(characters);

  if (availableCharacters.length === 0) {
    return '';
  }

  const randomIndex = Math.floor(
    Math.random() * availableCharacters.length
  );

  return availableCharacters[randomIndex];
}

function scrambleText(text: string, characters: string) {
  return Array.from(text)
    .map((character) => {
      if (character === ' ') {
        return ' ';
      }

      return getRandomCharacter(characters);
    })
    .join('');
}

export function ScrambleText({
  text,
  characters = DEFAULT_CHARACTERS,
  speed = 50,
  delay = 0,
  pauseDuration = 1500,
  loop = false,
  style,
  containerStyle,
}: ScrambleTextProps) {
  const [displayedText, setDisplayedText] = useState(() =>
    scrambleText(text, characters)
  );

  useEffect(() => {
    const targetCharacters = Array.from(text);

    let currentIndex = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const randomizeRemaining = (revealedCount: number) => {
      return targetCharacters
        .map((character, index) => {
          if (character === ' ') {
            return ' ';
          }

          if (index < revealedCount) {
            return character;
          }

          return getRandomCharacter(characters);
        })
        .join('');
    };

    const revealNext = () => {
      if (currentIndex >= targetCharacters.length) {
        if (loop) {
          timeout = setTimeout(() => {
            currentIndex = 0;
            setDisplayedText(
              scrambleText(text, characters)
            );
            revealNext();
          }, Math.max(0, pauseDuration));
        }

        return;
      }

      currentIndex += 1;

      setDisplayedText(
        randomizeRemaining(currentIndex)
      );

      timeout = setTimeout(
        revealNext,
        Math.max(1, speed)
      );
    };

    setDisplayedText(scrambleText(text, characters));

    timeout = setTimeout(
      revealNext,
      Math.max(0, delay)
    );

    return () => clearTimeout(timeout);
  }, [
    text,
    characters,
    speed,
    delay,
    pauseDuration,
    loop,
  ]);

  return (
    <View style={containerStyle}>
      <Text style={style}>
        {displayedText}
      </Text>
    </View>
  );
}
