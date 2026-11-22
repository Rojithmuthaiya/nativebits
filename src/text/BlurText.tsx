
import React, { useEffect, useMemo } from 'react';
import {
    View,
    type TextStyle,
    type ViewStyle,
} from 'react-native';

import {
    BlurMask,
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
    withTiming,
} from 'react-native-reanimated';

export interface BlurTextProps {
    text: string;
    duration?: number;
    stagger?: number;
    delay?: number;
    fromY?: number;
    blur?: number;
    style?: TextStyle;
    containerStyle?: ViewStyle;
    blurColor?: string;
    blurGradient?: string[];
}

interface AnimatedCharacterProps {
    character: string;
    x: number;
    y: number;
    font: ReturnType<typeof matchFont>;
    color: string;
    duration: number;
    delay: number;
    fromY: number;
    blur: number;
    blurColor: string;
    blurGradient?: string[];
    gradientWidth: number;
}

interface AnimatedCharacterProps {
    character: string;
    x: number;
    y: number;
    font: ReturnType<typeof matchFont>;
    color: string;
    blurColor: string;
    blurGradient?: string[];
    gradientWidth: number;
    duration: number;
    delay: number;
    fromY: number;
    blur: number;
}

const AnimatedCharacter = ({
    character,
    x,
    y,
    font,
    color,
    blurColor,
    blurGradient,
    gradientWidth,
    duration,
    delay,
    fromY,
    blur,
}: AnimatedCharacterProps) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            delay,
            withTiming(1, {
                duration,
                easing: Easing.out(Easing.cubic),
            }),
        );

        return () => cancelAnimation(progress);
    }, [delay, duration, progress]);

    const animatedBlur = useDerivedValue(() =>
        Math.max(0.001, blur * (1 - progress.value)),
    );

    const animatedY = useDerivedValue(
        () => y + fromY * (1 - progress.value),
    );

    const blurOpacity = useDerivedValue(
        () => 1 - progress.value,
    );

    return (
        <>
            {/* Colored blurred layer */}
            <Group opacity={blurOpacity}>
                <SkiaText
                    x={x}
                    y={animatedY}
                    text={character}
                    font={font}
                    color={blurColor}
                >
                    <BlurMask blur={animatedBlur} style="normal" />

                    {blurGradient && blurGradient.length >= 2 && (
                        <LinearGradient
                            start={vec(0, 0)}
                            end={vec(gradientWidth, 0)}
                            colors={blurGradient}
                        />
                    )}
                </SkiaText>
            </Group>

            {/* Sharp text layer */}
            <Group opacity={progress}>
                <SkiaText
                    x={x}
                    y={animatedY}
                    text={character}
                    font={font}
                    color={color}
                />
            </Group>
        </>
    );
};

export const BlurText = ({
    text,
    duration = 600,
    stagger = 50,
    delay = 0,
    fromY = 20,
    blur = 10,
    style,
    containerStyle,
    blurColor,
    blurGradient,
}: BlurTextProps) => {
    const fontSize = Number(style?.fontSize ?? 28);
    const fontFamily = style?.fontFamily ?? 'Arial';
    const fontWeight =
        style?.fontWeight === 'bold' ? 'bold' : 'normal';
    const fontStyle =
        style?.fontStyle === 'italic' ? 'italic' : 'normal';
    const color = String(style?.color ?? '#111827');
    const effectiveBlurColor = blurColor ?? color;
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

    const characters = Array.from(text);

    const { positions, textWidth } = useMemo(() => {
        const glyphIds = font.getGlyphIDs(text, characters.length);
        const glyphWidths = font.getGlyphWidths(glyphIds);

        let currentX = 0;

        const positions = characters.map((character, index) => {
            const position = {
                character,
                x: currentX,
            };

            currentX += glyphWidths[index] ?? 0;

            return position;
        });

        return {
            positions,
            textWidth: currentX,
        };
    }, [text, font]);

    const metrics = font.getMetrics();
    const canvasHeight =
        metrics.descent - metrics.ascent + 2 * blur + Math.abs(fromY);
    const baseline = -metrics.ascent + blur;

    const canvasWidth = Math.max(1, textWidth);

    return (
        <View style={containerStyle}>
            <Canvas
                style={{
                    width: canvasWidth + blur * 2,
                    height: canvasHeight,
                }}
            >
                {positions.map(({ character, x }, index) => (
                    character === ' ' ? null : (
                        <AnimatedCharacter
                            key={`${index}-${character}`}
                            character={character}
                            x={x + blur}
                            y={baseline}
                            font={font}
                            color={color}
                            blurColor={effectiveBlurColor}
                            blurGradient={blurGradient}
                            gradientWidth={textWidth}
                            duration={duration}
                            delay={delay + index * stagger}
                            fromY={fromY}
                            blur={blur}
                        />
                    )
                ))}
            </Canvas>
        </View>
    );
};
