export interface GameOverOptions {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  onAction?: () => void;
}

export class GameOverScreen {
  private element: HTMLDivElement;
  private titleElement: HTMLElement;
  private subtitleElement: HTMLElement;
  private buttonElement: HTMLButtonElement;
  private defaultAction: () => void;
  private currentAction: () => void;

  constructor(container: HTMLElement, onRestart: () => void) {
    this.defaultAction = onRestart;
    this.currentAction = onRestart;

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

    this.titleElement = this.element.querySelector('.game-over-title') as HTMLElement;
    this.subtitleElement = this.element.querySelector('.game-over-subtitle') as HTMLElement;
    this.buttonElement = this.element.querySelector('.game-over-restart') as HTMLButtonElement;
    this.buttonElement.addEventListener('click', () => this.currentAction());
  }

  public show(options?: GameOverOptions): void {
    this.titleElement.textContent = options?.title ?? 'не сегодня';
    this.subtitleElement.textContent = options?.subtitle ?? 'эфириалы забрали ещё одну ночь';
    this.buttonElement.textContent = options?.buttonLabel ?? 'начать заново';
    this.currentAction = options?.onAction ?? this.defaultAction;
    this.element.classList.add('game-over-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('game-over-screen--visible');
  }
}
