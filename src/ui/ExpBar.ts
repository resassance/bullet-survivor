export class ExpBar {
  private fillElement: HTMLDivElement;
  private levelElement: HTMLDivElement;

  constructor(container: HTMLElement) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exp-bar';

    this.fillElement = document.createElement('div');
    this.fillElement.className = 'exp-bar-fill';
    wrapper.appendChild(this.fillElement);

    this.levelElement = document.createElement('div');
    this.levelElement.className = 'exp-bar-level';
    container.appendChild(this.levelElement);

    container.appendChild(wrapper);
  }

  public update(currentExp: number, expToNextLevel: number, level: number): void {
    const ratio = Math.max(0, Math.min(1, currentExp / expToNextLevel));
    this.fillElement.style.width = `${ratio * 100}%`;
    this.levelElement.textContent = `ур. ${level}`;
  }
}
