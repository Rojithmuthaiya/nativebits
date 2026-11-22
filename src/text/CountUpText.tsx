import React, { useEffect, useState } from 'react';
import {
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import Animated, {
  cancelAnimation,
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';


export type CountUpEasing =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut';

export interface CountUpTextProps {
  from?: number;
  to: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  easing?: CountUpEasing;
  loop?: boolean;
  loopDelay?: number;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}



export function CountUpText({
  from = 0,
  to,
  duration = 1500,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  easing = 'easeOut',
  loop = false,
  loopDelay = 1000,
  style,
  containerStyle,
}: CountUpTextProps) {
  const progress = useSharedValue(from);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = from;

    const easingFunction = {
      linear: Easing.linear,
      easeIn: Easing.in(Easing.quad),
      easeOut: Easing.out(Easing.quad),
      easeInOut: Easing.inOut(Easing.quad),
    }[easing];

    const countAnimation = withTiming(to, {
      duration,
      easing: easingFunction,
    });

    if (loop) {
      progress.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            countAnimation,
            withDelay(
              loopDelay,
              withTiming(from, { duration: 1 }),
            ),
          ),
          -1,
          false,
        ),
      );
    } else {
      progress.value = withDelay(delay, countAnimation);
    }

    return () => {
      cancelAnimation(progress);
    };
  }, [
    from,
    to,
    duration,
    delay,
    easing,
    loop,
    loopDelay,
    progress,
  ]);

const [displayValue, setDisplayValue] = useState(
  `${prefix}${from.toFixed(decimals)}${suffix}`,
);

useAnimatedReaction(
  () => {
    const factor = Math.pow(10, decimals);
    const roundedValue =
      Math.round(progress.value * factor) / factor;

    return `${prefix}${roundedValue.toFixed(decimals)}${suffix}`;
  },
  (current, previous) => {
    if (current !== previous) {
      runOnJS(setDisplayValue)(current);
    }
  },
  [decimals, prefix, suffix],
);

  return (
    <View
      style={[
        {
          alignItems: 'flex-start',
          justifyContent: 'center',
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
  ]}
>
  {displayValue}
</Animated.Text>
    </View>
  );
}

export default CountUpText;
