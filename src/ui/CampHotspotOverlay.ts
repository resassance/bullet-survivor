import * as THREE from 'three';
import weaponIcon from '@phosphor-icons/core/assets/regular/crosshair.svg';
import archiveIcon from '@phosphor-icons/core/assets/regular/file-text.svg';
import endlessIcon from '@phosphor-icons/core/assets/regular/infinity.svg';
import specialIcon from '@phosphor-icons/core/assets/regular/lightning.svg';
import settingsIcon from '@phosphor-icons/core/assets/regular/gear-six.svg';
import storyIcon from '@phosphor-icons/core/assets/regular/door-open.svg';
import { CAMP_STATIONS, type CampStationId, type CampStationState } from '../gameplay/campStations';

export interface CampHotspotCallbacks {
  onSelect: (id: CampStationId) => void;
  onHover: (id: CampStationId | null) => void;
}

const STATION_ICONS: Record<CampStationId, string> = {
  weapon: weaponIcon, archive: archiveIcon, endless: endlessIcon,
  special: specialIcon, settings: settingsIcon, story: storyIcon,
};

export class CampHotspotOverlay {
  private element: HTMLDivElement;
  private buttons = new Map<CampStationId, HTMLButtonElement>();
  private labels = new Map<CampStationId, HTMLSpanElement>();
  private statusLabels = new Map<CampStationId, HTMLSpanElement>();
  private visible = false;
  private projected = new THREE.Vector3();
  private cameraPoint = new THREE.Vector3();

  constructor(container: HTMLElement, callbacks: CampHotspotCallbacks) {
    this.element = document.createElement('div');
    this.element.className = 'camp-hotspots';
    this.element.setAttribute('aria-label', 'Станции лагеря');
    this.element.inert = true;

    // Put the story entrance first in keyboard and compact-layout navigation.
    const stations = [...CAMP_STATIONS].sort((a, b) => Number(b.id === 'story') - Number(a.id === 'story'));
    for (const station of stations) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'camp-hotspot';
      button.classList.toggle('camp-hotspot--primary', station.id === 'story');
      button.dataset.station = station.id;
      button.style.setProperty('--station-color', station.accentColor);
      button.style.setProperty('--station-icon', 'url("' + STATION_ICONS[station.id] + '")');

      const label = document.createElement('span');
      label.className = 'camp-hotspot-label';
      label.textContent = station.label;
      const status = document.createElement('span');
      status.className = 'camp-hotspot-status';
      button.append(label, status);
      button.addEventListener('click', () => callbacks.onSelect(station.id));
      button.addEventListener('pointerenter', () => callbacks.onHover(station.id));
      button.addEventListener('pointerleave', () => {
        if (!button.matches(':focus-visible')) callbacks.onHover(null);
      });
      button.addEventListener('focus', () => callbacks.onHover(station.id));
      button.addEventListener('blur', () => callbacks.onHover(null));
      this.element.appendChild(button);
      this.buttons.set(station.id, button);
      this.labels.set(station.id, label);
      this.statusLabels.set(station.id, status);
    }
    container.appendChild(this.element);
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.element.inert = !visible;
    this.element.classList.toggle('camp-hotspots--visible', visible);
  }

  public update(
    camera: THREE.PerspectiveCamera,
    container: HTMLElement,
    stations: readonly CampStationState[]
  ): void {
    if (!this.visible) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const compact = width < 760 || width < height;
    this.element.classList.toggle('camp-hotspots--compact', compact);

    for (const station of stations) {
      const button = this.buttons.get(station.id);
      const label = this.labels.get(station.id);
      const status = this.statusLabels.get(station.id);
      if (!button || !label || !status) continue;

      if (label.textContent !== station.label) label.textContent = station.label;
      const statusText = station.locked ? 'ЗАКРЫТО' : '';
      if (status.textContent !== statusText) status.textContent = statusText;
      button.classList.toggle('camp-hotspot--locked', station.locked);
      button.classList.toggle('camp-hotspot--active', station.active);
      button.setAttribute('aria-label', station.label + (station.locked ? ' · закрыто, показать условия открытия' : ''));
      // Locked stations remain usable: clicking explains how to unlock them.
      button.setAttribute('aria-expanded', String(station.active));

      this.cameraPoint.copy(station.anchor).applyMatrix4(camera.matrixWorldInverse);
      this.projected.copy(station.anchor).project(camera);
      const onScreen = this.cameraPoint.z < 0 && this.projected.z >= -1 && this.projected.z <= 1;
      button.hidden = !compact && !onScreen;
      if (compact) {
        button.style.transform = '';
        continue;
      }
      const x = (this.projected.x * 0.5 + 0.5) * width;
      const y = (-this.projected.y * 0.5 + 0.5) * height;
      const halfWidth = button.offsetWidth / 2;
      const halfHeight = button.offsetHeight / 2;
      const safeX = THREE.MathUtils.clamp(x, halfWidth + 12, width - halfWidth - 12);
      const safeY = THREE.MathUtils.clamp(y, halfHeight + 12, height - halfHeight - 12);
      button.style.transform = 'translate(' + Math.round(safeX) + 'px, ' + Math.round(safeY) + 'px) translate(-50%, -50%)';
    }
  }
}

