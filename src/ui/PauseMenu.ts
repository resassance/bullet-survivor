export class PauseMenu {
  private element: HTMLDivElement;

  constructor(container: HTMLElement, onResume: () => void, onReturnToCamp: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'pause-menu';
    this.element.innerHTML = `
      <div class="pause-menu-content">
        <h1 class="pause-menu-title">пауза</h1>
        <button class="pause-menu-button pause-menu-button--primary" type="button">продолжить</button>
        <button class="pause-menu-button" type="button">вернуться в лагерь</button>
      </div>
    `;

    const [resumeButton, campButton] = Array.from(
      this.element.querySelectorAll('.pause-menu-button')
    ) as HTMLButtonElement[];

    resumeButton.addEventListener('click', onResume);
    campButton.addEventListener('click', onReturnToCamp);

    container.appendChild(this.element);
  }

  public show(): void {
    this.element.classList.add('pause-menu--visible');
  }

  public hide(): void {
    this.element.classList.remove('pause-menu--visible');
  }
}
