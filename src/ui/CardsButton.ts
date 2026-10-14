export class CardsButton {
  private element: HTMLButtonElement;

  constructor(container: HTMLElement, onOpen: () => void) {
    this.element = document.createElement('button');
    this.element.type = 'button';
    this.element.className = 'cards-button';
    this.element.textContent = 'карты';
    this.element.addEventListener('click', onOpen);
    container.appendChild(this.element);
  }

  public setVisible(visible: boolean): void {
    this.element.classList.toggle('cards-button--hidden', !visible);
  }
}
