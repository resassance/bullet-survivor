import { createCharacterPoseTexture } from '../utils/characterSprite';
import { WEAPONS } from '../gameplay/weapons';
import { SPECIAL_WEAPONS, type SpecialWeaponId } from '../gameplay/specialWeapons';
import { type CampStationId, findCampStation } from '../gameplay/campStations';

export interface CampScreenCallbacks {
  onWeaponSelected: (weaponId: string) => void;
  onSpecialSelected: (specialId: SpecialWeaponId | null) => void;
  onArchiveOpen: () => void;
  onPanelClosed: () => void;
}

export class CampScreen {
  private element: HTMLDivElement;
  private primaryButton: HTMLButtonElement;
  private panel: HTMLDivElement;
  private panelTitle: HTMLDivElement;
  private panelBody: HTMLDivElement;
  private weaponButtons: Map<string, HTMLButtonElement> = new Map();
  private specialButtons: Map<string, HTMLButtonElement> = new Map();
  private selectedWeaponId = 'standard';
  private selectedSpecialId: SpecialWeaponId | null = null;
  private callbacks: CampScreenCallbacks;

  constructor(container: HTMLElement, callbacks: CampScreenCallbacks) {
    this.callbacks = callbacks;
    this.element = document.createElement('div');
    this.element.className = 'camp-screen';
    this.element.innerHTML = `
      <div class="camp-topbar">
        <div class="camp-portrait"></div>
        <h1 class="camp-title">лагерь</h1>
      </div>
      <div class="camp-panel">
        <div class="camp-panel-header">
          <div class="camp-panel-title"></div>
          <button type="button" class="camp-panel-close" aria-label="закрыть">×</button>
        </div>
        <div class="camp-panel-body"></div>
      </div>
      <div class="camp-actions">
        <button type="button" class="camp-primary-button"></button>
      </div>
    `;

    const portraitContainer = this.element.querySelector('.camp-portrait') as HTMLDivElement;
    const texture = createCharacterPoseTexture('kneel');
    portraitContainer.appendChild(texture.image as HTMLCanvasElement);

    this.panel = this.element.querySelector('.camp-panel') as HTMLDivElement;
    this.panelTitle = this.element.querySelector('.camp-panel-title') as HTMLDivElement;
    this.panelBody = this.element.querySelector('.camp-panel-body') as HTMLDivElement;

    const closeButton = this.element.querySelector('.camp-panel-close') as HTMLButtonElement;
    closeButton.addEventListener('click', () => this.closePanel());

    this.primaryButton = this.element.querySelector('.camp-primary-button') as HTMLButtonElement;

    container.appendChild(this.element);
  }

  public openStation(id: CampStationId): void {
    if (id === 'archive') {
      this.callbacks.onArchiveOpen();
      return;
    }

    const station = findCampStation(id);
    this.panelTitle.textContent = station.label;
    this.panelBody.innerHTML = '';

    if (id === 'weapon') {
      this.renderWeaponPanel();
    } else if (id === 'special') {
      this.renderSpecialPanel();
    } else {
      this.renderSoonPanel();
    }

    this.panel.classList.add('camp-panel--visible');
  }

  private renderWeaponPanel(): void {
    const row = document.createElement('div');
    row.className = 'camp-weapon-row';
    this.weaponButtons.clear();

    for (const weapon of WEAPONS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'camp-weapon-button';
      button.textContent = weapon.name;
      button.classList.toggle('camp-weapon-button--active', weapon.id === this.selectedWeaponId);
      button.addEventListener('click', () => {
        this.selectedWeaponId = weapon.id;
        this.callbacks.onWeaponSelected(weapon.id);
        this.highlightWeapon(weapon.id);
      });
      this.weaponButtons.set(weapon.id, button);
      row.appendChild(button);
    }

    this.panelBody.appendChild(row);
  }

  private renderSpecialPanel(): void {
    const row = document.createElement('div');
    row.className = 'camp-weapon-row';
    this.specialButtons.clear();

    const noneButton = document.createElement('button');
    noneButton.type = 'button';
    noneButton.className = 'camp-weapon-button';
    noneButton.textContent = 'нет';
    noneButton.classList.toggle('camp-weapon-button--active', this.selectedSpecialId === null);
    noneButton.addEventListener('click', () => {
      this.selectedSpecialId = null;
      this.callbacks.onSpecialSelected(null);
      this.highlightSpecial(null);
    });
    this.specialButtons.set('none', noneButton);
    row.appendChild(noneButton);

    for (const special of SPECIAL_WEAPONS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'camp-weapon-button';
      button.textContent = special.name;
      button.classList.toggle(
        'camp-weapon-button--active',
        special.id === this.selectedSpecialId
      );
      button.addEventListener('click', () => {
        this.selectedSpecialId = special.id;
        this.callbacks.onSpecialSelected(special.id);
        this.highlightSpecial(special.id);
      });
      this.specialButtons.set(special.id, button);
      row.appendChild(button);
    }

    this.panelBody.appendChild(row);
  }

  private renderSoonPanel(): void {
    const notice = document.createElement('div');
    notice.className = 'camp-soon-notice';
    notice.textContent = 'Эта станция ещё строится. Загляните позже.';
    this.panelBody.appendChild(notice);
  }

  private highlightWeapon(weaponId: string): void {
    for (const [id, button] of this.weaponButtons) {
      button.classList.toggle('camp-weapon-button--active', id === weaponId);
    }
  }

  private highlightSpecial(specialId: SpecialWeaponId | null): void {
    for (const [id, button] of this.specialButtons) {
      button.classList.toggle('camp-weapon-button--active', id === (specialId ?? 'none'));
    }
  }

  public closePanel(): void {
    this.panel.classList.remove('camp-panel--visible');
    this.callbacks.onPanelClosed();
  }

  public show(
    primaryLabel: string,
    onPrimary: () => void,
    selectedWeaponId: string,
    selectedSpecialId: SpecialWeaponId | null
  ): void {
    this.selectedWeaponId = selectedWeaponId;
    this.selectedSpecialId = selectedSpecialId;
    this.primaryButton.textContent = primaryLabel;
    this.primaryButton.onclick = onPrimary;
    this.panel.classList.remove('camp-panel--visible');
    this.element.classList.add('camp-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('camp-screen--visible');
    this.panel.classList.remove('camp-panel--visible');
  }
}
