
import React, { useEffect, useMemo, useState } from 'react';
import { PixelRatio, type TextStyle, type ViewStyle } from 'react-native';

import {
  AlphaType,
  Atlas,
  BlurStyle,
  Canvas,
  ColorType,
  FilterMode,
  Skia,
  useCanvasRef,
  useRSXformBuffer,
  type SkPaint,
} from '@shopify/react-native-skia';

import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface ParticleTextProps {
  text: string;
  fontSize?: number;
  particleSize?: number;
  duration?: number;
  /** Milliseconds to hold the starting pose before moving. Defaults to 750 for disperse and 0 for assemble. */
  delay?: number;
  stagger?: number;
  loop?: boolean;
  direction?: 'assemble' | 'disperse';
  particleColor?: string;

  particleShape?: 'circle' | 'square' | 'diamond' | 'mixed';

  particleGlow?: boolean;
  glowRadius?: number;
  glowColor?: string;

  style?: TextStyle;
  containerStyle?: ViewStyle;
}

interface ParticleData {
  x: number;
  y: number;
  startX: number;
  startY: number;
  delay: number;
}

interface ParticleLayout {
  particles: ParticleData[];
  width: number;
  height: number;
  totalDuration: number;
}

const PADDING = 16;
const MASK_SCALE = 2;
const MIXED_SHAPES = ['circle', 'square', 'diamond'] as const;
const ATLAS_SAMPLING = { filter: FilterMode.Linear };

const createParticleAtlas = (
  shape: NonNullable<ParticleTextProps['particleShape']>,
  size: number,
  color: string,
  glowRadius: number,
  glowColor: string,
) => {
  const shapes = shape === 'mixed' ? MIXED_SHAPES : [shape];
  const pixelRatio = PixelRatio.get();
  // Leave room for the blur's visible falloff and the sampling gutter.
  const halfCell = Math.ceil((size + 3 * glowRadius + 1) * pixelRatio);
  const cellSize = halfCell * 2;
  const surface = Skia.Surface.Make(shapes.length * cellSize, cellSize);
  const sprites = shapes.map((_, index) =>
    Skia.XYWHRect(index * cellSize, 0, cellSize, cellSize),
  );

  if (!surface) {
    return { image: null, sprites, scale: 1 / pixelRatio, inset: halfCell / pixelRatio };
  }

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  canvas.scale(pixelRatio, pixelRatio);

  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));

  const glowPaint = Skia.Paint();
  glowPaint.setAntiAlias(true);
  glowPaint.setColor(Skia.Color(glowColor));
  if (glowRadius > 0) {
    glowPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, glowRadius, true));
  }

  shapes.forEach((particleShape, index) => {
    const x = (index * cellSize + halfCell) / pixelRatio;
    const y = halfCell / pixelRatio;

    const draw = (brush: SkPaint) => {
      if (particleShape === 'circle') {
        canvas.drawCircle(x, y, size, brush);
      } else if (particleShape === 'square') {
        canvas.drawRect(Skia.XYWHRect(x - size, y - size, size * 2, size * 2), brush);
      } else {
        const path = Skia.PathBuilder.Make();
        path.moveTo(x, y - size);
        path.lineTo(x + size, y);
        path.lineTo(x, y + size);
        path.lineTo(x - size, y);
        path.close();
        canvas.drawPath(path.detach(), brush);
      }
    };

    if (glowRadius > 0) {
      draw(glowPaint);
    }
    draw(paint);
  });

  surface.flush();
  return {
    image: surface.makeImageSnapshot(),
    sprites,
    scale: 1 / pixelRatio,
    inset: halfCell / pixelRatio,
  };
};

const random = (seed: number): number => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const getFontWeight = (weight?: TextStyle['fontWeight']): number => {
  if (weight === 'bold' || weight === '900' || weight === '800') {
    return 700;
  }

  if (weight === '700') return 700;
  if (weight === '600') return 600;
  if (weight === '500') return 500;
  if (weight === '300') return 300;

  return 400;
};

