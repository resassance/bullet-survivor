import * as THREE from 'three';
import { CAMP_STATIONS, type CampStationDefinition, type CampStationId } from '../gameplay/campStations';
import { WEAPONS } from '../gameplay/weapons';
import { createLabelTexture } from '../utils/labelTexture';
import { createCharacterPoseTexture } from '../utils/characterSprite';
import { billboardYAxis } from '../utils/billboard';
import { CAMP_SCENE, PLAYER } from '../utils/constants';
import { tryLoadTiledTexture } from '../utils/textureLoader';

interface StationVisual {
  definition: CampStationDefinition;
  stationGroup: THREE.Group;
  pad: THREE.Mesh;
  padMaterial: THREE.MeshBasicMaterial;
  baseOpacity: number;
  label: THREE.Sprite;
  accentMaterial: THREE.MeshStandardMaterial;
  baseMaterial: THREE.MeshStandardMaterial;
  locked: boolean;
  hovered: boolean;
  active: boolean;
  scale: number;
  phase: number;
}

interface EmberSlot {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  alive: boolean;
}

export class CampWorld {
  public readonly group: THREE.Group;

  private stations: Map<CampStationId, StationVisual> = new Map();
  private spinning: THREE.Object3D[] = [];
  private fireLight: THREE.PointLight;
  private character: THREE.Mesh;
  private characterBaseY: number;
  private weaponBarrelMaterials: THREE.MeshStandardMaterial[] = [];
  private embers: THREE.InstancedMesh;
  private emberSlots: EmberSlot[] = [];
  private emberSpawnTimer = 0;
  private emberDummy = new THREE.Object3D();
  private progressDecor: { stage: number; object: THREE.Object3D }[] = [];
  private elapsed = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    this.group.add(this.buildFloor());
    this.group.add(this.buildAmbientLight());
    this.fireLight = this.buildCampfire();
    this.embers = this.buildEmbers();
    this.group.add(this.embers);

    for (const station of CAMP_STATIONS) {
      this.buildStation(station);
    }

    this.buildProgressDecor();

