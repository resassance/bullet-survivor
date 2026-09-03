import { createPortraitCanvas } from '../utils/portraitSprite';
import {
  NOVEL_BACKGROUNDS,
  NOVEL_CHARACTERS,
  type NovelScene,
  type NovelCharacterId,
} from '../gameplay/novelScenes';

export class VisualNovelScene {
  private element: HTMLDivElement;
  private backgroundElement: HTMLDivElement;
  private actorsLayer: HTMLDivElement;
  private nameElement: HTMLElement;
  private textElement: HTMLElement;
  private hintElement: HTMLElement;

  private scene: NovelScene | null = null;
  private lineIndex = 0;
  private onComplete: (() => void) | null = null;
  private actorElements = new Map<NovelCharacterId, HTMLDivElement>();

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'novel-scene';
    this.element.innerHTML = `
      <div class="novel-scene-background"></div>
      <div class="novel-scene-actors"></div>
      <div class="novel-scene-textbox">
        <span class="novel-scene-name"></span>
        <p class="novel-scene-text"></p>
        <span class="novel-scene-hint">нажми, чтобы продолжить</span>
      </div>
    `;

    this.backgroundElement = this.element.querySelector(
      '.novel-scene-background'
    ) as HTMLDivElement;
    this.actorsLayer = this.element.querySelector('.novel-scene-actors') as HTMLDivElement;
    this.nameElement = this.element.querySelector('.novel-scene-name') as HTMLElement;
    this.textElement = this.element.querySelector('.novel-scene-text') as HTMLElement;
    this.hintElement = this.element.querySelector('.novel-scene-hint') as HTMLElement;

    this.element.addEventListener('click', () => this.advance());

    container.appendChild(this.element);
  }

  public play(scene: NovelScene, onComplete: () => void): void {
    this.scene = scene;
    this.lineIndex = 0;
    this.onComplete = onComplete;

    this.renderBackground();
    this.renderActors();

    this.element.classList.add('novel-scene--visible');
    this.renderCurrentLine();
  }

  private renderBackground(): void {
    if (!this.scene) return;
    const bg = NOVEL_BACKGROUNDS[this.scene.background];
    this.backgroundElement.style.background = `linear-gradient(160deg, ${bg.fallbackGradient[0]}, ${bg.fallbackGradient[1]})`;
  }

  private renderActors(): void {
    if (!this.scene) return;
    this.actorsLayer.innerHTML = '';
    this.actorElements.clear();

    for (const actor of this.scene.actors) {
      const def = NOVEL_CHARACTERS[actor.characterId];
      const actorEl = document.createElement('div');
      actorEl.className = `novel-actor novel-actor--${actor.slot}`;
      actorEl.appendChild(createPortraitCanvas('a', def.color));
      this.actorsLayer.appendChild(actorEl);
      this.actorElements.set(actor.characterId, actorEl);
    }
  }

  private advance(): void {
    this.lineIndex += 1;
    if (!this.scene || this.lineIndex >= this.scene.lines.length) {
      this.finish();
      return;
    }
    this.renderCurrentLine();
  }

  private renderCurrentLine(): void {
    if (!this.scene) return;
    const line = this.scene.lines[this.lineIndex];
    if (!line) {
      this.finish();
      return;
    }

    const def = NOVEL_CHARACTERS[line.characterId];
    this.nameElement.textContent = def.displayName;
    this.nameElement.style.color = def.color;
    this.textElement.textContent = line.text;

    for (const [characterId, actorEl] of this.actorElements) {
      actorEl.classList.toggle('novel-actor--active', characterId === line.characterId);
    }

    this.hintElement.textContent =
      this.lineIndex >= this.scene.lines.length - 1
        ? 'нажми, чтобы продолжить'
        : 'нажми для следующей реплики';
  }

  private finish(): void {
    this.element.classList.remove('novel-scene--visible');
    const callback = this.onComplete;
    this.onComplete = null;
    callback?.();
  }
}
