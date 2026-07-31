import { createCharacterPoseTexture } from '../utils/characterSprite';
import { WEAPONS } from '../gameplay/weapons';

export interface CampScreenCallbacks {
  onWeaponSelected: (weaponId: string) => void;
  onArchiveOpen: () => void;
}

export class CampScreen {
  private element: HTMLDivElement;
  private primaryButton: HTMLButtonElement;
  private weaponButtons: Map<string, HTMLButtonElement> = new Map();

  constructor(container: HTMLElement, callbacks: CampScreenCallbacks) {
    this.element = document.createElement('div');
    this.element.className = 'camp-screen';
    this.element.innerHTML = `
      <div class="camp-content">
        <div class="camp-portrait"></div>
        <h1 class="camp-title">лагерь</h1>
        <div class="camp-weapon-row"></div>
        <div class="camp-actions">
          <button type="button" class="camp-secondary-button camp-archive-button">архив</button>
          <button type="button" class="camp-primary-button"></button>
        </div>
      </div>
    `;

    const portraitContainer = this.element.querySelector('.camp-portrait') as HTMLDivElement;
    const texture = createCharacterPoseTexture('kneel');
    portraitContainer.appendChild(texture.image as HTMLCanvasElement);

    const weaponRow = this.element.querySelector('.camp-weapon-row') as HTMLDivElement;
    for (const weapon of WEAPONS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'camp-weapon-button';
      button.textContent = weapon.name;
      button.addEventListener('click', () => {
        callbacks.onWeaponSelected(weapon.id);
        this.highlightWeapon(weapon.id);
      });
      this.weaponButtons.set(weapon.id, button);
      weaponRow.appendChild(button);
    }

    const archiveButton = this.element.querySelector('.camp-archive-button') as HTMLButtonElement;
    archiveButton.addEventListener('click', () => callbacks.onArchiveOpen());

    this.primaryButton = this.element.querySelector('.camp-primary-button') as HTMLButtonElement;

    container.appendChild(this.element);
  }

  private highlightWeapon(weaponId: string): void {
    for (const [id, button] of this.weaponButtons) {
      button.classList.toggle('camp-weapon-button--active', id === weaponId);
    }
  }

  public show(primaryLabel: string, onPrimary: () => void, selectedWeaponId: string): void {
    this.primaryButton.textContent = primaryLabel;
    this.primaryButton.onclick = onPrimary;
    this.highlightWeapon(selectedWeaponId);
    this.element.classList.add('camp-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('camp-screen--visible');
  }
}
