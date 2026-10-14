import type { BuffCardDef } from '../gameplay/buffCards';
import { createBuffCardElement } from './buffCardElement';

export class WaveRewardOverlay {
  private element: HTMLDivElement;
  private cardsContainer: HTMLDivElement;
  private onPick: (def: BuffCardDef) => void;

  constructor(container: HTMLElement, onPick: (def: BuffCardDef) => void) {
    this.onPick = onPick;

    this.element = document.createElement('div');
    this.element.className = 'level-up-screen';
    this.element.innerHTML = `
      <div class="level-up-content">
        <h1 class="level-up-title">волна пройдена</h1>
        <div class="buff-card-grid"></div>
      </div>
    `;

    this.cardsContainer = this.element.querySelector('.buff-card-grid') as HTMLDivElement;

    container.appendChild(this.element);
  }

  public show(defs: BuffCardDef[]): void {
    this.cardsContainer.innerHTML = '';

    for (const def of defs) {
      const card = createBuffCardElement({
        type: def.type,
        tier: def.tier,
        name: def.name,
        description: def.description,
        onActivate: () => this.onPick(def),
      });
      this.cardsContainer.appendChild(card);
    }

    this.element.classList.add('level-up-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('level-up-screen--visible');
  }
}
