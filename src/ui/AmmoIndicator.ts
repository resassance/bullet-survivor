export class AmmoIndicator {
  private element: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'ammo-indicator';
    container.appendChild(this.element);
  }

  public update(ammo: number, capacity: number, isReloading: boolean): void {
    if (isReloading) {
      this.element.textContent = 'ПЕРЕЗАРЯДКА...';
      this.element.classList.add('ammo-indicator--reloading');
    } else {
      this.element.textContent = `${ammo} / ${capacity}`;
      this.element.classList.remove('ammo-indicator--reloading');
    }
  }
}
