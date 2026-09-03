export class ExpBar {
  private wrapper: HTMLDivElement;
  private fillElement: HTMLDivElement;
  private levelElement: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'exp-bar-wrapper';

    this.levelElement = document.createElement('div');
    this.levelElement.className = 'exp-bar-level';
    this.wrapper.appendChild(this.levelElement);

    const bar = document.createElement('div');
    bar.className = 'exp-bar';
    this.fillElement = document.createElement('div');
    this.fillElement.className = 'exp-bar-fill';
    bar.appendChild(this.fillElement);
    this.wrapper.appendChild(bar);

    container.appendChild(this.wrapper);
  }

  public update(currentExp: number, expToNextLevel: number, level: number): void {
    const ratio = Math.max(0, Math.min(1, currentExp / expToNextLevel));
    this.fillElement.style.width = `${ratio * 100}%`;
    this.levelElement.textContent = `ур. ${level}`;
  }

  public setVisible(visible: boolean): void {
    this.wrapper.classList.toggle('exp-bar-wrapper--hidden', !visible);
  }
}
