export class StageIndicator {
  private element: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'stage-indicator';
    container.appendChild(this.element);
  }

  public update(stage: number, spawned: number, total: number, prefix = 'УРОВЕНЬ'): void {
    this.element.textContent = `${prefix} ${stage} · ${Math.min(spawned, total)}/${total}`;
  }
}
