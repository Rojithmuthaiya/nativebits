
import React, { useEffect, useMemo } from 'react';
import {
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  BlurMask,
  Canvas,
  matchFont,
  Text as SkiaText,
} from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface NeonTextProps {
  text: string;
  neonColor?: string;
  coreColor?: string;
  glowRadius?: number;
  glowIntensity?: number;
  pulse?: boolean;
  duration?: number;
  loop?: boolean;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

export const NeonText = ({
  text,
  neonColor = '#A855F7',
  coreColor = '#FFFFFF',
  glowRadius = 22,
  glowIntensity = 1,
  pulse = true,
  duration = 1500,
  loop = true,
  style,
  containerStyle,
}: NeonTextProps) => {
  const pulseValue = useSharedValue(1);

  const fontSize = Number(style?.fontSize ?? 36);

  const fontWeight = (style?.fontWeight ?? 'bold') as
    | 'normal' | 'bold' | '100' | '200' | '300'
    | '400' | '500' | '600' | '700' | '800' | '900';

  const font = useMemo(
    () =>
      matchFont({
        fontFamily: style?.fontFamily ?? 'Arial',
        fontSize,
        fontWeight,
        fontStyle: style?.fontStyle ?? 'normal',
      }),
    [style?.fontFamily, style?.fontStyle, fontSize, fontWeight],
  );

  const metrics = font.getMetrics();
  const textWidth = font.measureText(text).width;

  const safeGlowRadius = Math.max(0, glowRadius);
  const safeIntensity = Math.max(0, Math.min(1, glowIntensity));

  const padding = Math.ceil(safeGlowRadius * 3 + fontSize * 0.2);

  const canvasWidth = Math.ceil(textWidth + padding * 2);
  const canvasHeight = Math.ceil(
    metrics.descent - metrics.ascent + padding * 2,
  );

  const baseline = -metrics.ascent + padding;

  useEffect(() => {
    cancelAnimation(pulseValue);
    pulseValue.value = 1;

    if (pulse) {
      pulseValue.value = withRepeat(
        withTiming(0.45, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        loop ? -1 : 1,
        true,
      );
    }

    return () => cancelAnimation(pulseValue);
  }, [pulse, duration, loop, pulseValue]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value * safeIntensity,
  }));

  return (
    <View style={containerStyle}>
      <View
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {/* Animated three-layer neon glow */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: canvasWidth,
              height: canvasHeight,
            },
            glowStyle,
          ]}
        >
          <Canvas
            style={{
              width: canvasWidth,
              height: canvasHeight,
            }}
          >
            {/* Layer 1: Large outer purple halo */}
            <SkiaText
              text={text}
              x={padding}
              y={baseline}
              font={font}
              color={neonColor}
              opacity={0.9}
            >
              <BlurMask
                blur={safeGlowRadius * 2.2}
                style="normal"
              />
            </SkiaText>

            {/* Layer 2: Strong violet glow */}
            <SkiaText
              text={text}
              x={padding}
              y={baseline}
              font={font}
              color={neonColor}
              opacity={0.95}
            >
              <BlurMask
                blur={safeGlowRadius}
                style="normal"
              />
            </SkiaText>

            {/* Layer 3: Concentrated inner glow */}
            <SkiaText
              text={text}
              x={padding}
              y={baseline}
              font={font}
              color="#F0ABFC"
              opacity={1}
            >
              <BlurMask
                blur={safeGlowRadius * 0.25}
                style="normal"
              />
            </SkiaText>
          </Canvas>
        </Animated.View>

        {/* Neon tube */}
        <Canvas
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* Colored tube */}
          <SkiaText
            text={text}
            x={padding}
            y={baseline}
            font={font}
            color={neonColor}
          />

          {/* Bright white tube center */}
          <SkiaText
            text={text}
            x={padding}
            y={baseline}
            font={font}
            color={coreColor}
          />
        </Canvas>
      </View>
    </View>
  );
};
