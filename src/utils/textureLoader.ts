import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export function tryLoadTexture(
  path: string,
  onLoaded: (texture: THREE.Texture) => void
): void {
  loader.load(
    path,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      onLoaded(texture);
    },
    undefined,
    () => {}
  );
}

export function tryLoadTiledTexture(
  path: string,
  repeatX: number,
  repeatY: number,
  onLoaded: (texture: THREE.Texture) => void
): void {
  tryLoadTexture(path, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    onLoaded(texture);
  });
}
