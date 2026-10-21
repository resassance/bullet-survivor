/** Tune scene lighting here when replacing schematic geometry with final textures. */
export type LightingMode = 'camp' | 'checkpoint';

export const ATMOSPHERE = {
  camp: {
    background: 0x101a23, fog: 0x18232c, fogDensity: 0.022,
    sky: 0x8ba6bf, ground: 0x332a22, fill: 0.7,
    moon: 0xa5bed0, moonIntensity: 0.65,
    exposure: 1.15, bloom: 0.32, vignette: 0.32,
  },
  checkpoint: {
    background: 0x172127, fog: 0x27383d, fogDensity: 0.034,
    sky: 0xb1c4c6, ground: 0x3b342b, fill: 0.95,
    moon: 0x9db7c4, moonIntensity: 1.05,
    exposure: 1.1, bloom: 0.38, vignette: 0.25,
  },
} as const;

export const CAMP_LIGHT = {
  fireColor: 0xffa353, fireIntensity: 48, fireDistance: 17, fireHeight: 1.15,
  gateColor: 0xffcc88, gateIntensity: 12,
} as const;

export const CHECKPOINT_LIGHT = {
  floodColor: 0xc9ddd8, floodIntensity: 170, floodAngle: 0.48, floodDistance: 65,
  warningColor: 0xff9d45, warningIntensity: 9,
} as const;

/** Smooth and bounded: the fire breathes without per-frame random flashes. */
export function fireFlicker(seconds: number): number {
  return 1 + Math.sin(seconds * 5.3) * 0.055 + Math.sin(seconds * 8.7 + 1.4) * 0.025 + Math.sin(seconds * 1.7) * 0.04;
}
