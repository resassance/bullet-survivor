export class CurrencyHUD {
  private element: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'currency-hud';
    container.appendChild(this.element);
  }

  public update(amount: number): void {
    this.element.textContent = `◆ ${amount}`;
  }

  public setVisible(visible: boolean): void {
    this.element.classList.toggle('currency-hud--hidden', !visible);
  }
}
