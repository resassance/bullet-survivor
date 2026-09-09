import { createCharacterPoseTexture } from '../utils/characterSprite';
import { WEAPONS } from '../gameplay/weapons';
import { SPECIAL_WEAPONS } from '../gameplay/specialWeapons';
import { type CampStationId, findCampStation } from '../gameplay/campStations';
import {
  WEAPON_UNLOCK_STAGE,
  SPECIAL_UNLOCK_STAGE,
  isWeaponUnlocked,
  isSpecialUnlocked,
  isSpecialStationUnlocked,
  specialStationUnlockStage,
} from '../gameplay/progression';
import { STORY_PROGRESSION } from '../utils/constants';

export interface CampScreenCallbacks {
  onWeaponSelected: (weaponId: string) => void;
  onArchiveOpen: () => void;
  onPanelClosed: () => void;
  isAudioMuted: () => boolean;
  onToggleAudioMuted: () => boolean;
}

export class CampScreen {
  private element: HTMLDivElement;
  private panel: HTMLDivElement;
  private panelTitle: HTMLDivElement;
  private panelBody: HTMLDivElement;
  private infoStage: HTMLDivElement;
  private infoLoadout: HTMLDivElement;
  private infoCurrency: HTMLDivElement;
  private weaponButtons: Map<string, HTMLButtonElement> = new Map();
  private selectedWeaponId = 'standard';
  private currentStage = 1;
  private storyCompleted = false;
  private weaponAutoManaged = false;
  private frozenCurrency = 0;
  private callbacks: CampScreenCallbacks;

