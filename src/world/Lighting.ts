import * as THREE from 'three';
import { LIGHTING } from '../utils/constants';

export class Lighting {
  public readonly group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();

    const ambient = new THREE.AmbientLight(
      LIGHTING.AMBIENT_COLOR,
      LIGHTING.AMBIENT_INTENSITY
    );
    this.group.add(ambient);

    const directional = new THREE.DirectionalLight(
      LIGHTING.DIRECTIONAL_COLOR,
      LIGHTING.DIRECTIONAL_INTENSITY
    );
    directional.position.set(
      LIGHTING.DIRECTIONAL_POSITION.x,
      LIGHTING.DIRECTIONAL_POSITION.y,
      LIGHTING.DIRECTIONAL_POSITION.z
    );
    directional.castShadow = true;
    this.group.add(directional);

    const rim = new THREE.PointLight(
      LIGHTING.RIM_COLOR,
      LIGHTING.RIM_INTENSITY,
      40
    );
    rim.position.set(
      LIGHTING.RIM_POSITION.x,
      LIGHTING.RIM_POSITION.y,
      LIGHTING.RIM_POSITION.z
    );
    this.group.add(rim);
  }
}
