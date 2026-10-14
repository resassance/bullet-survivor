export class RewardPopup {
  private element: HTMLDivElement;
  private messageElement: HTMLDivElement;
  private confirmButton: HTMLButtonElement;
  private onConfirm: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'shop-screen';
    this.element.innerHTML = `
      <div class="shop-content">
        <h1 class="shop-title">получены застывшие кристаллы</h1>
        <div class="shop-balance"></div>
        <button type="button" class="shop-continue">принято</button>
      </div>
    `;

    this.messageElement = this.element.querySelector('.shop-balance') as HTMLDivElement;
    this.confirmButton = this.element.querySelector('.shop-continue') as HTMLButtonElement;
    this.confirmButton.addEventListener('click', () => this.onConfirm?.());

    container.appendChild(this.element);
  }

  public show(amount: number, onConfirm: () => void): void {
    this.messageElement.textContent = `◆ +${amount}`;
    this.onConfirm = onConfirm;
    this.element.classList.add('shop-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('shop-screen--visible');
  }
}
