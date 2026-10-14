import type { BuffCardInstance, BuffType, CardTier } from '../gameplay/buffCards';
import type { FusionGroup } from '../managers/CardManager';
import { createBuffCardElement } from './buffCardElement';

export interface CardsInventoryCallbacks {
  onFuse: (type: BuffType, tier: CardTier) => void;
  onClose: () => void;
}

interface DisplayGroup {
  key: string;
  type: BuffType | 'hybrid';
  name: string;
  description: string;
  tier: CardTier;
  count: number;
  fusable: boolean;
}

export class CardsInventoryOverlay {
  private element: HTMLDivElement;
  private listContainer: HTMLDivElement;
  private closeButton: HTMLButtonElement;
  private callbacks: CardsInventoryCallbacks;

  constructor(container: HTMLElement, callbacks: CardsInventoryCallbacks) {
    this.callbacks = callbacks;

    this.element = document.createElement('div');
    this.element.className = 'shop-screen';
    this.element.innerHTML = `
      <div class="shop-content">
        <h1 class="shop-title">карточки</h1>
        <div class="buff-card-grid"></div>
        <button type="button" class="shop-continue">закрыть</button>
      </div>
    `;

    this.listContainer = this.element.querySelector('.buff-card-grid') as HTMLDivElement;
    this.closeButton = this.element.querySelector('.shop-continue') as HTMLButtonElement;
    this.closeButton.addEventListener('click', () => this.callbacks.onClose());

    container.appendChild(this.element);
  }

  public show(cards: BuffCardInstance[], fusionGroups: FusionGroup[]): void {
    this.render(cards, fusionGroups);
    this.element.classList.add('shop-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('shop-screen--visible');
  }

  private render(cards: BuffCardInstance[], fusionGroups: FusionGroup[]): void {
    this.listContainer.innerHTML = '';

    if (cards.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'shop-item-description';
      empty.textContent = 'Пока нет карточек.';
      this.listContainer.appendChild(empty);
      return;
    }

    const groups = new Map<string, DisplayGroup>();
    for (const card of cards) {
      const key = `${card.type}_${card.tier}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(key, {
          key,
          type: card.type,
          name: card.name,
          description: card.description,
          tier: card.tier,
          count: 1,
          fusable: false,
        });
      }
    }

    for (const group of fusionGroups) {
      const key = `${group.type}_${group.tier}`;
      const display = groups.get(key);
      if (display) display.fusable = true;
    }

    for (const group of groups.values()) {
      const fusionGroup = fusionGroups.find((g) => `${g.type}_${g.tier}` === group.key);

      const card = createBuffCardElement({
        type: group.type,
        tier: group.tier,
        name: group.name,
        description: group.description,
        badge: group.fusable ? `×${group.count} собрать` : `×${group.count}`,
        onActivate: fusionGroup
          ? () => this.callbacks.onFuse(fusionGroup.type, fusionGroup.tier)
          : undefined,
      });

      this.listContainer.appendChild(card);
    }
  }
}
