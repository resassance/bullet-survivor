import type { CampAssetDefinition } from './campLayout';
import { CAMP_CAMERA } from '../utils/constants';

export type CampStationId = 'weapon' | 'archive' | 'endless' | 'special' | 'settings' | 'story';

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface CampStationDefinition {
  id: CampStationId;
  label: string;
  ready: boolean;
  propPosition: Vec3Like;
  asset: CampAssetDefinition;
  labelHeight: number;
  cameraPosition: Vec3Like;
  cameraLookAt: Vec3Like;
  accentColor: string;
  accentColorHex: number;
}

export interface CampStationState {
  id: CampStationId;
  label: string;
  locked: boolean;
  active: boolean;
  anchor: Vec3Like;
}

// Selection only nudges the shared camera forward; it never orbits a flat asset.
const stationCamera = { ...CAMP_CAMERA.OVERVIEW_POSITION, z: CAMP_CAMERA.OVERVIEW_POSITION.z - 0.35 };
const stationLookAt = { ...CAMP_CAMERA.OVERVIEW_LOOK_AT };

export const CAMP_STATIONS: CampStationDefinition[] = [
  {
    id: 'weapon',
    label: 'ОРУЖИЕ',
    ready: true,
    propPosition: { x: -6, y: 0, z: -0.5 },
    asset: { width: 3.2, height: 3.1 },
    labelHeight: 3.35,
    cameraPosition: stationCamera,
    cameraLookAt: stationLookAt,
    accentColor: '#ff3b6e',
    accentColorHex: 0xff3b6e,
  },
  {
    id: 'archive',
    label: 'АРХИВ',
    ready: true,
    propPosition: { x: 5.3, y: 0, z: -0.4 },
    asset: { width: 3.2, height: 3.0 },
    labelHeight: 3.25,
    cameraPosition: stationCamera,
    cameraLookAt: stationLookAt,
    accentColor: '#3bd6ff',
    accentColorHex: 0x3bd6ff,
  },
  {
    id: 'endless',
    label: 'БЕСКОНЕЧНЫЙ РЕЖИМ',
    ready: false,
    propPosition: { x: -3.5, y: 0, z: -3.8 },
    asset: { width: 2.5, height: 2.7 },
    labelHeight: 3,
    cameraPosition: stationCamera,
    cameraLookAt: stationLookAt,
    accentColor: '#3bffb0',
    accentColorHex: 0x3bffb0,
  },
  {
    id: 'special',
    label: 'СПЕЦОРУЖИЕ',
    ready: false,
    propPosition: { x: 6.4, y: 0, z: 2.3 },
    asset: { width: 2.5, height: 1.9 },
    labelHeight: 2.2,
    cameraPosition: stationCamera,
    cameraLookAt: stationLookAt,
    accentColor: '#bfe0ff',
    accentColorHex: 0xbfe0ff,
  },
  {
    id: 'settings',
    label: 'НАСТРОЙКИ',
    ready: true,
    propPosition: { x: -5.7, y: 0, z: 3.5 },
    asset: { width: 2.7, height: 1.6 },
    labelHeight: 1.95,
    cameraPosition: stationCamera,
    cameraLookAt: stationLookAt,
    accentColor: '#9b7fff',
    accentColorHex: 0x9b7fff,
  },
  {
    id: 'story',
    label: 'ПРОДОЛЖИТЬ ИСТОРИЮ',
    ready: true,
    propPosition: { x: 0, y: 0, z: -5.4 },
    asset: { width: 7.2, height: 6.55 },
    labelHeight: 6.8,
    cameraPosition: stationCamera,
    cameraLookAt: stationLookAt,
    accentColor: '#ffb347',
    accentColorHex: 0xffb347,
  },
];

export function findCampStation(id: CampStationId): CampStationDefinition {
  const found = CAMP_STATIONS.find((station) => station.id === id);
  if (!found) {
    throw new Error(`Unknown camp station: ${id}`);
  }
  return found;
}