const createParticles = (
  text: string,
  fontSize: number,
  particleSize: number,
  stagger: number,
  duration: number,
  fontFamily: string,
  fontWeight: number,
): ParticleLayout => {
  const empty: ParticleLayout = {
    particles: [],
    width: 0,
    height: 0,
    totalDuration: duration,
  };

  if (!text.trim()) {
    return empty;
  }

  const builder = Skia.ParagraphBuilder.Make();

  builder
    .pushStyle({
      color: Skia.Color('#FFFFFF'),
      fontFamilies: [fontFamily],
      fontSize,
      fontStyle: {
        weight: fontWeight,
      },
    })
    .addText(text)
    .pop();

  const paragraph = builder.build();

  paragraph.layout(10000);

  // Sample the painted paragraph to include every line and resolved glyph.
  const maskPadding = Math.ceil(fontSize / 2);
  const maskWidth = Math.ceil((paragraph.getLongestLine() + maskPadding * 2) * MASK_SCALE);
  const maskHeight = Math.ceil((paragraph.getHeight() + maskPadding * 2) * MASK_SCALE);
  const surface = Skia.Surface.Make(maskWidth, maskHeight);
  if (!surface) {
    return empty;
  }

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  canvas.scale(MASK_SCALE, MASK_SCALE);
  paragraph.paint(canvas, maskPadding, maskPadding);
  const pixels = canvas.readPixels(0, 0, {
    width: maskWidth,
    height: maskHeight,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Premul,
  });
  if (!pixels) {
    return empty;
  }

  const alphaAt = (x: number, y: number) => pixels[(y * maskWidth + x) * 4 + 3];
  let left = maskWidth;
  let right = -1;
  let top = maskHeight;
  let bottom = -1;
  for (let y = 0; y < maskHeight; y++) {
    for (let x = 0; x < maskWidth; x++) {
      if (alphaAt(x, y) >= 64) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left || bottom < top) {
    return empty;
  }

  const cellSize = Math.round(Math.max(3, particleSize * 2.5) * MASK_SCALE);
  const width = Math.ceil((right - left + 1) / MASK_SCALE + PADDING * 2);
  const height = Math.ceil((bottom - top + 1) / MASK_SCALE + PADDING * 2);
  const particles: ParticleData[] = [];

  for (let y = top; y <= bottom; y += cellSize) {
    const endY = Math.min(y + cellSize, bottom + 1);
    for (let x = left; x <= right; x += cellSize) {
      const endX = Math.min(x + cellSize, right + 1);
      let sampleX = (x + endX) / 2;
      let sampleY = (y + endY) / 2;

      if (alphaAt(Math.floor(sampleX), Math.floor(sampleY)) < 128) {
        // A thin stroke can cross a cell without touching its center.
        let coverage = 0;
        let inkX = 0;
        let inkY = 0;
        for (let row = y; row < endY; row++) {
          for (let column = x; column < endX; column++) {
            const alpha = alphaAt(column, row);
            coverage += alpha;
            inkX += (column + 0.5) * alpha;
            inkY += (row + 0.5) * alpha;
          }
        }
        if (coverage < 0.18 * 255 * (endX - x) * (endY - y)) {
          continue;
        }
        sampleX = inkX / coverage;
        sampleY = inkY / coverage;
      }

      const seed = particles.length;
      const targetX = (sampleX - left) / MASK_SCALE + PADDING;
      const targetY = (sampleY - top) / MASK_SCALE + PADDING;
      const spreadX = (random(seed + 1) - 0.5) * width * 1.5;
      const spreadY = (random(seed + 2) - 0.5) * height * 3;

      particles.push({
        x: targetX,
        y: targetY,
        startX: targetX + spreadX,
        startY: targetY + spreadY,
        delay: stagger * seed,
      });
    }
  }

  const maxDelay =
    Math.max(0, particles.length - 1) * stagger;

  return {
    particles,
    width,
    height,
    totalDuration: duration + maxDelay,
  };
};

export const ParticleText: React.FC<ParticleTextProps> = ({
  text,
  fontSize = 56,
  particleSize = 2,
  duration = 2500,
  delay,
  stagger = 0,
  loop = false,
  direction = 'assemble',
  particleColor = '#A855F7',

  particleShape = 'circle',

  particleGlow = false,
  glowRadius = 8,
  glowColor,

  style,
  containerStyle,
}) => {
  const progress = useSharedValue(
    direction === 'assemble' ? 0 : 1,
  );

  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRef = useCanvasRef();

  const safeDuration = Math.max(1, duration);
  const assembling = direction === 'assemble';
  const startDelay = Math.max(0, delay ?? (assembling ? 0 : 750));
  const repeatDelay = delay === undefined && assembling ? 400 : startDelay;
  const safeStagger = Math.max(0, stagger);
  const safeParticleSize = Math.max(0.5, particleSize);
  const safeGlowRadius = Math.max(0, glowRadius);

  const fontFamily = style?.fontFamily ?? 'Arial';
  const fontWeight = getFontWeight(style?.fontWeight);

  const layout = useMemo(
    () =>
      createParticles(
        text,
        fontSize,
        safeParticleSize,
        safeStagger,
        safeDuration,
        fontFamily,
        fontWeight,
      ),
    [
      text,
      fontSize,
      safeParticleSize,
      safeStagger,
      safeDuration,
      fontFamily,
      fontWeight,
    ],
  );
  const { particles, totalDuration } = layout;
  const hasParticles = particles.length > 0;
  const atlasGlowRadius = particleGlow ? safeGlowRadius : 0;
  const atlasGlowColor = glowColor ?? particleColor;
  const { image, sprites, scale, inset } = useMemo(
    () => createParticleAtlas(
      particleShape,
      safeParticleSize,
      particleColor,
      atlasGlowRadius,
      atlasGlowColor,
    ),
    [particleShape, safeParticleSize, particleColor, atlasGlowRadius, atlasGlowColor],
  );
  const particleCount = particles.length;
  const particleSprites = useMemo(
    () => Array.from({ length: particleCount }, (_, index) => sprites[index % sprites.length]),
    [particleCount, sprites],
  );
  const transforms = useRSXformBuffer(particleCount, (transform, index) => {
    'worklet';
    const particle = particles[index];
    const elapsed = progress.value * totalDuration;
    const phase = Math.max(0, Math.min(1, (elapsed - particle.delay) / safeDuration));
    transform.set(
      scale,
      0,
      particle.startX + (particle.x - particle.startX) * phase - inset,
      particle.startY + (particle.y - particle.startY) * phase - inset,
    );
  });

  useEffect(() => {
    if (!hasParticles) {
      setCanvasReady(false);
      return;
    }

    let cancelled = false;
    let frame: number;
    const measureCanvas = () => {
      canvasRef.current?.measure((_x, _y, width, height) => {
        if (cancelled) {
          return;
        }
        if (width > 0 && height > 0) {
          setCanvasReady(true);
        } else {
          frame = requestAnimationFrame(measureCanvas);
        }
      });
    };
    frame = requestAnimationFrame(measureCanvas);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [canvasRef, hasParticles]);

  useEffect(() => {
    cancelAnimation(progress);

    if (!canvasReady || !layout.particles.length) {
      return;
    }

    const start = assembling ? 0 : 1;
    const end = 1 - start;

    progress.value = start;

    const forward = withTiming(end, {
      duration: layout.totalDuration,
      easing: assembling ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
    });

    const backward = withTiming(start, {
      duration: layout.totalDuration,
      easing: Easing.inOut(Easing.cubic),
    });

    const animation = loop
      ? withRepeat(
          withSequence(
            forward,
            withDelay(400, backward),
            withTiming(start, { duration: Math.max(1, repeatDelay) }),
          ),
          -1,
          false,
        )
      : forward;
    progress.value = startDelay > 0 ? withDelay(startDelay, animation) : animation;

    return () => {
      cancelAnimation(progress);
    };
  }, [
    canvasReady,
    assembling,
    loop,
    layout,
    progress,
    repeatDelay,
    startDelay,
  ]);

  if (!hasParticles) {
    return null;
  }

  return (
    <Canvas
      ref={canvasRef}
      style={[
        {
          width: layout.width,
          height: layout.height,
        },
        containerStyle,
      ]}
    >
      <Atlas
        image={image}
        sprites={particleSprites}
        transforms={transforms}
        sampling={ATLAS_SAMPLING}
      />
    </Canvas>
  );
};

export default ParticleText;
