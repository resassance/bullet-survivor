import { createPortraitCanvas } from '../utils/portraitSprite';
import type { DialogueLine } from '../gameplay/dialogueLines';

export class DialogueScreen {
  private element: HTMLDivElement;
  private portraitContainer: HTMLDivElement;
  private nameElement: HTMLSpanElement;
  private textElement: HTMLElement;
  private hintElement: HTMLSpanElement;
  private lines: DialogueLine[] = [];
  private lineIndex = 0;
  private onComplete: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'dialogue-screen';
    this.element.innerHTML = `
      <div class="dialogue-content">
        <div class="dialogue-portrait"></div>
        <div class="dialogue-text-block">
          <span class="dialogue-name"></span>
          <p class="dialogue-text"></p>
          <span class="dialogue-hint">нажми, чтобы продолжить</span>
        </div>
      </div>
    `;

    this.portraitContainer = this.element.querySelector(
      '.dialogue-portrait'
    ) as HTMLDivElement;
    this.nameElement = this.element.querySelector('.dialogue-name') as HTMLSpanElement;
    this.textElement = this.element.querySelector('.dialogue-text') as HTMLElement;
    this.hintElement = this.element.querySelector('.dialogue-hint') as HTMLSpanElement;

    this.element.addEventListener('click', () => this.advance());

    container.appendChild(this.element);
  }

  public play(lines: DialogueLine[], onComplete: () => void): void {
    this.lines = lines;
    this.lineIndex = 0;
    this.onComplete = onComplete;
    this.element.classList.add('dialogue-screen--visible');
    this.renderCurrentLine();
  }

  private advance(): void {
    this.lineIndex += 1;
    if (this.lineIndex >= this.lines.length) {
      this.finish();
      return;
    }
    this.renderCurrentLine();
  }

  private renderCurrentLine(): void {
    const line = this.lines[this.lineIndex];
    if (!line) {
      this.finish();
      return;
    }

    this.nameElement.textContent = line.speaker;
    this.nameElement.style.color = line.color;
    this.textElement.textContent = line.text;

    this.portraitContainer.innerHTML = '';
    this.portraitContainer.appendChild(createPortraitCanvas('a', line.color));

    this.hintElement.textContent =
      this.lineIndex >= this.lines.length - 1 ? 'нажми, чтобы продолжить' : 'нажми для следующей реплики';
  }

  private finish(): void {
    this.element.classList.remove('dialogue-screen--visible');
    const callback = this.onComplete;
    this.onComplete = null;
    callback?.();
  }
}
