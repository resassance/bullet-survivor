export class PauseButton {
  private element: HTMLButtonElement;

  constructor(container: HTMLElement, onPause: () => void) {
    this.element = document.createElement('button');
    this.element.type = 'button';
    this.element.className = 'pause-button';
    this.element.textContent = 'II';
    this.element.addEventListener('click', onPause);
    container.appendChild(this.element);
  }

  public setVisible(visible: boolean): void {
    this.element.classList.toggle('pause-button--hidden', !visible);
  }
}
