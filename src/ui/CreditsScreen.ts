export class CreditsScreen {
  private element: HTMLDivElement;
  private button: HTMLButtonElement;
  private visible = false;

  constructor(container: HTMLElement, onContinue: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'credits-screen';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-label', 'Титры');
    this.element.setAttribute('aria-hidden', 'true');
    this.element.inert = true;
    this.element.innerHTML = `
      <div class="credits-horizon" aria-hidden="true"></div>
      <div class="credits-content">
        <p class="credits-eyebrow">10 / 10 · История завершена</p>
        <h1 class="credits-title">BULLET<br><span>SURVIVOR</span></h1>
        <p class="credits-body">Периметр удержан.<br>У костра нас ещё ждут.</p>
        <div class="credits-divider" aria-hidden="true"></div>
        <dl class="credits-names"><div><dt>Автор проекта</dt><dd>resassance</dd></div><div><dt>Герои истории</dt><dd>Юки &amp; Рен</dd></div></dl>
        <p class="credits-thanks">Спасибо, что прошли этот путь.</p>
        <button class="credits-continue" type="button">Вернуться в лагерь <span aria-hidden="true">→</span></button>
      </div>`;
    this.button = this.element.querySelector('.credits-continue')!;
    this.button.addEventListener('click', () => {
      if (!this.visible) return;
      this.hide();
      onContinue();
    });
    this.element.addEventListener('keydown', event => {
      if (event.code === 'Tab') {
        event.preventDefault();
        this.button.focus();
      }
    });
    container.appendChild(this.element);
  }

  public show(): void {
    this.visible = true;
    this.element.inert = false;
    this.element.setAttribute('aria-hidden', 'false');
    this.element.classList.add('credits-screen--visible');
    this.element.scrollTop = 0;
    this.button.focus({ preventScroll: true });
  }

  public hide(): void {
    this.visible = false;
    this.element.classList.remove('credits-screen--visible');
    this.element.inert = true;
    this.element.setAttribute('aria-hidden', 'true');
  }
}
