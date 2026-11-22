
import React, { useEffect, useMemo } from 'react';
import {
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  Canvas,
  LinearGradient,
  matchFont,
  Text as SkiaText,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface ThreeDTextProps {
  text: string;
  color?: string;
  depthColor?: string;
  depth?: number;
  depthOffset?: number;
  bevelSize?: number;
  bevelColor?: string;
  shadowColor?: string;
  gradientColors?: string[];
  rotationX?: number;
  rotationY?: number;
  perspective?: number;
  duration?: number;
  animated?: boolean;
  loop?: boolean;
  shine?: boolean;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

export const ThreeDText = ({
  text,
  color,
  depthColor = '#542080',
  depth = 16,
  depthOffset = 0.7,
  bevelSize = 1,
  bevelColor = '#F5D0FE',
  shadowColor = '#160824',
  gradientColors = ['#F5D0FE', '#C084FC', '#7E22CE'],
  rotationX = 8,
  rotationY = 12,
  perspective = 800,
  duration = 3000,
  animated = true,
  loop = true,
  shine = true,
  style,
  containerStyle,
}: ThreeDTextProps) => {
  const progress = useSharedValue(0);

  const fontSize = Number(style?.fontSize ?? 36);
  const frontColor = color ?? String(style?.color ?? '#A855F7');

  const fontWeight = (style?.fontWeight ?? 'normal') as
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';

  const font = useMemo(
    () =>
      matchFont({
        fontFamily: style?.fontFamily ?? 'Arial',
        fontSize,
        fontWeight,
        fontStyle: style?.fontStyle ?? 'normal',
      }),
    [
      style?.fontFamily,
      style?.fontStyle,
      fontSize,
      fontWeight,
    ],
  );

  const metrics = font.getMetrics();
  const textWidth = font.measureText(text).width;

  const safeDepth = Math.max(0, Math.min(24, Math.floor(depth)));
  const safeOffset = Math.max(0, depthOffset);
  const safeBevel = Math.max(0, bevelSize);

  const layers = useMemo(
    () =>
      Array.from(
        { length: safeDepth },
        (_, index) => safeDepth - index,
      ),
    [safeDepth],
  );

  const totalDepth = safeDepth * safeOffset;
  const padding = Math.ceil(fontSize * 0.3 + safeBevel * 2);

  const canvasWidth = Math.ceil(
    textWidth + padding * 2 + totalDepth + safeBevel,
  );

  const canvasHeight = Math.ceil(
    metrics.descent -
      metrics.ascent +
      padding * 2 +
      totalDepth +
      safeBevel,
  );

  const baseline = -metrics.ascent + padding;

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;

    if (animated || shine) {
      progress.value = withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.linear,
        }),
        loop ? -1 : 1,
        false,
      );
    }

    return () => {
      cancelAnimation(progress);
    };
  }, [animated, shine, duration, loop, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotationXValue = animated
      ? Math.sin(progress.value * Math.PI * 2) * rotationX
      : rotationX;

    const rotationYValue = animated
      ? Math.cos(progress.value * Math.PI * 2) * rotationY
      : rotationY;

    return {
      transform: [
        { perspective },
        { rotateX: `${rotationXValue}deg` },
        { rotateY: `${rotationYValue}deg` },
      ],
    };
  });

  const shineTransform = useDerivedValue(() => [
    {
      translateX: -textWidth + progress.value * textWidth * 2,
    },
  ]);

  return (
    <View style={containerStyle}>
      <Animated.View
        style={[
          {
            width: canvasWidth,
            height: canvasHeight,
          },
          animatedStyle,
        ]}
      >
        <Canvas
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* Drop shadow */}
          <SkiaText
            text={text}
            x={padding + totalDepth * 0.8}
            y={baseline + totalDepth * 0.8}
            font={font}
            color={shadowColor}
          />

          {/* Extruded side layers */}
          {layers.map((layer) => (
            <SkiaText
              key={layer}
              text={text}
              x={padding + layer * safeOffset}
              y={baseline + layer * safeOffset}
              font={font}
              color={depthColor}
            />
          ))}

          {/* Upper-left bevel highlight */}
          {safeBevel > 0 && (
            <SkiaText
              text={text}
              x={padding - safeBevel * 0.5}
              y={baseline - safeBevel * 0.5}
              font={font}
              color={bevelColor}
            />
          )}

          {/* Main front face */}
          <SkiaText
            text={text}
            x={padding}
            y={baseline}
            font={font}
            color={frontColor}
          >
            {gradientColors.length >= 2 && (
              <LinearGradient
                start={vec(padding, 0)}
                end={vec(padding + textWidth, 0)}
                colors={gradientColors}
              />
            )}
          </SkiaText>

          {/* Moving specular shine */}
          {shine && (
            <SkiaText
              text={text}
              x={padding}
              y={baseline}
              font={font}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(textWidth, 0)}
                colors={[
                  'rgba(255,255,255,0)',
                  'rgba(255,255,255,0.75)',
                  'rgba(255,255,255,0)',
                ]}
                positions={[0, 0.5, 1]}
                transform={shineTransform}
              />
            </SkiaText>
          )}
        </Canvas>
      </Animated.View>
    </View>
  );
};
