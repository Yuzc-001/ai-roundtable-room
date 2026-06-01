/**
 * animation-utils.js
 * Shared animation primitives, palette, and Texture for Remotion compositions.
 * Extracted from RoundtableExplainer.jsx to keep the composition code focused.
 * 
 * All consumers must respect design system locks (no free hex colors outside palette variants).
 */
import {
  Easing,
  interpolate,
  AbsoluteFill,
} from 'remotion';

export const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
};

export const enter = (frame, start, duration = 36) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: ease,
  });

export const exit = (frame, start, duration = 28) =>
  interpolate(frame, [start, start + duration], [1, 0], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

export const windowOpacity = (frame, start, end) =>
  enter(frame, start) * exit(frame, end);

/**
 * Core palettes. Design systems (Editorial / Swiss) extend or select subsets.
 * NO free hex allowed in consumers - use these + locked variants only.
 */
export const palette = {
  ink: '#16261f',
  muted: '#6f796f',
  line: '#dfe3d4',
  paper: '#f7f6ee',
  green: '#1f4c41',
  gold: '#b4894c',
  red: '#b96f63',
  blue: '#6f859e',
  purple: '#9a87bd',
};

/**
 * Editorial (magazine/narrative) variant - warmer, story-driven.
 * Swiss (technical) variant - cooler, grid-precise.
 */
export const designSystemPalettes = {
  editorial: {
    ...palette,
    // slight narrative warmth overrides if needed (locked)
    accent: palette.gold,
    primary: palette.green,
  },
  swiss: {
    ink: '#0f172a',
    muted: '#475569',
    line: '#e2e8f0',
    paper: '#f8fafc',
    green: '#0f766e',
    gold: '#854d0e',
    red: '#9f1239',
    blue: '#1e40af',
    purple: '#6b21a8',
    accent: '#0e7490',
    primary: '#1e40af',
  },
};

/**
 * Reusable paper texture background (radial + grid).
 */
export const Texture = () => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 28% 18%, rgba(180,137,76,0.14), transparent 28%), radial-gradient(circle at 78% 26%, rgba(154,135,189,0.12), transparent 26%), radial-gradient(circle at 50% 92%, rgba(31,76,65,0.12), transparent 30%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(rgba(22,38,31,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(22,38,31,0.035) 1px, transparent 1px)',
        backgroundSize: '54px 54px',
        opacity: 0.45,
      }}
    />
  </>
);

/**
 * Generic callout annotation (for provenance highlights, key claims on slides).
 * Consumers pass position + label; progress controls reveal.
 */
export const Callout = ({ callout, progress, color = palette.gold }) => (
  <div
    style={{
      position: 'absolute',
      left: callout.x,
      top: callout.y,
      width: callout.w,
      height: callout.h,
      border: `4px solid ${color}`,
      borderRadius: 8,
      opacity: progress,
      boxShadow: `0 0 0 ${interpolate(progress, [0, 1], [0, 10])}px ${color}1f`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 14,
        top: -42,
        background: palette.green,
        color: '#fff',
        borderRadius: 8,
        padding: '9px 14px',
        fontSize: 20,
        fontWeight: 900,
        whiteSpace: 'nowrap',
      }}
    >
      {callout.label}
    </div>
  </div>
);
