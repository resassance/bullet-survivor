import * as THREE from 'three';
import { CAMP_STATIONS, type CampStationDefinition, type CampStationId, type CampStationState } from '../gameplay/campStations';
import { CAMP_LAYOUT, CAMP_GROUND } from '../gameplay/campLayout';
import { createCampCutout } from './CampCutout';
import { WEAPONS } from '../gameplay/weapons';
import { CAMP_SCENE, CAMP_CAMERA } from '../utils/constants';
import { tryLoadTiledTexture } from '../utils/textureLoader';
import { ATMOSPHERE, CAMP_LIGHT, fireFlicker } from './lightingProfiles';

interface StationVisual {
  definition: CampStationDefinition;
  stationGroup: THREE.Group;
  pad: THREE.Mesh;
  padMaterial: THREE.MeshBasicMaterial;
  label: string;
  accentMaterial: THREE.MeshStandardMaterial;
  baseMaterial: THREE.MeshStandardMaterial;
  locked: boolean;
  hovered: boolean;
  active: boolean;
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
  private fireLight: THREE.PointLight;
  private character: THREE.Group;
  private backdrop: THREE.Group;
  private flame: THREE.Group = new THREE.Group();
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
    this.backdrop = createCampCutout(CAMP_LAYOUT.backdrop.asset);
    this.backdrop.position.copy(CAMP_LAYOUT.backdrop.position);
    this.group.add(this.backdrop);
    const foreground = createCampCutout(CAMP_LAYOUT.foregroundSupplies.asset, this.buildCrates());
    foreground.position.copy(CAMP_LAYOUT.foregroundSupplies.position);
    this.group.add(foreground);
    this.buildLighting();
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
    const companion = this.buildCharacter(true);
    companion.position.copy(CAMP_LAYOUT.companion.position);
    this.group.add(companion);
  }

  private buildFloor(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(60, 50);
    const material = new THREE.MeshStandardMaterial({
      color: 0x343b3c,
      roughness: 0.95,
      metalness: 0,
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.02, 0);
    floor.receiveShadow = true;

    if (CAMP_GROUND.texturePath) tryLoadTiledTexture(CAMP_GROUND.texturePath, CAMP_GROUND.repeatX, CAMP_GROUND.repeatY, (texture) => {
      material.map = texture;
      material.color.setHex(0xffffff);
      material.needsUpdate = true;
    });

    return floor;
  }

  private buildLighting(): void {
    const profile = ATMOSPHERE.camp;
    this.group.add(new THREE.HemisphereLight(profile.sky, profile.ground, profile.fill));
    const moon = new THREE.DirectionalLight(profile.moon, profile.moonIntensity);
    moon.position.set(-6, 12, -8);
    this.group.add(moon);

    const gate = CAMP_STATIONS.find(station => station.id === 'story')!;
    const light = new THREE.PointLight(CAMP_LIGHT.gateColor, CAMP_LIGHT.gateIntensity, 10, 2);
    light.position.set(gate.propPosition.x, 4.6, gate.propPosition.z + 0.8);
    this.group.add(light);
  }

  private buildCampfire(): THREE.PointLight {
    const fireGroup = new THREE.Group();

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
      color: new THREE.Color(3.8, 1.2, 0.18),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 8), glowMaterial);
    glow.position.y = 0.3;
    fireGroup.add(glow);

    const light = new THREE.PointLight(
      CAMP_LIGHT.fireColor,
      CAMP_LIGHT.fireIntensity,
      CAMP_LIGHT.fireDistance,
      2
    );
    light.position.set(
      CAMP_LAYOUT.fire.position.x,
      CAMP_LAYOUT.fire.position.y + CAMP_LIGHT.fireHeight,
      CAMP_LAYOUT.fire.position.z
    );
    // Only the fire casts camp shadows; distant fill lights stay inexpensive.
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = CAMP_LIGHT.fireDistance;
    light.shadow.bias = -0.0003;
    light.shadow.normalBias = 0.025;
    fireGroup.add(light);

    fireGroup.remove(glow, light);
    const base = createCampCutout(CAMP_LAYOUT.fire.asset, fireGroup);
    // Fallback geometry is local to the same bottom-center pivot as future art.
    fireGroup.position.set(0, 0, 0);
    base.position.copy(CAMP_LAYOUT.fire.position);
    this.flame = createCampCutout(CAMP_LAYOUT.flame.asset, glow);
    this.flame.position.copy(CAMP_LAYOUT.flame.position);
    this.group.add(base, this.flame, light);
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
    slot.x = CAMP_LAYOUT.fire.position.x + (Math.random() - 0.5) * 0.3;
    slot.y = CAMP_LAYOUT.flame.position.y + 0.5;
    slot.z = CAMP_LAYOUT.fire.position.z + (Math.random() - 0.5) * 0.3;
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

  private buildCharacter(companion = false): THREE.Group {
    const definition = companion ? CAMP_LAYOUT.companion : CAMP_LAYOUT.character;
    const material = new THREE.MeshStandardMaterial({ color: companion ? 0x819d91 : 0x9988ad, roughness: 1 });
    const figure = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), material);
    head.position.y = 1.25;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.35), material);
    body.position.y = 0.72;
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.65), material);
    legs.position.set(0, 0.25, 0.15);
    figure.add(head, body, legs);
    const group = createCampCutout(definition.asset, figure);
    group.position.copy(definition.position);
    return group;
  }

  private buildCrates(): THREE.Group {
    const material = new THREE.MeshStandardMaterial({ color: 0x52504a, roughness: 1 });
    const group = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), material);
      crate.position.set((i % 2) * 0.55, 0.25 + Math.floor(i / 2) * 0.55, 0);
      group.add(crate);
    }
    return group;
  }

  private buildProgressDecor(): void {
    const bannerMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2416,
      roughness: 0.8,
    });
    const banner = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), bannerMaterial);
    pole.position.y = 1.2;
    banner.add(pole);
    const fabric = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), bannerMaterial);
    fabric.position.set(0.32, 2.05, 0);
    banner.add(fabric);
    const flag = createCampCutout(CAMP_LAYOUT.flag.asset, banner);
    flag.position.copy(CAMP_LAYOUT.flag.position);
    flag.visible = false;
    this.group.add(flag);
    this.progressDecor.push({ stage: CAMP_LAYOUT.flag.unlockStage, object: flag });

    const crateMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c1f12,
      roughness: 0.85,
    });
    const crates = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), crateMaterial);
      crate.position.set((i % 2) * 0.55, 0.25 + Math.floor(i / 2) * 0.55, 0);
      crates.add(crate);
    }
    const supplies = createCampCutout(CAMP_LAYOUT.supplies.asset, crates);
    supplies.position.copy(CAMP_LAYOUT.supplies.position);
    supplies.visible = false;
    this.group.add(supplies);
    this.progressDecor.push({ stage: CAMP_LAYOUT.supplies.unlockStage, object: supplies });
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

    const { pad, material: padMaterial } = this.buildPad(station);
    stationGroup.add(pad);

    const { group: propGroup, accentMaterial, baseMaterial } = this.buildProp(station);
    stationGroup.add(createCampCutout(station.asset, propGroup));

    this.group.add(stationGroup);

    this.stations.set(station.id, {
      definition: station,
      stationGroup,
      pad,
      padMaterial,
      label: station.label,
      accentMaterial,
      baseMaterial,
      locked: !station.ready,
      hovered: false,
      active: false,
    });
  }

  private buildPad(
    station: CampStationDefinition
  ): { pad: THREE.Mesh; material: THREE.MeshBasicMaterial } {
    const geometry = new THREE.CircleGeometry(station.asset.width * 0.4, 32);
    const material = new THREE.MeshBasicMaterial({
      color: station.accentColorHex,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const pad = new THREE.Mesh(geometry, material);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.02;
    return { pad, material };
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
      color: 0x353a43,
      roughness: 0.75,
      metalness: 0.15,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: station.accentColorHex,
      roughness: 0.35,
      metalness: 0.3,
      emissive: new THREE.Color(station.accentColorHex),
      emissiveIntensity: 0.22 * dim,
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
            emissiveIntensity: 0.22,
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
          new THREE.BoxGeometry(1.7, 0.85, 0.6),
          baseMaterial
        );
        pedestal.position.y = 0.45;
        propGroup.add(pedestal);
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.04), accentMaterial);
        core.position.set(0, 0.6, 0.32);
        propGroup.add(core);
        break;
      }
      case 'settings': {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.2), baseMaterial);
        panel.position.y = 0.85;
        propGroup.add(panel);
        const dial = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 20), accentMaterial);
        dial.position.set(0, 0.9, 0.15);
        propGroup.add(dial);
        break;
      }
      case 'story': {
        const archMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a1006,
          roughness: 0.6,
          metalness: 0.25,
        });
        const pillarGeometry = new THREE.BoxGeometry(0.35, 4.1, 0.35);
        const leftPillar = new THREE.Mesh(pillarGeometry, archMaterial);
        leftPillar.position.set(-1.9, 2.05, 0);
        propGroup.add(leftPillar);
        const rightPillar = new THREE.Mesh(pillarGeometry, archMaterial);
        rightPillar.position.set(1.9, 2.05, 0);
        propGroup.add(rightPillar);

        const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 0.4), archMaterial);
        lintel.position.set(0, 4.15, 0);
        propGroup.add(lintel);

        const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 0.05), accentMaterial);
        glowStrip.position.set(0, 3.95, 0.2);
        propGroup.add(glowStrip);

        const pathMaterial = new THREE.MeshBasicMaterial({
          color: station.accentColorHex,
          transparent: true,
          opacity: 0.05,
        });
        const path = new THREE.Mesh(new THREE.PlaneGeometry(2, 7.5), pathMaterial);
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.01, 4.2);
        propGroup.add(path);
        break;
      }
    }

    return { group: propGroup, accentMaterial, baseMaterial };
  }

  public setStationLocked(id: CampStationId, locked: boolean): void {
    const visual = this.stations.get(id);
    if (!visual || visual.locked === locked) return;

    visual.locked = locked;

    const dim = locked ? 0.4 : 1;
    visual.accentMaterial.emissiveIntensity = 0.22 * dim;

  }

  public setWeaponUnlocks(unlockedFlags: boolean[]): void {
    for (let i = 0; i < this.weaponBarrelMaterials.length; i++) {
      const unlocked = unlockedFlags[i] ?? false;
      this.weaponBarrelMaterials[i].emissiveIntensity = unlocked ? 0.22 : 0.05;
    }
  }

  public setGateLabel(id: CampStationId, text: string): void {
    const visual = this.stations.get(id);
    if (!visual) return;

    visual.label = text;
  }

  public resetGateLabel(id: CampStationId): void {
    const visual = this.stations.get(id);
    if (!visual) return;
    this.setGateLabel(id, visual.definition.label);
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

  public getStationStates(): CampStationState[] {
    this.group.updateMatrixWorld(true);
    return Array.from(this.stations.values(), (visual) => ({
      id: visual.definition.id,
      label: visual.label,
      locked: visual.locked,
      active: visual.active,
      anchor: visual.stationGroup.localToWorld(new THREE.Vector3(0, visual.definition.labelHeight, 0)),
    }));
  }

  public update(delta: number, aspect: number): void {
    if (!this.group.visible) return;
    this.elapsed += delta;
    const backdropScale = Math.max(1, CAMP_CAMERA.COMPOSITION_ASPECT / aspect);
    this.backdrop.scale.setScalar(backdropScale);
    this.backdrop.position.y = CAMP_LAYOUT.backdrop.position.y * backdropScale;

    this.fireLight.intensity = CAMP_LIGHT.fireIntensity * fireFlicker(this.elapsed);
    this.flame.scale.y = 1 + Math.sin(this.elapsed * 7) * 0.04;

    this.updateEmbers(delta);

    for (const visual of this.stations.values()) {
      visual.padMaterial.opacity = visual.hovered || visual.active ? 0.04 : 0;
    }

    this.character.position.y = this.characterBaseY + Math.sin(this.elapsed * 1.4) * 0.03;
    const breathScale = 1 + Math.sin(this.elapsed * 1.4) * 0.015;
    this.character.scale.set(breathScale, 1, 1);

  }
}

