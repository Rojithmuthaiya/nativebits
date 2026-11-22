
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

import {
    cancelAnimation,
    Easing,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

export interface GradientTextProps {
    text: string;
    colors?: string[];
    duration?: number;
    loop?: boolean;
    style?: TextStyle;
    containerStyle?: ViewStyle;
}

export const GradientText = ({
    text,
    colors = ['#8B5CF6', '#EC4899', '#F97316'],
    duration = 2500,
    loop = true,
    style,
    containerStyle,
}: GradientTextProps) => {
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
        progress.value = withRepeat(
            withTiming(1, {
                duration,
                easing: Easing.linear,
            }),
            loop ? -1 : 1,
            false,
        );

        return () => cancelAnimation(progress);
    }, [duration, loop, progress]);

    const gradientTransform = useDerivedValue(() => {
        return [
            {
                translateX: -progress.value * textWidth,
            },
        ];
    });

    return (
        <View style={containerStyle}>
            <Canvas
                style={{
                    width: textWidth + padding * 2,
                    height: canvasHeight,
                }}
            >
                <SkiaText
                    x={padding}
                    y={baseline}
                    text={text}
                    font={font}
                >
                    <LinearGradient
                        start={vec(-textWidth, 0)}
                        end={vec(textWidth * 2, 0)}
                        colors={colors}
                        transform={gradientTransform}
                    />
                </SkiaText>
            </Canvas>
        </View>
    );
};
