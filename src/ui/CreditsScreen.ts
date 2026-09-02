export class CreditsScreen {
  private element: HTMLDivElement;

  constructor(container: HTMLElement, onContinue: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'credits-screen';
    this.element.innerHTML = `
      <div class="credits-content">
        <h1 class="credits-title">конец пути</h1>
        <p class="credits-body">
          Лагерь удержан. Эфириалы отступили за горизонт — на этот раз.<br />
          Спасибо, что прошли этот путь до конца.
        </p>
        <p class="credits-thanks">bullet-survivor · разработано с любовью</p>
        <button class="credits-continue" type="button">в лагерь</button>
      </div>
    `;

    const button = this.element.querySelector('.credits-continue') as HTMLButtonElement;
    button.addEventListener('click', onContinue);

    container.appendChild(this.element);
  }

  public show(): void {
    this.element.classList.add('credits-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('credits-screen--visible');
  }
}
