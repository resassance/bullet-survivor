export class FadeOverlay {
  private element: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'fade-overlay';
    container.appendChild(this.element);
  }

  public transition(onMid: () => void, onDone?: () => void, holdMs = 220): void {
    this.element.classList.add('fade-overlay--visible');
    window.setTimeout(() => {
      onMid();
      window.setTimeout(() => {
        this.element.classList.remove('fade-overlay--visible');
        onDone?.();
      }, holdMs);
    }, holdMs);
  }
}
