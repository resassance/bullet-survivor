import * as THREE from 'three';
import { ATMOSPHERE, CHECKPOINT_LIGHT } from './lightingProfiles';

/** Fixed fixtures light the combat lane while the horizon fades into fog. */
export class Lighting {
  public readonly group = new THREE.Group();

  constructor() {
    this.group.name = 'checkpoint-lighting';
    const profile = ATMOSPHERE.checkpoint;
    this.group.add(new THREE.HemisphereLight(profile.sky, profile.ground, profile.fill));
    const moon = new THREE.DirectionalLight(profile.moon, profile.moonIntensity);
    moon.position.set(-8, 14, -12);
    this.group.add(moon);
    this.addFloodlight(-8, -5, new THREE.Vector3(1, 0, -17), true);
    this.addFloodlight(8, -18, new THREE.Vector3(-1, 0, -29), false);
    this.addWarningLamp(-6.4);
    this.addWarningLamp(6.4);
  }

  private addFloodlight(x: number, z: number, target: THREE.Vector3, shadows: boolean): void {
    const metal = new THREE.MeshStandardMaterial({ color: 0x343c3b, roughness: 0.9, metalness: 0.25 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 7, 6), metal);
    mast.position.set(x, 3.5, z);
    this.group.add(mast);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.4), metal);
    housing.position.set(x, 7, z);
    housing.lookAt(target);
    this.group.add(housing);
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.25), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.7, 2.3), side: THREE.DoubleSide }));
    lens.position.z = 0.21;
    housing.add(lens);

    const light = new THREE.SpotLight(CHECKPOINT_LIGHT.floodColor, CHECKPOINT_LIGHT.floodIntensity, CHECKPOINT_LIGHT.floodDistance, CHECKPOINT_LIGHT.floodAngle, 0.7, 1.6);
    light.position.copy(housing.position);
    light.target.position.copy(target);
    light.castShadow = shadows;
    if (shadows) {
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 55;
      light.shadow.bias = -0.0002;
      light.shadow.normalBias = 0.035;
    }
    this.group.add(light, light.target);

    // Geometric haze, without textures or an extra render pass.
    const length = light.position.distanceTo(target);
    const shaft = new THREE.Mesh(new THREE.ConeGeometry(Math.tan(light.angle) * length, length, 24, 1, true), new THREE.MeshBasicMaterial({ color: CHECKPOINT_LIGHT.floodColor, transparent: true, opacity: 0.018, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    shaft.position.copy(light.position).add(target).multiplyScalar(0.5);
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), light.position.clone().sub(target).normalize());
    this.group.add(shaft);
  }

  private addWarningLamp(x: number): void {
    const lamp = new THREE.PointLight(CHECKPOINT_LIGHT.warningColor, CHECKPOINT_LIGHT.warningIntensity, 7, 2);
    lamp.position.set(x, 1.15, -1.4);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.1, 0.2) }));
    bulb.position.copy(lamp.position);
    this.group.add(lamp, bulb);
  }
}
