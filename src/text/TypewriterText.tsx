
import React, { useEffect, useState } from 'react';
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
  withTiming,
} from 'react-native-reanimated';

export interface TypewriterTextProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;

  // Cursor customization
  cursorWidth?: number;
  cursorHeight?: number;
  cursorColor?: string;
  cursorBorderRadius?: number;
  cursorMarginLeft?: number;

  // Cursor animation
  cursorAnimation?: 'blink' | 'pulse' | 'none';
  cursorAnimationDuration?: number;

  style?: TextStyle;
  cursorStyle?: ViewStyle;
  containerStyle?: ViewStyle;
}

export function TypewriterText({
  texts,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 1500,
  loop = false,

  cursorWidth = 2,
  cursorHeight = 26,
  cursorColor = '#FFFFFF',
  cursorBorderRadius = 2,
  cursorMarginLeft = 3,

  cursorAnimation = 'blink',
  cursorAnimationDuration = 500,

  style,
  cursorStyle,
  containerStyle,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typing and deleting logic
  useEffect(() => {
    if (texts.length === 0) {
      setDisplayedText('');
      return;
    }

    const currentText = texts[currentIndex] ?? '';

    if (!isDeleting && displayedText === currentText) {
      if (!loop && currentIndex === texts.length - 1) {
        return;
      }

      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);

      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setCurrentIndex((previous) => (previous + 1) % texts.length);
      return;
    }

    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayedText((previous) => previous.slice(0, -1));
      } else {
        setDisplayedText(
          currentText.slice(0, displayedText.length + 1)
        );
      }
    }, Math.max(0, isDeleting ? deletingSpeed : typingSpeed));

    return () => clearTimeout(timeout);
  }, [
    texts,
    currentIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    loop,
  ]);

  // Cursor animation values
  const cursorOpacity = useSharedValue(1);
  const cursorScale = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(cursorOpacity);
    cancelAnimation(cursorScale);

    cursorOpacity.value = 1;
    cursorScale.value = 1;

    if (cursorAnimation === 'blink') {
      cursorOpacity.value = withRepeat(
        withTiming(0, {
          duration: Math.max(1, cursorAnimationDuration / 2),
          easing: Easing.linear,
        }),
        -1,
        true
      );
    }

    if (cursorAnimation === 'pulse') {
      cursorOpacity.value = withRepeat(
        withTiming(0.4, {
          duration: Math.max(1, cursorAnimationDuration),
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );

      cursorScale.value = withRepeat(
        withTiming(0.75, {
          duration: Math.max(1, cursorAnimationDuration),
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }

    return () => {
      cancelAnimation(cursorOpacity);
      cancelAnimation(cursorScale);
    };
  }, [cursorAnimation, cursorAnimationDuration]);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
    transform: [{ scaleY: cursorScale.value }],
  }));

  return (
  <View style={containerStyle}>
    <Text style={style}>
      {displayedText}
      <Animated.View
        style={[
          {
            width: cursorWidth,
            height: cursorHeight,
            backgroundColor: cursorColor,
            borderRadius: cursorBorderRadius,
            marginLeft: cursorMarginLeft,
            transform: [{ translateY: 2 }],
          },
          cursorStyle,
          animatedCursorStyle,
        ]}
      />
    </Text>
  </View>
  );
}
