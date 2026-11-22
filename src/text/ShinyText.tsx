
import React, { useEffect, useMemo } from 'react';
import {
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  Canvas,
  Group,
  LinearGradient,
  matchFont,
  Text as SkiaText,
  vec,
} from '@shopify/react-native-skia';

import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface ShinyTextProps {
  text: string;
  color?: string;
  shineColor?: string;
  duration?: number;
  delay?: number;
  loop?: boolean;
  shineWidth?: number;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

export const ShinyText = ({
  text,
  color = '#808080',
  shineColor = '#FFFFFF',
  duration = 2000,
  delay = 0,
  loop = true,
  shineWidth = 0.2,
  style,
  containerStyle,
}: ShinyTextProps) => {
  const fontSize = Number(style?.fontSize ?? 32);
  const fontFamily = style?.fontFamily ?? 'Arial';

  const fontWeight =
    style?.fontWeight === 'bold' ? 'bold' : 'normal';

  const fontStyle =
    style?.fontStyle === 'italic' ? 'italic' : 'normal';

  const font = useMemo(
    () =>
      matchFont({
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
      }),
    [fontFamily, fontSize, fontWeight, fontStyle],
  );

  const textWidth = Math.max(1, font.measureText(text).width);
  const metrics = font.getMetrics();

  const padding = Math.ceil(fontSize * 0.2);

  const canvasHeight =
    metrics.descent - metrics.ascent + padding * 2;

  const baseline = -metrics.ascent + padding;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.linear,
        }),
        loop ? -1 : 1,
        false,
      ),
    );

    return () => cancelAnimation(progress);
  }, [delay, duration, loop, progress]);

  const gradientTransform = useDerivedValue(() => {
    return [
      {
        translateX:
          -textWidth + progress.value * textWidth * 2,
      },
    ];
  });

  const shineStart = Math.max(
    0,
    0.5 - shineWidth / 2,
  );

  const shineEnd = Math.min(
    1,
    0.5 + shineWidth / 2,
  );

  return (
    <View style={containerStyle}>
      <Canvas
        style={{
          width: textWidth + padding * 2,
          height: canvasHeight,
        }}
      >
        {/* Original text */}
        <SkiaText
          x={padding}
          y={baseline}
          text={text}
          font={font}
          color={color}
        />

        {/* Moving shine reflection */}
        <Group>
          <SkiaText
            x={padding}
            y={baseline}
            text={text}
            font={font}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(textWidth, 0)}
              colors={[
                'rgba(255,255,255,0)',
                shineColor,
                'rgba(255,255,255,0)',
              ]}
              positions={[
                shineStart,
                0.5,
                shineEnd,
              ]}
              transform={gradientTransform}
            />
          </SkiaText>
        </Group>
      </Canvas>
    </View>
  );
};
