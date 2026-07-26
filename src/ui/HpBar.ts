export class HpBar {
  private fillElement: HTMLDivElement;

  constructor(container: HTMLElement) {
    const wrapper = document.createElement('div');
    wrapper.className = 'hp-bar';

    this.fillElement = document.createElement('div');
    this.fillElement.className = 'hp-bar-fill';

    wrapper.appendChild(this.fillElement);
    container.appendChild(wrapper);
  }

  public update(current: number, max: number): void {
    const ratio = Math.max(0, Math.min(1, current / max));
    this.fillElement.style.width = `${ratio * 100}%`;
    this.fillElement.classList.toggle('hp-bar-fill--critical', ratio <= 0.3);
  }
}
