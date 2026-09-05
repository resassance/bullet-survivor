export class OverflowBar {
  private wrapper: HTMLDivElement;
  private fillElement: HTMLDivElement;
  private labelElement: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'overflow-bar-wrapper';

    this.labelElement = document.createElement('div');
    this.labelElement.className = 'overflow-bar-label';
    this.labelElement.textContent = 'ПЕРЕПОЛНЕНИЕ';
    this.wrapper.appendChild(this.labelElement);

    const bar = document.createElement('div');
    bar.className = 'overflow-bar';
    this.fillElement = document.createElement('div');
    this.fillElement.className = 'overflow-bar-fill';
    bar.appendChild(this.fillElement);
    this.wrapper.appendChild(bar);

    container.appendChild(this.wrapper);
  }

  public update(current: number, max: number): void {
    const ratio = Math.max(0, Math.min(1, current / max));
    this.fillElement.style.width = `${ratio * 100}%`;
    this.wrapper.classList.toggle('overflow-bar-wrapper--full', ratio >= 1);
  }

  public setActiveLabel(name: string | null): void {
    this.labelElement.textContent = name ? `АКТИВНО: ${name.toUpperCase()}` : 'ПЕРЕПОЛНЕНИЕ';
    this.wrapper.classList.toggle('overflow-bar-wrapper--active', Boolean(name));
  }

  public setVisible(visible: boolean): void {
    this.wrapper.classList.toggle('overflow-bar-wrapper--hidden', !visible);
  }
}
