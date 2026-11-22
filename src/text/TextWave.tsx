
import React, { useEffect, useMemo } from 'react';
import {
    View,
    type TextStyle,
    type ViewStyle,
} from 'react-native';
import {
    Canvas,
    Text as SkiaText,
    matchFont,
} from '@shopify/react-native-skia';
import Animated, {
    cancelAnimation,
    Easing,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';

export interface TextWaveProps {
    text: string;
    amplitude?: number;
    wavelength?: number;
    duration?: number;
    delay?: number;
    direction?: 'left' | 'right';
    loop?: boolean;
    style?: TextStyle;
    containerStyle?: ViewStyle;
}

interface WaveCharacterProps {
    character: string;
    x: number;
    index: number;
    baseline: number;
    amplitude: number;
    wavelength: number;
    direction: 'left' | 'right';
    progress: SharedValue<number>;
    font: ReturnType<typeof matchFont>;
    color: string;
}

const WaveCharacter = ({
    character,
    x,
    index,
    baseline,
    amplitude,
    wavelength,
    direction,
    progress,
    font,
    color,
}: WaveCharacterProps) => {
    const animatedY = useDerivedValue(() => {
        const directionMultiplier = direction === 'right' ? 1 : -1;
        const phase = progress.value * directionMultiplier * Math.PI * 2;
        const characterPhase = (index / wavelength) * Math.PI * 2;

        return (
            baseline +
            Math.sin(phase + characterPhase) * amplitude
        );
    });

    return (
        <SkiaText
            text={character}
            x={x}
            y={animatedY}
            font={font}
            color={color}
        />
    );
};

export const TextWave = ({
    text,
    amplitude = 8,
    wavelength = 6,
    duration = 1800,
    delay = 0,
    direction = 'right',
    loop = true,
    style,
    containerStyle,
}: TextWaveProps) => {
    const progress = useSharedValue(0);

    const fontSize = Number(style?.fontSize ?? 32);
    const color = String(style?.color ?? '#FFFFFF');

    const font = useMemo(
        () =>
            matchFont({
                fontFamily: style?.fontFamily ?? 'Arial',
                fontSize,
                fontWeight: style?.fontWeight as
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
                    | '900'
                    | undefined ?? 'normal',
                fontStyle: style?.fontStyle ?? 'normal',
            }),
        [
            style?.fontFamily,
            style?.fontWeight,
            style?.fontStyle,
            fontSize,
        ],
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

    useEffect(() => {
        progress.value = 0;

        const waveAnimation = withTiming(1, {
            duration,
            easing: Easing.linear,
        });

        const returnAnimation = withTiming(0, {
            duration,
            easing: Easing.inOut(Easing.cubic),
        });

        progress.value = withDelay(
            delay,
            loop
                ? withRepeat(waveAnimation, -1, false)
                : withSequence(waveAnimation, returnAnimation),
        );

        return () => {
            cancelAnimation(progress);
        };
    }, [duration, delay, loop, progress]);

    const metrics = font.getMetrics();

    const padding = Math.ceil(fontSize * 0.2);
    const verticalPadding = padding + amplitude;

    const canvasWidth = textWidth + padding * 2;
    const canvasHeight =
        metrics.descent -
        metrics.ascent +
        verticalPadding * 2;

    const baseline = -metrics.ascent + verticalPadding;

    return (
        <View style={containerStyle}>
            <Canvas
                style={{
                    width: canvasWidth,
                    height: canvasHeight,
                }}
            >
                {positions.map((item, index) => {
                    if (item.character === ' ') {
                        return null;
                    }

                    return (
                        <WaveCharacter
                            key={`${index}-${item.character}`}
                            character={item.character}
                            x={item.x + padding}
                            index={index}
                            baseline={baseline}
                            amplitude={amplitude}
                            wavelength={Math.max(1, wavelength)}
                            direction={direction}
                            progress={progress}
                            font={font}
                            color={color}
                        />
                    );
                })}
            </Canvas>
        </View>
    );
};
