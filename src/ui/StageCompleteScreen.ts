export class StageCompleteScreen {
  private element: HTMLDivElement;
  private titleElement: HTMLHeadingElement;

  constructor(container: HTMLElement, onContinue: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'stage-complete-screen';
    this.element.innerHTML = `
      <div class="stage-complete-content">
        <h1 class="stage-complete-title"></h1>
        <p class="stage-complete-subtitle">зона зачищена</p>
        <button class="stage-complete-continue" type="button">продолжить</button>
      </div>
    `;

    this.titleElement = this.element.querySelector(
      '.stage-complete-title'
    ) as HTMLHeadingElement;

    container.appendChild(this.element);

    const button = this.element.querySelector(
      '.stage-complete-continue'
    ) as HTMLButtonElement;
    button.addEventListener('click', onContinue);
  }

  public show(clearedStage: number): void {
    this.titleElement.textContent = `уровень ${clearedStage} пройден`;
    this.element.classList.add('stage-complete-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('stage-complete-screen--visible');
  }
}
