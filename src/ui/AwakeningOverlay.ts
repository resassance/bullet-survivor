import type { BuffCardInstance } from '../gameplay/buffCards';
import { createBuffCardElement } from './buffCardElement';

export interface AwakeningOverlayCallbacks {
  onAwaken: (instanceIdA: string, instanceIdB: string) => void;
  onClose: () => void;
}

export class AwakeningOverlay {
  private element: HTMLDivElement;
  private listContainer: HTMLDivElement;
  private confirmButton: HTMLButtonElement;
  private closeButton: HTMLButtonElement;
  private callbacks: AwakeningOverlayCallbacks;
  private selected: string[] = [];
  private cards: BuffCardInstance[] = [];

  constructor(container: HTMLElement, callbacks: AwakeningOverlayCallbacks) {
    this.callbacks = callbacks;

    this.element = document.createElement('div');
    this.element.className = 'shop-screen';
    this.element.innerHTML = `
      <div class="shop-content">
        <h1 class="shop-title">пробуждение</h1>
        <div class="shop-balance">выберите 2 карты тира 3</div>
        <div class="buff-card-grid"></div>
        <button type="button" class="shop-continue shop-awaken-confirm" disabled>пробудить</button>
        <button type="button" class="shop-continue">закрыть</button>
      </div>
    `;

    this.listContainer = this.element.querySelector('.buff-card-grid') as HTMLDivElement;
    this.confirmButton = this.element.querySelector('.shop-awaken-confirm') as HTMLButtonElement;
    this.closeButton = this.element.querySelectorAll('.shop-continue')[1] as HTMLButtonElement;

    this.confirmButton.addEventListener('click', () => {
      if (this.selected.length === 2) {
        this.callbacks.onAwaken(this.selected[0], this.selected[1]);
      }
    });
    this.closeButton.addEventListener('click', () => this.callbacks.onClose());

    container.appendChild(this.element);
  }

  public show(tierThreeCards: BuffCardInstance[]): void {
    this.cards = tierThreeCards;
    this.selected = [];
    this.render();
    this.element.classList.add('shop-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('shop-screen--visible');
  }

  private toggle(instanceId: string): void {
    if (this.selected.includes(instanceId)) {
      this.selected = this.selected.filter((id) => id !== instanceId);
    } else if (this.selected.length < 2) {
      this.selected.push(instanceId);
    }
    this.render();
  }

  private render(): void {
    this.listContainer.innerHTML = '';
    this.confirmButton.disabled = this.selected.length !== 2;

    for (const card of this.cards) {
      const isSelected = this.selected.includes(card.instanceId);
      const element = createBuffCardElement({
        type: card.type,
        tier: card.tier,
        name: card.name,
        description: card.description,
        badge: isSelected ? 'выбрано' : undefined,
        selected: isSelected,
        onActivate: () => this.toggle(card.instanceId),
      });
      this.listContainer.appendChild(element);
    }
  }
}
