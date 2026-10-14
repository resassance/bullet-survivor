import type { Vec3Like } from './campStations';

/** Normalized pivot measured from the image's bottom-left corner. */
export interface CampAssetDefinition {
  path?: string;
  width: number;
  height: number;
  pivot?: readonly [number, number];
}

export interface CampPropDefinition {
  position: Vec3Like;
  asset: CampAssetDefinition;
  unlockStage?: number;
}

/** All cutouts share the same frontal view; replace files without moving stations. */
export const CAMP_LAYOUT = {
  fire: {
    position: { x: -0.9, y: 0, z: 4.3 },
    asset: { path: '/assets/camp/fire-base.webp', width: 2.5, height: 1.15 },
  },
  flame: {
    position: { x: -0.9, y: 0.45, z: 4.31 },
    asset: { path: '/assets/camp/flame.webp', width: 1.6, height: 2.0 },
  },
  character: {
    position: { x: 1.65, y: 0, z: 3.5 },
    asset: { path: '/assets/camp/survivors.webp', width: 3.7, height: 2.7 },
  },
  companion: {
    position: { x: 3.1, y: 0, z: 3.45 },
    asset: { width: 1.6, height: 2.2 },
  },
  flag: {
    position: { x: 4.1, y: 0, z: -4.9 },
    asset: { path: '/assets/camp/flag.webp', width: 1.6, height: 3.6 },
    unlockStage: 1,
  },
  supplies: {
    position: { x: 4.4, y: 0, z: 3.6 },
    asset: { path: '/assets/camp/supplies.webp', width: 1.8, height: 1.3 },
    unlockStage: 8,
  },
  foregroundSupplies: {
    position: { x: -4.0, y: 0, z: 7.2 },
    asset: { path: '/assets/camp/supplies.webp', width: 2.5, height: 1.8 },
  },
  backdrop: {
    position: { x: 0, y: -6, z: -10 },
    asset: { path: '/assets/camp/backdrop.webp', width: 48, height: 22 },
  },
} satisfies Record<string, CampPropDefinition>;

export const CAMP_GROUND = {
  texturePath: '/assets/camp/ground.webp',
  repeatX: 4,
  repeatY: 4,
};
