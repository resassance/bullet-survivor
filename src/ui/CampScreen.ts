import { createCharacterPoseTexture } from '../utils/characterSprite';
import { WEAPONS } from '../gameplay/weapons';
import { SPECIAL_WEAPONS, type SpecialWeaponId } from '../gameplay/specialWeapons';
import { type CampStationId, findCampStation } from '../gameplay/campStations';
import {
  WEAPON_UNLOCK_STAGE,
  SPECIAL_UNLOCK_STAGE,
  isWeaponUnlocked,
  isSpecialUnlocked,
  isSpecialStationUnlocked,
  specialStationUnlockStage,
} from '../gameplay/progression';

export interface CampScreenCallbacks {
  onWeaponSelected: (weaponId: string) => void;
  onSpecialSelected: (specialId: SpecialWeaponId | null) => void;
  onArchiveOpen: () => void;
  onPanelClosed: () => void;
}

export class CampScreen {
  private element: HTMLDivElement;
  private panel: HTMLDivElement;
  private panelTitle: HTMLDivElement;
  private panelBody: HTMLDivElement;
  private weaponButtons: Map<string, HTMLButtonElement> = new Map();
  private specialButtons: Map<string, HTMLButtonElement> = new Map();
  private selectedWeaponId = 'standard';
  private selectedSpecialId: SpecialWeaponId | null = null;
  private currentStage = 1;
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
    `;

    const portraitContainer = this.element.querySelector('.camp-portrait') as HTMLDivElement;
    const texture = createCharacterPoseTexture('kneel');
    portraitContainer.appendChild(texture.image as HTMLCanvasElement);

    this.panel = this.element.querySelector('.camp-panel') as HTMLDivElement;
    this.panelTitle = this.element.querySelector('.camp-panel-title') as HTMLDivElement;
    this.panelBody = this.element.querySelector('.camp-panel-body') as HTMLDivElement;

    const closeButton = this.element.querySelector('.camp-panel-close') as HTMLButtonElement;
    closeButton.addEventListener('click', () => this.closePanel());

    container.appendChild(this.element);
  }

  public openStation(id: CampStationId): void {
    if (id === 'archive') {
      this.callbacks.onArchiveOpen();
      return;
    }

    if (id === 'story') {
      // The story gate triggers stage progression directly; it has no drawer panel.
      return;
    }

    const station = findCampStation(id);
    this.panelTitle.textContent = station.label;
    this.panelBody.innerHTML = '';

    if (id === 'weapon') {
      this.renderWeaponPanel();
    } else if (id === 'special') {
      if (isSpecialStationUnlocked(this.currentStage)) {
        this.renderSpecialPanel();
      } else {
        this.renderSoonPanel(`Первое спецоружие станет доступно на ${specialStationUnlockStage()} уровне.`);
      }
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
      const unlocked = isWeaponUnlocked(weapon.id, this.currentStage);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'camp-weapon-button';
      button.classList.toggle('camp-weapon-button--active', weapon.id === this.selectedWeaponId);
      button.classList.toggle('camp-weapon-button--locked', !unlocked);
      button.disabled = !unlocked;

      if (unlocked) {
        button.textContent = weapon.name;
        button.addEventListener('click', () => {
          this.selectedWeaponId = weapon.id;
          this.callbacks.onWeaponSelected(weapon.id);
          this.highlightWeapon(weapon.id);
        });
      } else {
        const unlockStage = WEAPON_UNLOCK_STAGE[weapon.id];
        button.innerHTML = `${weapon.name}<span class="camp-lock-hint">открыто на ${unlockStage} ур.</span>`;
      }

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
      const unlocked = isSpecialUnlocked(special.id, this.currentStage);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'camp-weapon-button';
      button.classList.toggle(
        'camp-weapon-button--active',
        special.id === this.selectedSpecialId
      );
      button.classList.toggle('camp-weapon-button--locked', !unlocked);
      button.disabled = !unlocked;

      if (unlocked) {
        button.textContent = special.name;
        button.addEventListener('click', () => {
          this.selectedSpecialId = special.id;
          this.callbacks.onSpecialSelected(special.id);
          this.highlightSpecial(special.id);
        });
      } else {
        const unlockStage = SPECIAL_UNLOCK_STAGE[special.id];
        button.innerHTML = `${special.name}<span class="camp-lock-hint">открыто на ${unlockStage} ур.</span>`;
      }

      this.specialButtons.set(special.id, button);
      row.appendChild(button);
    }

    this.panelBody.appendChild(row);
  }

  private renderSoonPanel(message?: string): void {
    const notice = document.createElement('div');
    notice.className = 'camp-soon-notice';
    notice.textContent = message ?? 'Эта станция ещё строится. Загляните позже.';
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
    selectedWeaponId: string,
    selectedSpecialId: SpecialWeaponId | null,
    currentStage: number
  ): void {
    this.selectedWeaponId = selectedWeaponId;
    this.selectedSpecialId = selectedSpecialId;
    this.currentStage = currentStage;
    this.panel.classList.remove('camp-panel--visible');
    this.element.classList.add('camp-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('camp-screen--visible');
    this.panel.classList.remove('camp-panel--visible');
  }
}
