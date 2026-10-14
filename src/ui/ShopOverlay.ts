import type { BuffCardDef } from '../gameplay/buffCards';
import { CARD_TUNING } from '../utils/constants';
import { createBuffCardElement } from './buffCardElement';

export interface ShopOverlayCallbacks {
  onPurchase: (def: BuffCardDef, offerIndex: number) => void;
  onContinue: () => void;
}

export class ShopOverlay {
  private element: HTMLDivElement;
  private balanceElement: HTMLDivElement;
  private itemsContainer: HTMLDivElement;
  private continueButton: HTMLButtonElement;
  private callbacks: ShopOverlayCallbacks;
  private offers: BuffCardDef[] = [];
  private purchasedOffers: Set<number> = new Set();
  private balance = 0;

  constructor(container: HTMLElement, callbacks: ShopOverlayCallbacks) {
    this.callbacks = callbacks;

    this.element = document.createElement('div');
    this.element.className = 'shop-screen';
    this.element.innerHTML = `
      <div class="shop-content">
        <h1 class="shop-title">торговец</h1>
        <div class="shop-balance"></div>
        <div class="buff-card-grid"></div>
        <button type="button" class="shop-continue">дальше</button>
      </div>
    `;

    this.balanceElement = this.element.querySelector('.shop-balance') as HTMLDivElement;
    this.itemsContainer = this.element.querySelector('.buff-card-grid') as HTMLDivElement;
    this.continueButton = this.element.querySelector('.shop-continue') as HTMLButtonElement;
    this.continueButton.addEventListener('click', () => this.callbacks.onContinue());

    container.appendChild(this.element);
  }

  public show(offers: BuffCardDef[], balance: number): void {
    this.offers = offers;
    this.purchasedOffers = new Set();
    this.balance = balance;
    this.render();
    this.element.classList.add('shop-screen--visible');
  }

  public setBalance(balance: number): void {
    this.balance = balance;
    this.render();
  }

  public markPurchased(offerIndex: number): void {
    this.purchasedOffers.add(offerIndex);
    this.render();
  }

  public hide(): void {
    this.element.classList.remove('shop-screen--visible');
  }

  private render(): void {
    this.balanceElement.textContent = `◆ ${this.balance}`;
    this.itemsContainer.innerHTML = '';

    this.offers.forEach((def, index) => {
      const price = CARD_TUNING.TIER_PRICES[def.tier] ?? 0;
      const isPurchased = this.purchasedOffers.has(index);
      const canAfford = this.balance >= price;

      const card = createBuffCardElement({
        type: def.type,
        tier: def.tier,
        name: def.name,
        description: def.description,
        badge: isPurchased ? 'куплено' : `◆ ${price}`,
        disabled: isPurchased || !canAfford,
        onActivate: () => this.callbacks.onPurchase(def, index),
      });

      this.itemsContainer.appendChild(card);
    });
  }
}
