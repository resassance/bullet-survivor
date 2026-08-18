import type { SpecialWeaponId } from './specialWeapons';

/** Stage at which each regular weapon becomes selectable in camp. */
export const WEAPON_UNLOCK_STAGE: Record<string, number> = {
  standard: 1,
  scatter: 3,
  rapid: 7,
};

/** Stage at which each special weapon is unlocked. */
export const SPECIAL_UNLOCK_STAGE: Record<SpecialWeaponId, number> = {
  lightning: 10,
  windSlash: 15,
  grenade: 20,
};

export function isWeaponUnlocked(weaponId: string, stage: number): boolean {
  const unlockStage = WEAPON_UNLOCK_STAGE[weaponId];
  return unlockStage === undefined ? true : stage >= unlockStage;
}

export function isSpecialUnlocked(specialId: SpecialWeaponId, stage: number): boolean {
  return stage >= SPECIAL_UNLOCK_STAGE[specialId];
}

/** Stage at which the special weapon station itself opens (first special becomes available). */
export function specialStationUnlockStage(): number {
  return Math.min(...Object.values(SPECIAL_UNLOCK_STAGE));
}

export function isSpecialStationUnlocked(stage: number): boolean {
  return stage >= specialStationUnlockStage();
}
