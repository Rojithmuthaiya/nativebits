
import React, { useEffect } from 'react';
import {
    View,
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

export interface RevealTextProps {
    text: string;
    direction?: 'left' | 'right' | 'top' | 'bottom';
    duration?: number;
    delay?: number;
    stagger?: number;
    mode?: 'word' | 'character';
    fade?: boolean;
    slide?: boolean;
    slideDistance?: number;
    loop?: boolean;
    style?: TextStyle;
    characterStyle?: TextStyle;
    containerStyle?: ViewStyle;
}

interface RevealCharacterProps {
    character: string;
    index: number;
    duration: number;
    delay: number;
    direction: RevealTextProps['direction'];
    fade: boolean;
    slide: boolean;
    slideDistance: number;
    style?: TextStyle;
}

const RevealCharacter = ({
    character,
    index,
    duration,
    delay,
    direction,
    fade,
    slide,
    slideDistance,
    style,
}: RevealCharacterProps) => {
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

    const animatedStyle = useAnimatedStyle(() => {
        const offset = slide
            ? slideDistance * (1 - progress.value)
            : 0;

        const translateX =
            direction === 'left'
                ? -offset
                : direction === 'right'
                    ? offset
                    : 0;

        const translateY =
            direction === 'top'
                ? -offset
                : direction === 'bottom'
                    ? offset
                    : 0;

        return {
            opacity: fade ? progress.value : 1,
            transform: [
                { translateX },
                { translateY },
            ],
        };
    });

    return (
        <View
            style={{
                overflow: 'hidden',
            }}
        >
            <Animated.Text
                style={[
                    style,
                    animatedStyle,
                ]}
            >
                {character === ' ' ? '\u00A0' : character}
            </Animated.Text>
        </View>
    );
};

export const RevealText = ({
    text,
    direction = 'left',
    duration = 700,
    delay = 0,
    stagger = 45,
    mode = 'character',
    fade = true,
    slide = false,
    slideDistance = 20,
    loop = false,
    style,
    characterStyle,
    containerStyle,
}: RevealTextProps) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        cancelAnimation(progress);
        progress.value = 0;

        const animation = withTiming(1, {
            duration,
            easing: Easing.out(Easing.cubic),
        });

        progress.value = withDelay(
            delay,
            loop
                ? withRepeat(
                    withSequence(
                        animation,
                        withTiming(0, { duration: 400 }),
                    ),
                    -1,
                    false,
                )
                : animation,
        );

        return () => cancelAnimation(progress);
    }, [duration, delay, loop, progress]);

    const wholeTextStyle = useAnimatedStyle(() => {
        const offset = slide
            ? slideDistance * (1 - progress.value)
            : 0;

        return {
            opacity: fade ? progress.value : 1,
            transform: [
                {
                    translateX:
                        direction === 'left'
                            ? -offset
                            : direction === 'right'
                                ? offset
                                : 0,
                },
                {
                    translateY:
                        direction === 'top'
                            ? -offset
                            : direction === 'bottom'
                                ? offset
                                : 0,
                },
            ],
        };
    });

    const characters = Array.from(text);

    if (mode === 'word') {
        return (
            <View
                style={[
                    {
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                    },
                    containerStyle,
                ]}
            >
                {text.split(/(\s+)/).map((word, index) => {
                    if (/^\s+$/.test(word)) {
                        return (
                            <Animated.Text key={`space-${index}`} style={style}>
                                {word}
                            </Animated.Text>
                        );
                    }

                    return (
                        <View
                            key={`word-${index}`}
                            style={{ overflow: 'hidden' }}
                        >
                            <Animated.Text style={[style, wholeTextStyle]}>
                                {word}
                            </Animated.Text>
                        </View>
                    );
                })}
            </View>
        );
    }

    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                },
                containerStyle,
            ]}
        >
            {characters.map((character, index) => (
                <RevealCharacter
                    key={`${index}-${character}`}
                    character={character}
                    index={index}
                    duration={duration}
                    delay={delay + index * stagger}
                    direction={direction}
                    fade={fade}
                    slide={slide}
                    slideDistance={slideDistance}
                    style={{
                        ...style,
                        ...characterStyle,
                    }}
                />
            ))}
        </View>
    );
};
