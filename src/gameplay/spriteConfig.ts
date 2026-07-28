import type { CharacterPose } from '../utils/characterSprite';

export const PLAYER_SPRITE_PATHS: Partial<Record<CharacterPose, string>> = {
  kneel: '/assets/sprites/player/kneel.png',
  crouch: '/assets/sprites/player/crouch.png',
  run: '/assets/sprites/player/run.png',
  reload: '/assets/sprites/player/reload.png',
  shoot: '/assets/sprites/player/shoot.png',
};
