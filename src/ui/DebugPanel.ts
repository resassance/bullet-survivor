import { WEAPONS } from '../gameplay/weapons';
import { SPECIAL_WEAPONS } from '../gameplay/specialWeapons';
import type { SpecialWeaponId } from '../gameplay/specialWeapons';

export interface DebugPanelCallbacks {
  onWeaponSelected: (weaponId: string) => void;
  onSpecialSelected: (specialId: SpecialWeaponId | null) => void;
  onSkipStage: () => void;
}

export class DebugPanel {
  private element: HTMLDivElement;

  constructor(container: HTMLElement, callbacks: DebugPanelCallbacks) {
    this.element = document.createElement('div');
    this.element.className = 'debug-panel';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'debug-panel-toggle';
    toggle.textContent = 'DEBUG';
    toggle.addEventListener('click', () => {
      this.element.classList.toggle('debug-panel--expanded');
    });

    const body = document.createElement('div');
    body.className = 'debug-panel-body';

    const weaponRow = this.buildRow(
      'оружие',
      WEAPONS.map((weapon) => ({
        label: weapon.name,
        onClick: () => callbacks.onWeaponSelected(weapon.id),
      }))
    );

    const specialOptions = [
      { label: 'нет', onClick: () => callbacks.onSpecialSelected(null) },
      ...SPECIAL_WEAPONS.map((special) => ({
        label: special.name,
        onClick: () => callbacks.onSpecialSelected(special.id),
      })),
    ];
    const specialRow = this.buildRow('спецоружие', specialOptions);

    const stageRow = this.buildRow('уровень', [
      { label: 'пропустить →', onClick: () => callbacks.onSkipStage() },
    ]);

    body.appendChild(weaponRow);
    body.appendChild(specialRow);
    body.appendChild(stageRow);

    this.element.appendChild(toggle);
    this.element.appendChild(body);
    container.appendChild(this.element);
  }

  private buildRow(
    label: string,
    options: { label: string; onClick: () => void }[]
  ): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'debug-panel-row';

    const rowLabel = document.createElement('span');
    rowLabel.className = 'debug-panel-row-label';
    rowLabel.textContent = label;
    row.appendChild(rowLabel);

    for (const option of options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'debug-panel-button';
      button.textContent = option.label;
      button.addEventListener('click', option.onClick);
      row.appendChild(button);
    }

    return row;
  }
}
