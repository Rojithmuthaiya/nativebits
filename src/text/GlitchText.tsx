
import React, { useEffect, useState } from 'react';
import {
  View,
  type LayoutChangeEvent,
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

export interface GlitchTextProps {
  text: string;
  intensity?: number;
  duration?: number;
  delay?: number;
  loop?: boolean;
  rgbSplit?: boolean;
  noise?: boolean;
  scanlines?: boolean;
  flicker?: boolean;
  slices?: number;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

interface GlitchSliceProps {
  text: string;
  top: number;
  height: number;
  width: number;
  index: number;
  intensity: number;
  duration: number;
  delay: number;
  loop: boolean;
  rgbSplit: boolean;
  flicker: boolean;
  style?: TextStyle;
}

function GlitchSlice({
  text,
  top,
  height,
  width,
  index,
  intensity,
  duration,
  delay,
  loop,
  rgbSplit,
  flicker,
  style,
}: GlitchSliceProps) {
  const glitch = useSharedValue(0);

  useEffect(() => {
    const burst = withSequence(
      withTiming(1, {
        duration: duration * 0.15,
        easing: Easing.linear,
      }),
      withTiming(-0.85, {
        duration: duration * 0.12,
        easing: Easing.linear,
      }),
      withTiming(0.65, {
        duration: duration * 0.12,
        easing: Easing.linear,
      }),
      withTiming(-0.3, {
        duration: duration * 0.1,
        easing: Easing.linear,
      }),
      withTiming(0, {
        duration: duration * 0.25,
        easing: Easing.out(Easing.quad),
      }),
    );

    const animation = loop
      ? withRepeat(
          withSequence(
            burst,
            withTiming(0, { duration: 700 }),
          ),
          -1,
          false,
        )
      : burst;

    glitch.value = withDelay(
      delay + index * 45,
      animation,
    );

    return () => cancelAnimation(glitch);
  }, [duration, delay, index, loop, glitch]);

  // Main horizontal slice
  const mainStyle = useAnimatedStyle(() => {
    const value = glitch.value;

    return {
      opacity: Math.abs(value) * intensity,
      transform: [
        {
          translateX: value * intensity * 22,
        },
      ],
    };
  });

  // Red RGB channel
  const redStyle = useAnimatedStyle(() => {
    const value = glitch.value;

    return {
      opacity: Math.abs(value) * intensity,
      transform: [
        {
          translateX: value * intensity * -32,
        },
      ],
    };
  });

  // Cyan RGB channel
  const cyanStyle = useAnimatedStyle(() => {
    const value = glitch.value;

    return {
      opacity: Math.abs(value) * intensity,
      transform: [
        {
          translateX: value * intensity * 32,
        },
      ],
    };
  });

  const displayStyle = [
    style,
    {
      position: 'absolute' as const,
      left: 0,
      top: -top,
      width,
    },
  ];

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        width,
        height,
        overflow: 'hidden',
      }}
    >
      {rgbSplit && (
        <>
          <Animated.Text
            style={[
              displayStyle,
              { color: '#FF1744' },
              redStyle,
            ]}
          >
            {text}
          </Animated.Text>

          <Animated.Text
            style={[
              displayStyle,
              { color: '#00E5FF' },
              cyanStyle,
            ]}
          >
            {text}
          </Animated.Text>
        </>
      )}

      <Animated.Text
        style={[
          displayStyle,
          mainStyle,
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

// --------------------------------------------------
// Digital noise blocks
// --------------------------------------------------

interface NoiseBarProps {
  width: number;
  top: number;
  height: number;
  index: number;
  delay: number;
  loop: boolean;
  intensity: number;
}

function NoiseBar({
  width,
  top,
  height,
  index,
  delay,
  loop,
  intensity,
}: NoiseBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const burst = withSequence(
      withTiming(1, { duration: 45 }),
      withTiming(0.2, { duration: 65 }),
      withTiming(0, { duration: 80 }),
    );

    progress.value = withDelay(
      delay + index * 90,
      loop
        ? withRepeat(
            withSequence(
              burst,
              withTiming(0, { duration: 400 }),
            ),
            -1,
            false,
          )
        : burst,
    );

    return () => cancelAnimation(progress);
  }, [delay, index, loop, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value * intensity * 0.9,
    transform: [
      {
        translateX:
          progress.value * (index % 2 === 0 ? 25 : -25),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: index % 2 === 0 ? 0 : width * 0.35,
          top,
          width: width * (index % 2 === 0 ? 0.65 : 0.5),
          height,
          backgroundColor:
            index % 2 === 0 ? '#FF1744' : '#00E5FF',
        },
        animatedStyle,
      ]}
    />
  );
}

// --------------------------------------------------
// Main GlitchText
// --------------------------------------------------

export function GlitchText({
  text,
  intensity = 0.9,
  duration = 600,
  delay = 0,
  loop = true,
  rgbSplit = true,
  noise = true,
  scanlines = false,
  flicker = true,
  slices = 6,
  style,
  containerStyle,
}: GlitchTextProps) {
  const [layout, setLayout] = useState({
    width: 0,
    height: 0,
  });

  const safeIntensity = Math.max(
    0,
    Math.min(1, intensity),
  );

  const safeSlices = Math.max(
    1,
    Math.min(12, Math.floor(slices)),
  );

  const safeDuration = Math.max(100, duration);

  const flickerValue = useSharedValue(1);
  const signalValue = useSharedValue(0);

  // Measure actual text dimensions
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setLayout(previous => {
      if (
        previous.width === width &&
        previous.height === height
      ) {
        return previous;
      }

      return { width, height };
    });
  };

  // Main flicker animation
  useEffect(() => {
    cancelAnimation(flickerValue);
    flickerValue.value = 1;

    if (!flicker) {
      return;
    }

    const burst = withSequence(
      withTiming(0.5, { duration: 45 }),
      withTiming(1, { duration: 60 }),
      withTiming(0.7, { duration: 35 }),
      withTiming(1, { duration: 80 }),
    );

    flickerValue.value = withDelay(
      delay,
      loop
        ? withRepeat(
            withSequence(
              burst,
              withTiming(1, { duration: 500 }),
            ),
            -1,
            false,
          )
        : burst,
    );

    return () => cancelAnimation(flickerValue);
  }, [delay, flicker, loop, flickerValue]);

  // Scanline visibility follows the glitch burst
  useEffect(() => {
    cancelAnimation(signalValue);
    signalValue.value = 0;

    const burst = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, {
        duration: safeDuration + 500,
        easing: Easing.out(Easing.quad),
      }),
    );

    signalValue.value = withDelay(
      delay,
      loop
        ? withRepeat(
            withSequence(
              burst,
              withTiming(0, { duration: 500 }),
            ),
            -1,
            false,
          )
        : burst,
    );

    return () => cancelAnimation(signalValue);
  }, [delay, loop, safeDuration, signalValue]);

  const baseStyle = useAnimatedStyle(() => ({
    opacity: flickerValue.value,
  }));

  const scanlineStyle = useAnimatedStyle(() => ({
    opacity: signalValue.value * 0.4,
  }));

  const sliceHeight = layout.height / safeSlices;

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          position: 'relative',
          overflow: 'visible',
        },
        containerStyle,
      ]}
    >
      {/* Original clean text */}
      <Animated.Text
        onLayout={handleLayout}
        style={[
          style,
          {
            includeFontPadding: false,
          },
          baseStyle,
        ]}
      >
        {text}
      </Animated.Text>

      {/* Horizontal signal slices */}
      {layout.width > 0 &&
        layout.height > 0 &&
        Array.from({ length: safeSlices }).map((_, index) => {
          const top = index * sliceHeight;

          return (
            <GlitchSlice
              key={`${text}-${index}`}
              text={text}
              top={top}
              height={sliceHeight + 1}
              width={layout.width}
              index={index}
              intensity={safeIntensity}
              duration={safeDuration}
              delay={delay}
              loop={loop}
              rgbSplit={rgbSplit}
              flicker={flicker}
              style={style}
            />
          );
        })}

      {/* Digital noise */}
      {noise && layout.width > 0 && layout.height > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <NoiseBar
              key={index}
              width={layout.width}
              height={Math.max(2, layout.height * 0.045)}
              top={layout.height * (0.15 + index * 0.16)}
              index={index}
              delay={delay}
              loop={loop}
              intensity={safeIntensity}
            />
          ))}
        </View>
      )}

      {/* Animated scanlines */}
      {scanlines && layout.width > 0 && layout.height > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: layout.width,
              height: layout.height,
              justifyContent: 'space-evenly',
            },
            scanlineStyle,
          ]}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <View
              key={index}
              style={{
                width: '100%',
                height: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

export default GlitchText;
