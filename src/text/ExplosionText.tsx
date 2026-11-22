import React, { memo, useEffect, useMemo } from 'react';
import {
  StyleSheet,
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
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export interface ExplosionTextProps {
  text: string;
  /** Motion duration per character in milliseconds. */
  duration?: number;
  /** Initial delay in milliseconds. */
  delay?: number;
  /** Offset between visible characters in milliseconds. */
  stagger?: number;
  /** Travel distance in layout points. */
  distance?: number;
  /** Maximum rotation in degrees. Neighboring characters rotate in opposite directions. */
  rotation?: number;
  direction?: 'explode' | 'implode';
  loop?: boolean;
  fade?: boolean;
  scale?: boolean;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

// Distribute consecutive characters around the origin without a repeating fan.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

type GraphemeSegmenter = {
  segment: (value: string) => Iterable<{ segment: string }>;
};

const Segmenter = typeof Intl === 'undefined'
  ? undefined
  : (Intl as typeof Intl & {
      Segmenter?: new (locale?: string, options?: { granularity: 'grapheme' }) => GraphemeSegmenter;
    }).Segmenter;
const segmenter = Segmenter
  ? new Segmenter(undefined, { granularity: 'grapheme' })
  : undefined;

const getTextLayout = (text: string) => {
  let characterCount = 0;
  const lines = text.split(/\r\n|[\n\r\u2028\u2029]/).map((line) => {
    const runs = line.match(/[^ \t]+|[ \t]/g) ?? [];
    return runs.map((run) => {
      if (run === ' ' || run === '\t') {
        return { space: run === ' ' ? '\u00a0' : run };
      }
      const characters = segmenter
        ? Array.from(segmenter.segment(run), ({ segment }) => segment)
        : Array.from(run);
      return {
        characters: characters.map((character) => ({ character, index: characterCount++ })),
      };
    });
  });
  return { lines, characterCount };
};

interface CharacterProps {
  character: string;
  index: number;
  timeline: SharedValue<number>;
  duration: number;
  stagger: number;
  distance: number;
  rotation: number;
  implode: boolean;
  fade: boolean;
  scale: boolean;
  style?: TextStyle;
}

const ExplosionCharacter = memo(({
  character,
  index,
  timeline,
  duration,
  stagger,
  distance,
  rotation,
  implode,
  fade,
  scale,
  style,
}: CharacterProps) => {
  const angle = index * GOLDEN_ANGLE;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  const spin = index % 2 === 0 ? rotation : -rotation;
  const offset = index * stagger;

  const animatedStyle = useAnimatedStyle(() => {
    const phase = Math.min(1, Math.max(0, (timeline.value - offset) / duration));
    const eased = phase * phase * (3 - 2 * phase);
    const spread = implode ? 1 - eased : eased;

    return {
      opacity: fade ? 1 - spread : 1,
      transform: [
        { translateX: x * spread },
        { translateY: y * spread },
        { rotate: `${spin * spread}deg` },
        { scale: scale ? 1 - 0.65 * spread : 1 },
      ],
    };
  });

  return (
    <Animated.Text style={[style, styles.character, animatedStyle]} accessible={false}>
      {character}
    </Animated.Text>
  );
});

ExplosionCharacter.displayName = 'ExplosionCharacter';

export const ExplosionText = ({
  text,
  duration = 1800,
  delay = 0,
  stagger = 40,
  distance = 100,
  rotation = 180,
  direction = 'explode',
  loop = false,
  fade = true,
  scale = true,
  style,
  containerStyle,
}: ExplosionTextProps) => {
  const layout = useMemo(() => getTextLayout(text), [text]);
  const timeline = useSharedValue(0);
  const characterDuration = Number.isFinite(duration) ? Math.max(1, duration) : 1800;
  const characterStagger = Number.isFinite(stagger) ? Math.max(0, stagger) : 40;
  const startDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0;
  const travel = Number.isFinite(distance) ? Math.max(0, distance) : 100;
  const spin = Number.isFinite(rotation) ? rotation : 180;
  const implode = direction === 'implode';

  useEffect(() => {
    timeline.value = 0;
    if (layout.characterCount === 0) {
      return;
    }

    // The shared clock runs linearly so each character controls its own stagger and easing.
    const totalDuration = characterDuration + (layout.characterCount - 1) * characterStagger;
    const timing = withTiming(totalDuration, { duration: totalDuration, easing: Easing.linear });
    const animation = loop ? withRepeat(timing, -1, true) : timing;
    timeline.value = startDelay > 0 ? withDelay(startDelay, animation) : animation;

    return () => cancelAnimation(timeline);
  }, [characterDuration, characterStagger, direction, layout, loop, startDelay, timeline]);

  if (!text) {
    return null;
  }

  const alignment: ViewStyle = {
    justifyContent: style?.textAlign === 'center'
      ? 'center'
      : style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
  };

  return (
    <View accessible accessibilityLabel={text} style={[styles.container, containerStyle]}>
      {layout.lines.map((runs, lineIndex) => (
        <View key={lineIndex} style={[styles.line, alignment]}>
          {runs.length === 0 && (
            <Text style={style} accessible={false}>{'\u00a0'}</Text>
          )}
          {runs.map((run, runIndex) =>
            run.characters ? (
              <View key={runIndex} style={[styles.word, alignment]}>
                {run.characters.map(({ character, index }) => (
                  <ExplosionCharacter
                    key={`${index}-${character}`}
                    character={character}
                    index={index}
                    timeline={timeline}
                    duration={characterDuration}
                    stagger={characterStagger}
                    distance={travel}
                    rotation={spin}
                    implode={implode}
                    fade={fade}
                    scale={scale}
                    style={style}
                  />
                ))}
              </View>
            ) : (
              <Text key={runIndex} style={[style, styles.character]} accessible={false}>
                {run.space}
              </Text>
            )
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    overflow: 'visible',
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    alignSelf: 'stretch',
    overflow: 'visible',
  },
  word: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    maxWidth: '100%',
    overflow: 'visible',
  },
  character: {
    flexShrink: 0,
  },
});
