export type CampStationId = 'weapon' | 'archive' | 'skills' | 'special' | 'settings' | 'story';

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
  cameraPosition: Vec3Like;
  cameraLookAt: Vec3Like;
  accentColor: string;
  accentColorHex: number;
}

export const CAMP_STATIONS: CampStationDefinition[] = [
  {
    id: 'weapon',
    label: 'ОРУЖИЕ',
    ready: true,
    propPosition: { x: -3.6, y: 0, z: 2.4 },
    cameraPosition: { x: -1.7, y: 2.3, z: 6.2 },
    cameraLookAt: { x: -3.6, y: 1.2, z: 2.4 },
    accentColor: '#ff3b6e',
    accentColorHex: 0xff3b6e,
  },
  {
    id: 'archive',
    label: 'АРХИВ',
    ready: true,
    propPosition: { x: 3.6, y: 0, z: 2.4 },
    cameraPosition: { x: 1.7, y: 2.3, z: 6.2 },
    cameraLookAt: { x: 3.6, y: 1.2, z: 2.4 },
    accentColor: '#3bd6ff',
    accentColorHex: 0x3bd6ff,
  },
  {
    id: 'skills',
    label: 'ПРОКАЧКА',
    ready: false,
    propPosition: { x: -5.4, y: 0, z: 5.8 },
    cameraPosition: { x: -3.5, y: 2.4, z: 9.2 },
    cameraLookAt: { x: -5.4, y: 1.6, z: 5.8 },
    accentColor: '#3bffb0',
    accentColorHex: 0x3bffb0,
  },
  {
    id: 'special',
    label: 'СПЕЦОРУЖИЕ',
    ready: false,
    propPosition: { x: 5.4, y: 0, z: 5.8 },
    cameraPosition: { x: 3.5, y: 2.4, z: 9.2 },
    cameraLookAt: { x: 5.4, y: 1.6, z: 5.8 },
    accentColor: '#bfe0ff',
    accentColorHex: 0xbfe0ff,
  },
  {
    id: 'settings',
    label: 'НАСТРОЙКИ',
    ready: true,
    propPosition: { x: 0, y: 0, z: 7.4 },
    cameraPosition: { x: 0, y: 2.5, z: 10.8 },
    cameraLookAt: { x: 0, y: 1.5, z: 7.4 },
    accentColor: '#9b7fff',
    accentColorHex: 0x9b7fff,
  },
  {
    id: 'story',
    label: 'ИСТОРИЯ',
    ready: true,
    propPosition: { x: 0, y: 0, z: -5.5 },
    cameraPosition: { x: 0, y: 1.9, z: -0.8 },
    cameraLookAt: { x: 0, y: 1.5, z: -5.5 },
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