    this.character = this.buildCharacter();
    this.characterBaseY = this.character.position.y;
    this.group.add(this.character);
  }

  private buildFloor(): THREE.Mesh {
    const geometry = new THREE.CircleGeometry(11, 48);
    const material = new THREE.MeshStandardMaterial({
      color: CAMP_SCENE.FLOOR_COLOR,
      roughness: 0.95,
      metalness: 0,
      emissive: new THREE.Color(CAMP_SCENE.FLOOR_EMISSIVE),
      emissiveIntensity: 0.12,
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.02, 4);

    tryLoadTiledTexture('/assets/textures/floor-camp.jpg', 6, 6, (texture) => {
      material.map = texture;
      material.color.setHex(0xffffff);
      material.needsUpdate = true;
    });

    return floor;
  }

  private buildAmbientLight(): THREE.AmbientLight {
    return new THREE.AmbientLight(CAMP_SCENE.AMBIENT_COLOR, CAMP_SCENE.AMBIENT_INTENSITY);
  }

  private buildCampfire(): THREE.PointLight {
    const fireGroup = new THREE.Group();
    fireGroup.position.set(0, 0, 1.2);

    const logMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b1a10,
      roughness: 0.9,
    });
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6), logMaterial);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i / 3) * Math.PI;
      log.position.y = 0.08;
      fireGroup.add(log);
    }

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: CAMP_SCENE.FIRE_LIGHT_COLOR,
      transparent: true,
      opacity: 0.8,
    });
    const glow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 8), glowMaterial);
    glow.position.y = 0.3;
    fireGroup.add(glow);

    const light = new THREE.PointLight(
      CAMP_SCENE.FIRE_LIGHT_COLOR,
      CAMP_SCENE.FIRE_LIGHT_INTENSITY,
      9
    );
    light.position.set(
      CAMP_SCENE.FIRE_LIGHT_POSITION.x,
      CAMP_SCENE.FIRE_LIGHT_POSITION.y,
      CAMP_SCENE.FIRE_LIGHT_POSITION.z
    );
    fireGroup.add(light);

    this.group.add(fireGroup);
    return light;
  }

  private buildEmbers(): THREE.InstancedMesh {
    const geometry = new THREE.SphereGeometry(0.025, 5, 5);
    const material = new THREE.MeshBasicMaterial({
      color: CAMP_SCENE.EMBER_COLOR,
      transparent: true,
      toneMapped: false,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, CAMP_SCENE.EMBER_POOL_SIZE);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    mesh.frustumCulled = false;

    for (let i = 0; i < CAMP_SCENE.EMBER_POOL_SIZE; i++) {
      this.emberSlots.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, alive: false });
    }

    return mesh;
  }

  private spawnEmber(): void {
    const slot = this.emberSlots.find((s) => !s.alive);
    if (!slot) return;

    slot.alive = true;
    slot.x = CAMP_SCENE.FIRE_LIGHT_POSITION.x + (Math.random() - 0.5) * 0.3;
    slot.y = 0.3;
    slot.z = 1.2 + (Math.random() - 0.5) * 0.3;
    slot.vx = (Math.random() - 0.5) * 0.15;
    slot.vy = THREE.MathUtils.randFloat(0.5, 0.9);
    slot.vz = (Math.random() - 0.5) * 0.15;
    slot.life = CAMP_SCENE.EMBER_LIFETIME;
  }

  private updateEmbers(delta: number): void {
    this.emberSpawnTimer -= delta;
    if (this.emberSpawnTimer <= 0) {
      this.spawnEmber();
      this.emberSpawnTimer = CAMP_SCENE.EMBER_SPAWN_INTERVAL;
    }

    let renderIndex = 0;
    for (const slot of this.emberSlots) {
      if (!slot.alive) continue;

      slot.life -= delta;
      if (slot.life <= 0) {
        slot.alive = false;
        continue;
      }

      slot.vx += (Math.random() - 0.5) * 0.4 * delta;
      slot.x += slot.vx * delta;
      slot.y += slot.vy * delta;
      slot.z += slot.vz * delta;

      const lifeRatio = Math.max(0, slot.life / CAMP_SCENE.EMBER_LIFETIME);
      this.emberDummy.position.set(slot.x, slot.y, slot.z);
      this.emberDummy.scale.setScalar(lifeRatio);
      this.emberDummy.updateMatrix();
      this.embers.setMatrixAt(renderIndex, this.emberDummy.matrix);
      renderIndex++;
    }
    this.embers.count = renderIndex;
    this.embers.instanceMatrix.needsUpdate = true;
  }

  private buildCharacter(): THREE.Mesh {
    const texture = createCharacterPoseTexture('kneel');
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });
    const geometry = new THREE.PlaneGeometry(PLAYER.WIDTH, PLAYER.HEIGHT);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, PLAYER.HEIGHT / 2, 2.6);
    return mesh;
  }

  private buildProgressDecor(): void {
    const bannerMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2416,
      roughness: 0.8,
      emissive: new THREE.Color(0xff9a4d),
      emissiveIntensity: 0.15,
    });
    const banner = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), bannerMaterial);
    pole.position.y = 1.2;
    banner.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), bannerMaterial);
    flag.position.set(0.32, 2.05, 0);
    banner.add(flag);
    banner.position.set(-4.6, 0, 0.4);
    banner.visible = false;
    this.group.add(banner);
    this.progressDecor.push({ stage: 5, object: banner });

    const crateMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c1f12,
      roughness: 0.85,
      emissive: new THREE.Color(0xff9a4d),
      emissiveIntensity: 0.1,
    });
    const crates = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), crateMaterial);
      crate.position.set((i % 2) * 0.55, 0.25 + Math.floor(i / 2) * 0.55, 0);
      crates.add(crate);
    }
    crates.position.set(4.6, 0, 0.6);
    crates.visible = false;
    this.group.add(crates);
    this.progressDecor.push({ stage: 8, object: crates });
  }

  public setStoryProgress(stage: number): void {
    for (const decor of this.progressDecor) {
      decor.object.visible = stage >= decor.stage;
    }
  }

  private buildStation(station: CampStationDefinition): void {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(
      station.propPosition.x,
      station.propPosition.y,
      station.propPosition.z
    );

    const { pad, material: padMaterial, baseOpacity } = this.buildPad(station);
    stationGroup.add(pad);

    const { group: propGroup, accentMaterial, baseMaterial } = this.buildProp(station);
    stationGroup.add(propGroup);

    const label = this.buildLabel(station, !station.ready);
    label.position.y = station.id === 'story' ? 2.9 : 2.3;
    stationGroup.add(label);

    this.group.add(stationGroup);

    this.stations.set(station.id, {
      definition: station,
      stationGroup,
      pad,
      padMaterial,
      baseOpacity,
      label,
      accentMaterial,
      baseMaterial,
      locked: !station.ready,
      hovered: false,
      active: false,
      scale: 1,
      phase: Math.random() * Math.PI * 2,
    });
  }

  private buildPad(
    station: CampStationDefinition
  ): { pad: THREE.Mesh; material: THREE.MeshBasicMaterial; baseOpacity: number } {
    const geometry = new THREE.RingGeometry(0.9, 1.15, 32);
    const baseOpacity = station.ready ? 0.5 : 0.18;
    const material = new THREE.MeshBasicMaterial({
      color: station.accentColorHex,
      transparent: true,
      opacity: baseOpacity,
      side: THREE.DoubleSide,
    });
    const pad = new THREE.Mesh(geometry, material);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.02;
    return { pad, material, baseOpacity };
  }

  private buildProp(
    station: CampStationDefinition
  ): {
    group: THREE.Group;
    accentMaterial: THREE.MeshStandardMaterial;
    baseMaterial: THREE.MeshStandardMaterial;
  } {
    const propGroup = new THREE.Group();
    const dim = station.ready ? 1 : 0.4;

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x201509,
      roughness: 0.75,
      metalness: 0.15,
      emissive: new THREE.Color(station.accentColorHex),
      emissiveIntensity: 0.18 * dim,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: station.accentColorHex,
      roughness: 0.35,
      metalness: 0.3,
      emissive: new THREE.Color(station.accentColorHex),
      emissiveIntensity: 0.6 * dim,
    });

    switch (station.id) {
      case 'weapon': {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.7, 0.4), baseMaterial);
        rack.position.y = 0.85;
        propGroup.add(rack);
        for (let i = 0; i < WEAPONS.length; i++) {
          const barrelMaterial = new THREE.MeshStandardMaterial({
            color: station.accentColorHex,
            roughness: 0.35,
            metalness: 0.3,
            emissive: new THREE.Color(station.accentColorHex),
            emissiveIntensity: 0.6,
          });
          const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8),
            barrelMaterial
          );
          barrel.rotation.z = Math.PI / 2;
          barrel.position.set(-0.5 + i * 0.5, 1.3, 0.25);
          propGroup.add(barrel);
          this.weaponBarrelMaterials.push(barrelMaterial);
        }
        break;
      }
      case 'archive': {
        const terminal = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 0.3), baseMaterial);
        terminal.position.y = 0.8;
        propGroup.add(terminal);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), accentMaterial);
        screen.position.set(0, 1.0, 0.16);
        propGroup.add(screen);
        break;
      }
      case 'endless': {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.15), baseMaterial);
        board.position.y = 1.1;
        propGroup.add(board);
        for (let i = 0; i < 4; i++) {
          const node = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), accentMaterial);
          node.position.set(i % 2 === 0 ? -0.35 : 0.35, 0.6 + Math.floor(i / 2) * 0.8, 0.1);
          propGroup.add(node);
        }
        break;
      }
      case 'special': {
        const pedestal = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.65, 0.9, 8),
          baseMaterial
        );
        pedestal.position.y = 0.45;
        propGroup.add(pedestal);
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), accentMaterial);
        core.position.y = 1.15;
        propGroup.add(core);
        this.spinning.push(core);
        break;
      }
      case 'settings': {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.2), baseMaterial);
        panel.position.y = 0.85;
        propGroup.add(panel);
        const dial = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 20), accentMaterial);
        dial.position.set(0, 0.9, 0.15);
        propGroup.add(dial);
        this.spinning.push(dial);
        break;
      }
      case 'story': {
        const archMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a1006,
          roughness: 0.6,
          metalness: 0.25,
          emissive: new THREE.Color(station.accentColorHex),
          emissiveIntensity: 0.25,
        });
        const pillarGeometry = new THREE.BoxGeometry(0.35, 2.1, 0.35);
        const leftPillar = new THREE.Mesh(pillarGeometry, archMaterial);
        leftPillar.position.set(-1.0, 1.05, 0);
        propGroup.add(leftPillar);
        const rightPillar = new THREE.Mesh(pillarGeometry, archMaterial);
        rightPillar.position.set(1.0, 1.05, 0);
        propGroup.add(rightPillar);

        const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.4), archMaterial);
        lintel.position.set(0, 2.15, 0);
        propGroup.add(lintel);

        const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.05), accentMaterial);
        glowStrip.position.set(0, 1.95, 0.2);
        propGroup.add(glowStrip);

        const pathMaterial = new THREE.MeshBasicMaterial({
          color: station.accentColorHex,
          transparent: true,
          opacity: 0.16,
        });
        const path = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 5.5), pathMaterial);
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.01, 3.2);
        propGroup.add(path);
        break;
      }
    }

    return { group: propGroup, accentMaterial, baseMaterial };
  }

  private buildLabel(station: CampStationDefinition, locked: boolean): THREE.Sprite {
    const texture = createLabelTexture(this.labelText(station, locked), station.accentColor);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.2, 0.7, 1);
    sprite.position.y = 2.3;
    sprite.renderOrder = 10;
    return sprite;
  }

  private labelText(station: CampStationDefinition, locked: boolean): string {
    return locked ? `${station.label} · ЗАКРЫТО` : station.label;
  }

  public setStationLocked(id: CampStationId, locked: boolean): void {
    const visual = this.stations.get(id);
    if (!visual || visual.locked === locked) return;

    visual.locked = locked;
    visual.baseOpacity = locked ? 0.18 : 0.5;

    const dim = locked ? 0.4 : 1;
    visual.baseMaterial.emissiveIntensity = 0.18 * dim;
    visual.accentMaterial.emissiveIntensity = 0.6 * dim;

    const material = visual.label.material as THREE.SpriteMaterial;
    const oldTexture = material.map;
    const texture = createLabelTexture(
      this.labelText(visual.definition, locked),
      visual.definition.accentColor
    );
    material.map = texture;
    material.needsUpdate = true;
    oldTexture?.dispose();
  }

  public setWeaponUnlocks(unlockedFlags: boolean[]): void {
    for (let i = 0; i < this.weaponBarrelMaterials.length; i++) {
      const unlocked = unlockedFlags[i] ?? false;
      this.weaponBarrelMaterials[i].emissiveIntensity = unlocked ? 0.6 : 0.15;
    }
  }

  public setGateLabel(id: CampStationId, text: string): void {
    const visual = this.stations.get(id);
    if (!visual) return;

    const material = visual.label.material as THREE.SpriteMaterial;
    const oldTexture = material.map;
    const texture = createLabelTexture(text, visual.definition.accentColor);
    material.map = texture;
    material.needsUpdate = true;
    oldTexture?.dispose();
  }

  public resetGateLabel(id: CampStationId): void {
    const visual = this.stations.get(id);
    if (!visual) return;
    this.setGateLabel(id, this.labelText(visual.definition, visual.locked));
  }

  public setHovered(id: CampStationId | null): void {
    for (const [stationId, visual] of this.stations) {
      visual.hovered = stationId === id;
    }
  }

  public setActiveStation(id: CampStationId | null): void {
    for (const [stationId, visual] of this.stations) {
      visual.active = stationId === id;
    }
  }

  public isStationLocked(id: CampStationId): boolean {
    return this.stations.get(id)?.locked ?? true;
  }

  public update(delta: number, camera: THREE.Camera): void {
    if (!this.group.visible) return;
    this.elapsed += delta;

    const flicker =
      1 +
      Math.sin(this.elapsed * CAMP_SCENE.FIRE_FLICKER_SPEED) * CAMP_SCENE.FIRE_FLICKER_AMOUNT * 0.3 +
      (Math.random() - 0.5) * CAMP_SCENE.FIRE_FLICKER_AMOUNT * 0.4;
    this.fireLight.intensity = CAMP_SCENE.FIRE_LIGHT_INTENSITY * Math.max(0.4, flicker);

    this.updateEmbers(delta);

    for (const visual of this.stations.values()) {
      if (!visual.locked) {
        const pulse = Math.sin(this.elapsed * 2 + visual.phase) * 0.1;
        visual.padMaterial.opacity = visual.baseOpacity + pulse;
      } else {
        visual.padMaterial.opacity = visual.baseOpacity;
      }

      if (visual.hovered || visual.active) {
        visual.padMaterial.opacity = Math.min(1, visual.padMaterial.opacity + 0.25);
      }

      const targetScale = visual.hovered || visual.active ? 1.08 : 1;
      visual.scale += (targetScale - visual.scale) * Math.min(1, delta * 8);
      visual.stationGroup.scale.setScalar(visual.scale);
    }

    for (const object of this.spinning) {
      object.rotation.y += delta * 0.6;
    }

    this.character.position.y = this.characterBaseY + Math.sin(this.elapsed * 1.4) * 0.03;
    const breathScale = 1 + Math.sin(this.elapsed * 1.4) * 0.015;
    this.character.scale.set(breathScale, 1, 1);

    billboardYAxis(this.character, camera);
  }
}