  constructor(container: HTMLElement, callbacks: CampScreenCallbacks) {
    this.callbacks = callbacks;
    this.element = document.createElement('div');
    this.element.className = 'camp-screen';
    this.element.innerHTML = `
      <div class="camp-topbar">
        <div class="camp-portrait"></div>
        <div class="camp-topbar-text">
          <h1 class="camp-title">лагерь</h1>
          <div class="camp-info-row">
            <span class="camp-info-stage"></span>
            <span class="camp-info-loadout"></span>
            <span class="camp-info-currency"></span>
          </div>
        </div>
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
    this.infoStage = this.element.querySelector('.camp-info-stage') as HTMLDivElement;
    this.infoLoadout = this.element.querySelector('.camp-info-loadout') as HTMLDivElement;
    this.infoCurrency = this.element.querySelector('.camp-info-currency') as HTMLDivElement;

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
      if (this.storyCompleted) {
        this.panelTitle.textContent = findCampStation('story').label;
        this.panelBody.innerHTML = '';
        this.renderSoonPanel(
          `История завершена (${STORY_PROGRESSION.TOTAL_STAGES}/${STORY_PROGRESSION.TOTAL_STAGES}). Загляните в бесконечный режим.`
        );
        this.panel.classList.add('camp-panel--visible');
      }
      return;
    }

    if (id === 'endless') {
      if (!this.storyCompleted) {
        this.panelTitle.textContent = findCampStation('endless').label;
        this.panelBody.innerHTML = '';
        this.renderSoonPanel(
          `Откроется после прохождения истории (${this.currentStage}/${STORY_PROGRESSION.TOTAL_STAGES}).`
        );
        this.panel.classList.add('camp-panel--visible');
      }
      return;
    }

    const station = findCampStation(id);
    this.panelTitle.textContent = station.label;
    this.panelBody.innerHTML = '';

    if (id === 'weapon') {
      this.renderWeaponPanel();
    } else if (id === 'special') {
      if (isSpecialStationUnlocked(this.currentStage)) {
        this.renderSpecialGallery();
      } else {
        this.renderSoonPanel(`Первое спецоружие станет доступно на ${specialStationUnlockStage()} уровне.`);
      }
    } else if (id === 'settings') {
      this.renderSettingsPanel();
    } else {
      this.renderSoonPanel();
    }

    this.panel.classList.add('camp-panel--visible');
  }

  private renderWeaponPanel(): void {
    if (this.weaponAutoManaged) {
      const intro = document.createElement('p');
      intro.className = 'camp-special-intro';
      intro.textContent =
        'В сюжетном режиме оружие подбирается автоматически по мере разблокировки. Ручной выбор доступен в бесконечном режиме.';
      this.panelBody.appendChild(intro);
    }

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
      button.disabled = !unlocked || this.weaponAutoManaged;

      if (unlocked) {
        button.textContent = weapon.name;
        if (!this.weaponAutoManaged) {
          button.addEventListener('click', () => {
            this.selectedWeaponId = weapon.id;
            this.callbacks.onWeaponSelected(weapon.id);
            this.highlightWeapon(weapon.id);
          });
        }
      } else {
        const unlockStage = WEAPON_UNLOCK_STAGE[weapon.id];
        button.innerHTML = `${weapon.name}<span class="camp-lock-hint">открыто на ${unlockStage} ур.</span>`;
      }

      this.weaponButtons.set(weapon.id, button);
      row.appendChild(button);
    }

    this.panelBody.appendChild(row);
  }

  private renderSpecialGallery(): void {
    const intro = document.createElement('p');
    intro.className = 'camp-special-intro';
    intro.textContent =
      'Спецоружие больше не выбирается вручную: в бесконечном режиме оно достаётся случайно, когда заполняется шкала «Переполнение», а в сюжете проявляет себя в финале.';
    this.panelBody.appendChild(intro);

    const list = document.createElement('div');
    list.className = 'camp-special-gallery';

    for (const special of SPECIAL_WEAPONS) {
      const unlocked = isSpecialUnlocked(special.id, this.currentStage);
      const entry = document.createElement('div');
      entry.className = 'camp-special-entry';
      entry.classList.toggle('camp-special-entry--locked', !unlocked);

      const name = document.createElement('div');
      name.className = 'camp-special-name';
      name.textContent = unlocked
        ? special.name
        : `${special.name} · открыто на ${SPECIAL_UNLOCK_STAGE[special.id]} ур.`;
      entry.appendChild(name);

      const desc = document.createElement('div');
      desc.className = 'camp-special-desc';
      desc.textContent = special.description;
      entry.appendChild(desc);

      list.appendChild(entry);
    }

    this.panelBody.appendChild(list);
  }

  private renderSettingsPanel(): void {
    const row = document.createElement('div');
    row.className = 'camp-settings-row';

    const label = document.createElement('span');
    label.className = 'camp-settings-label';
    label.textContent = 'Звук';
    row.appendChild(label);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'camp-settings-toggle';
    const applyToggleState = (muted: boolean) => {
      toggle.textContent = muted ? 'выкл' : 'вкл';
      toggle.classList.toggle('camp-settings-toggle--off', muted);
    };
    applyToggleState(this.callbacks.isAudioMuted());
    toggle.addEventListener('click', () => {
      const muted = this.callbacks.onToggleAudioMuted();
      applyToggleState(muted);
    });
    row.appendChild(toggle);

    this.panelBody.appendChild(row);
  }

  private renderSoonPanel(message?: string): void {
    const notice = document.createElement('div');
    notice.className = 'camp-soon-notice';
    notice.textContent = message ?? 'Эта станция ещё строится. Загляните позже.';
    this.panelBody.appendChild(notice);
  }

  private updateInfoRow(): void {
    this.infoStage.textContent = this.storyCompleted
      ? `ИСТОРИЯ ЗАВЕРШЕНА · ${STORY_PROGRESSION.TOTAL_STAGES}/${STORY_PROGRESSION.TOTAL_STAGES}`
      : `УРОВЕНЬ ${this.currentStage}/${STORY_PROGRESSION.TOTAL_STAGES}`;
    const weaponName = WEAPONS.find((weapon) => weapon.id === this.selectedWeaponId)?.name ?? '';
    this.infoLoadout.textContent = weaponName;
    this.infoCurrency.textContent = `◆ ${this.frozenCurrency}`;
  }

  private highlightWeapon(weaponId: string): void {
    for (const [id, button] of this.weaponButtons) {
      button.classList.toggle('camp-weapon-button--active', id === weaponId);
    }
    this.updateInfoRow();
  }

  public closePanel(): void {
    this.panel.classList.remove('camp-panel--visible');
    this.callbacks.onPanelClosed();
  }

  public show(
    selectedWeaponId: string,
    currentStage: number,
    storyCompleted = false,
    weaponAutoManaged = false,
    frozenCurrency = 0
  ): void {
    this.selectedWeaponId = selectedWeaponId;
    this.currentStage = currentStage;
    this.storyCompleted = storyCompleted;
    this.weaponAutoManaged = weaponAutoManaged;
    this.frozenCurrency = frozenCurrency;
    this.updateInfoRow();
    this.panel.classList.remove('camp-panel--visible');
    this.element.classList.add('camp-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('camp-screen--visible');
    this.panel.classList.remove('camp-panel--visible');
  }
}
