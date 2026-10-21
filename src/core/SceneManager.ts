import * as THREE from 'three';
import { ATMOSPHERE, type LightingMode } from '../world/lightingProfiles';

export class SceneManager {
  public readonly scene: THREE.Scene;
  private mode: LightingMode = 'checkpoint';
  private background = new THREE.Color(ATMOSPHERE.checkpoint.background);
  private fog = new THREE.FogExp2(ATMOSPHERE.checkpoint.fog, ATMOSPHERE.checkpoint.fogDensity);
  private targetColor = new THREE.Color();

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = this.background;
    this.scene.fog = this.fog;
  }

  public setLightingMode(mode: LightingMode): void { this.mode = mode; }

  public update(delta: number): void {
    const profile = ATMOSPHERE[this.mode];
    const blend = 1 - Math.exp(-4 * delta);
    this.background.lerp(this.targetColor.setHex(profile.background), blend);
    this.fog.color.lerp(this.targetColor.setHex(profile.fog), blend);
    this.fog.density += (profile.fogDensity - this.fog.density) * blend;
  }

  public add(object: THREE.Object3D): void {
    this.scene.add(object);
  }
}

