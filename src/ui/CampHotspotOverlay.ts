import * as THREE from 'three';
import { CAMP_STATIONS, type CampStationId } from '../gameplay/campStations';

export interface CampHotspotCallbacks {
  onSelect: (id: CampStationId) => void;
}

export class CampHotspotOverlay {
  private element: HTMLDivElement;
  private buttons: Map<CampStationId, HTMLButtonElement> = new Map();
  private worldPositions: Map<CampStationId, THREE.Vector3> = new Map();
  private visible = false;
  private projected = new THREE.Vector3();

  constructor(container: HTMLElement, callbacks: CampHotspotCallbacks) {
    this.element = document.createElement('div');
    this.element.className = 'camp-hotspots';

    for (const station of CAMP_STATIONS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'camp-hotspot';
      button.classList.toggle('camp-hotspot--soon', !station.ready);
      button.style.setProperty('--hotspot-color', station.accentColor);
      button.innerHTML = `
        <span class="camp-hotspot-dot"></span>
        <span class="camp-hotspot-label">${station.label}</span>
      `;
      button.addEventListener('click', () => callbacks.onSelect(station.id));

      this.element.appendChild(button);
      this.buttons.set(station.id, button);
      this.worldPositions.set(
        station.id,
        new THREE.Vector3(
          station.propPosition.x,
          station.propPosition.y + 2.3,
          station.propPosition.z
        )
      );
    }

    container.appendChild(this.element);
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.element.classList.toggle('camp-hotspots--visible', visible);
    if (!visible) {
      this.setActiveStation(null);
    }
  }

  public setActiveStation(id: CampStationId | null): void {
    for (const [stationId, button] of this.buttons) {
      button.classList.toggle('camp-hotspot--active', stationId === id);
    }
  }

  public update(camera: THREE.PerspectiveCamera, container: HTMLElement): void {
    if (!this.visible) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    for (const [id, worldPosition] of this.worldPositions) {
      const button = this.buttons.get(id);
      if (!button) continue;

      this.projected.copy(worldPosition).project(camera);
      const behindCamera = this.projected.z > 1;
      const x = (this.projected.x * 0.5 + 0.5) * width;
      const y = (-this.projected.y * 0.5 + 0.5) * height;

      button.style.display = behindCamera ? 'none' : 'flex';
      button.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
  }
}
