import * as THREE from 'three';
import type { CharacterPose } from './characterSprite';

const textureLoader = new THREE.TextureLoader();

export function loadCharacterSprite(
  path: string | undefined,
  onLoaded: (texture: THREE.Texture) => void
): void {
  if (!path) return;

  textureLoader.load(
    path,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      onLoaded(texture);
    },
    undefined,
    () => {}
  );
}

export function loadCharacterSpriteSet(
  paths: Partial<Record<CharacterPose, string>>,
  onPoseLoaded: (pose: CharacterPose, texture: THREE.Texture) => void
): void {
  for (const pose of Object.keys(paths) as CharacterPose[]) {
    loadCharacterSprite(paths[pose], (texture) => onPoseLoaded(pose, texture));
  }
}
