import { createPortraitCanvas } from '../utils/portraitSprite';
import { SUBTITLE } from '../utils/constants';
import type { DialogueLine } from '../gameplay/dialogueLines';

export class SubtitleBar {
  private element: HTMLDivElement;
  private portraitContainer: HTMLDivElement;
  private nameElement: HTMLSpanElement;
  private textElement: HTMLSpanElement;
  private frameA: HTMLCanvasElement | null = null;
  private frameB: HTMLCanvasElement | null = null;
  private swayShowingA = true;
  private swayIntervalId: number | null = null;
  private hideTimeoutId: number | null = null;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'subtitle-bar';
    this.element.innerHTML = `
      <div class="subtitle-portrait"></div>
      <div class="subtitle-text-block">
        <span class="subtitle-name"></span>
        <span class="subtitle-text"></span>
      </div>
    `;

    this.portraitContainer = this.element.querySelector(
      '.subtitle-portrait'
    ) as HTMLDivElement;
    this.nameElement = this.element.querySelector('.subtitle-name') as HTMLSpanElement;
    this.textElement = this.element.querySelector('.subtitle-text') as HTMLSpanElement;

    container.appendChild(this.element);
  }

  public show(line: DialogueLine): void {
    this.nameElement.textContent = line.speaker;
    this.nameElement.style.color = line.color;
    this.textElement.textContent = line.text;

    this.portraitContainer.innerHTML = '';
    this.frameA = createPortraitCanvas('a', line.color);
    this.frameB = createPortraitCanvas('b', line.color);
    this.frameB.style.display = 'none';
    this.portraitContainer.appendChild(this.frameA);
    this.portraitContainer.appendChild(this.frameB);
    this.swayShowingA = true;

    if (this.swayIntervalId !== null) window.clearInterval(this.swayIntervalId);
    this.swayIntervalId = window.setInterval(() => this.toggleSway(), SUBTITLE.SWAY_INTERVAL * 1000);

    this.element.classList.add('subtitle-bar--visible');

    if (this.hideTimeoutId !== null) window.clearTimeout(this.hideTimeoutId);
    this.hideTimeoutId = window.setTimeout(() => this.hide(), SUBTITLE.DISPLAY_DURATION * 1000);
  }

  private toggleSway(): void {
    if (!this.frameA || !this.frameB) return;
    this.swayShowingA = !this.swayShowingA;
    this.frameA.style.display = this.swayShowingA ? 'block' : 'none';
    this.frameB.style.display = this.swayShowingA ? 'none' : 'block';
  }

  public hide(): void {
    this.element.classList.remove('subtitle-bar--visible');
    if (this.swayIntervalId !== null) {
      window.clearInterval(this.swayIntervalId);
      this.swayIntervalId = null;
    }
  }
}
