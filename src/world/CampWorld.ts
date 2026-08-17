import * as THREE from 'three';
import { CAMP_STATIONS, type CampStationDefinition } from '../gameplay/campStations';
import { createLabelTexture } from '../utils/labelTexture';

interface PadEntry {
  material: THREE.MeshBasicMaterial;
  baseOpacity: number;
  ready: boolean;
  phase: number;
}

export class CampWorld {
  public readonly group: THREE.Group;

  private pads: PadEntry[] = [];
  private spinning: THREE.Object3D[] = [];
  private elapsed = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    for (const station of CAMP_STATIONS) {
      this.buildStation(station);
    }
  }

  private buildStation(station: CampStationDefinition): void {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(
      station.propPosition.x,
      station.propPosition.y,
      station.propPosition.z
    );

    stationGroup.add(this.buildPad(station));
    stationGroup.add(this.buildProp(station));
    stationGroup.add(this.buildLabel(station));

    this.group.add(stationGroup);
  }

  private buildPad(station: CampStationDefinition): THREE.Mesh {
    const geometry = new THREE.RingGeometry(0.9, 1.15, 32);
    const baseOpacity = station.ready ? 0.5 : 0.18;
    const material = new THREE.MeshBasicMaterial({
      color: station.accentColorHex,
      transparent: true,
      opacity: baseOpacity,
      side: THREE.DoubleSide,
    });
    this.pads.push({
      material,
      baseOpacity,
      ready: station.ready,
      phase: Math.random() * Math.PI * 2,
    });

    const pad = new THREE.Mesh(geometry, material);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.02;
    return pad;
  }

  private buildProp(station: CampStationDefinition): THREE.Group {
    const propGroup = new THREE.Group();
    const dim = station.ready ? 1 : 0.4;

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x151225,
      roughness: 0.7,
      metalness: 0.3,
      emissive: new THREE.Color(station.accentColorHex),
      emissiveIntensity: 0.18 * dim,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: station.accentColorHex,
      roughness: 0.35,
      metalness: 0.4,
      emissive: new THREE.Color(station.accentColorHex),
      emissiveIntensity: 0.6 * dim,
    });

    switch (station.id) {
      case 'weapon': {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.7, 0.4), baseMaterial);
        rack.position.y = 0.85;
        propGroup.add(rack);
        for (let i = 0; i < 3; i++) {
          const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8),
            accentMaterial
          );
          barrel.rotation.z = Math.PI / 2;
          barrel.position.set(-0.5 + i * 0.5, 1.3, 0.25);
          propGroup.add(barrel);
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
      case 'skills': {
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
    }

    return propGroup;
  }

  private buildLabel(station: CampStationDefinition): THREE.Sprite {
    const text = station.ready ? station.label : `${station.label} · СКОРО`;
    const texture = createLabelTexture(text, station.accentColor);
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

  public update(delta: number): void {
    if (!this.group.visible) return;
    this.elapsed += delta;

    for (const pad of this.pads) {
      if (!pad.ready) continue;
      const pulse = Math.sin(this.elapsed * 2 + pad.phase) * 0.1;
      pad.material.opacity = pad.baseOpacity + pulse;
    }

    for (const object of this.spinning) {
      object.rotation.y += delta * 0.6;
    }
  }
}
