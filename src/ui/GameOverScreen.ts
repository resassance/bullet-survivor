export class GameOverScreen {
  private element: HTMLDivElement;

  constructor(container: HTMLElement, onRestart: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'game-over-screen';
    this.element.innerHTML = `
      <div class="game-over-content">
        <h1 class="game-over-title">не сегодня</h1>
        <p class="game-over-subtitle">эфириалы забрали ещё одну ночь</p>
        <button class="game-over-restart" type="button">начать заново</button>
      </div>
    `;

    container.appendChild(this.element);

    const button = this.element.querySelector(
      '.game-over-restart'
    ) as HTMLButtonElement;
    button.addEventListener('click', onRestart);
  }

  public show(): void {
    this.element.classList.add('game-over-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('game-over-screen--visible');
  }
}
