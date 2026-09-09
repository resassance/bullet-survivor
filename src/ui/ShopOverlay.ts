import type { ShopItem } from '../gameplay/shopItems';

export interface ShopOverlayCallbacks {
  onPurchase: (item: ShopItem) => void;
  onContinue: () => void;
}

export class ShopOverlay {
  private element: HTMLDivElement;
  private balanceElement: HTMLDivElement;
  private itemsContainer: HTMLDivElement;
  private continueButton: HTMLButtonElement;
  private callbacks: ShopOverlayCallbacks;
  private items: ShopItem[] = [];
  private purchased: Set<string> = new Set();
  private balance = 0;

  constructor(container: HTMLElement, callbacks: ShopOverlayCallbacks) {
    this.callbacks = callbacks;

    this.element = document.createElement('div');
    this.element.className = 'shop-screen';
    this.element.innerHTML = `
      <div class="shop-content">
        <h1 class="shop-title">торговец</h1>
        <div class="shop-balance"></div>
        <div class="shop-items"></div>
        <button type="button" class="shop-continue">дальше</button>
      </div>
    `;

    this.balanceElement = this.element.querySelector('.shop-balance') as HTMLDivElement;
    this.itemsContainer = this.element.querySelector('.shop-items') as HTMLDivElement;
    this.continueButton = this.element.querySelector('.shop-continue') as HTMLButtonElement;
    this.continueButton.addEventListener('click', () => this.callbacks.onContinue());

    container.appendChild(this.element);
  }

  public show(items: ShopItem[], balance: number, purchased: Set<string>): void {
    this.items = items;
    this.balance = balance;
    this.purchased = purchased;
    this.render();
    this.element.classList.add('shop-screen--visible');
  }

  public setBalance(balance: number): void {
    this.balance = balance;
    this.render();
  }

  public hide(): void {
    this.element.classList.remove('shop-screen--visible');
  }

  private render(): void {
    this.balanceElement.textContent = `◆ ${this.balance}`;
    this.itemsContainer.innerHTML = '';

    for (const item of this.items) {
      const isPurchased = this.purchased.has(item.id);
      const canAfford = this.balance >= item.price;

      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `
        <div class="shop-item-text">
          <span class="shop-item-name">${item.name}</span>
          <span class="shop-item-description">${item.description}</span>
        </div>
        <button type="button" class="shop-item-buy" ${isPurchased || !canAfford ? 'disabled' : ''}>
          ${isPurchased ? 'куплено' : `◆ ${item.price}`}
        </button>
      `;

      const buyButton = row.querySelector('.shop-item-buy') as HTMLButtonElement;
      buyButton.addEventListener('click', () => this.callbacks.onPurchase(item));

      this.itemsContainer.appendChild(row);
    }
  }
}
