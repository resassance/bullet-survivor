export interface ArenaPoint { x: number; y: number }
export type CornerId = 0 | 1 | 2 | 3;

export const FINAL_BOSS = {
  stage: 10,
  health: 100,
  phaseTwoThreshold: 30,
  moveSpeed: 0.85,
  playerDamage: 1.5,
  playerFireRate: 3.2,
  magazine: 12,
  reloadDuration: 1.4,
  firstAttackDelay: 1.2,
  attackCooldown: 1.8,
  volleyCast: 0.9,
  beamCast: 1.25,
  beamHalfWidth: 0.065,
  mirrorCast: 3.2,
  mirrorCooldown: 1.2,
  reflectionRadius: 0.065,
  breakCoverOnMiss: false,
} as const;

export const CENTER: ArenaPoint = { x: 0.5, y: 0.5 };
export const PHASE_ONE_BOSS: ArenaPoint = { x: 0.5, y: 0.22 };
export const CORNERS: readonly { id: CornerId; name: string; point: ArenaPoint }[] = [
  { id: 0, name: 'ВЕРХ СЛЕВА', point: { x: 0.18, y: 0.18 } },
  { id: 1, name: 'ВЕРХ СПРАВА', point: { x: 0.82, y: 0.18 } },
  { id: 2, name: 'НИЗ СЛЕВА', point: { x: 0.18, y: 0.82 } },
  { id: 3, name: 'НИЗ СПРАВА', point: { x: 0.82, y: 0.82 } },
];

export function mirrorPoint(point: ArenaPoint): ArenaPoint {
  return { x: 1 - point.x, y: 1 - point.y };
}

export function oppositeCorner(corner: CornerId): CornerId {
  return (3 - corner) as CornerId;
}
