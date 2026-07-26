export class HitFlash {
  private element: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'hit-flash';
    container.appendChild(this.element);
  }

  public trigger(): void {
    this.element.classList.remove('hit-flash--active');
    void this.element.offsetWidth;
    this.element.classList.add('hit-flash--active');
  }
}
