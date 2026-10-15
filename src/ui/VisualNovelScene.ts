import { tryLoadDomImage } from '../utils/domImageLoader';
import { NOVEL_BACKGROUNDS, NOVEL_CHARACTERS, type NovelScene, type NovelCharacterId } from '../gameplay/novelScenes';
import { createNovelFigure, createNovelBackdrop } from './novelPlaceholders';

export class VisualNovelScene {
  private element: HTMLDivElement;
  private backgroundElement: HTMLDivElement;
  private actorsLayer: HTMLDivElement;
  private nameElement: HTMLElement;
  private textElement: HTMLElement;
  private chapterElement: HTMLElement;
  private titleElement: HTMLElement;
  private locationElement: HTMLElement;
  private progressElement: HTMLElement;
  private nextButton: HTMLButtonElement;
  private previousFocus: HTMLElement | null = null;
  private scene: NovelScene | null = null;
  private lineIndex = 0;
  private onComplete: (() => void) | null = null;
  private actorElements = new Map<NovelCharacterId, HTMLDivElement>();

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'novel-scene';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-label', 'Сюжетная сцена');
    this.element.setAttribute('aria-hidden', 'true');
    this.element.tabIndex = -1;
    this.element.inert = true;
    this.element.innerHTML = `
      <div class="novel-scene-background" aria-hidden="true"></div>
      <header class="novel-scene-header">
        <div><p class="novel-scene-chapter"></p><h2 class="novel-scene-title"></h2></div>
        <button class="novel-scene-skip" type="button">Пропустить сцену <span aria-hidden="true">↗</span></button>
      </header>
      <div class="novel-scene-location"></div>
      <div class="novel-scene-actors" aria-hidden="true"></div>
      <div class="novel-scene-textbox">
        <div class="novel-scene-speaker"><span class="novel-scene-speaker-mark" aria-hidden="true"></span><span class="novel-scene-name"></span><span class="novel-scene-progress"></span></div>
        <p class="novel-scene-text" aria-live="polite" aria-atomic="true"></p>
        <div class="novel-scene-footer"><span class="novel-scene-hint">Нажатие · Enter · Пробел</span><button class="novel-scene-next" type="button"><span>Дальше</span><span aria-hidden="true">→</span></button></div>
      </div>`;
    this.backgroundElement = this.element.querySelector('.novel-scene-background')!;
    this.actorsLayer = this.element.querySelector('.novel-scene-actors')!;
    this.nameElement = this.element.querySelector('.novel-scene-name')!;
    this.textElement = this.element.querySelector('.novel-scene-text')!;
    this.chapterElement = this.element.querySelector('.novel-scene-chapter')!;
    this.titleElement = this.element.querySelector('.novel-scene-title')!;
    this.locationElement = this.element.querySelector('.novel-scene-location')!;
    this.progressElement = this.element.querySelector('.novel-scene-progress')!;
    this.nextButton = this.element.querySelector('.novel-scene-next')!;
    this.nextButton.addEventListener('click', () => this.advance());
    this.element.querySelector('.novel-scene-skip')!.addEventListener('click', () => this.finish());
    this.element.addEventListener('click', event => {
      if (!(event.target as Element).closest('button') && !window.getSelection()?.toString()) this.advance();
    });
    // Capture navigation before gameplay listeners can reuse the same key.
    window.addEventListener('keydown', event => {
      if (!this.scene || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.code === 'Tab') {
        const buttons = Array.from(this.element.querySelectorAll<HTMLButtonElement>('button'));
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = current < 0 ? (event.shiftKey ? buttons.length - 1 : 0) : (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        event.preventDefault();
        event.stopImmediatePropagation();
        buttons[next]?.focus();
        return;
      }
      if (event.repeat) return;
      if (!['Enter', 'Space', 'ArrowRight'].includes(event.code)) return;
      if ((event.target as Element)?.closest?.('button') && event.code !== 'ArrowRight') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.advance();
    }, true);
    container.appendChild(this.element);
  }

  public play(scene: NovelScene, onComplete: () => void): void {
    this.previousFocus = document.activeElement instanceof HTMLElement && !this.element.contains(document.activeElement) ? document.activeElement : null;
    this.scene = scene;
    this.lineIndex = 0;
    this.onComplete = onComplete;
    this.element.dataset.scene = scene.id;
    this.element.dataset.background = scene.background;
    this.chapterElement.textContent = scene.chapter ?? 'История · После боя';
    this.titleElement.textContent = scene.title ?? 'Между волнами';
    this.locationElement.textContent = NOVEL_BACKGROUNDS[scene.background].label;
    this.renderBackground(scene);
    this.renderActors(scene);
    this.element.inert = false;
    this.element.setAttribute('aria-hidden', 'false');
    this.element.classList.add('novel-scene--visible');
    this.renderCurrentLine();
    if (this.scene) this.element.focus({ preventScroll: true });
  }

  private renderBackground(scene: NovelScene): void {
    const bg = NOVEL_BACKGROUNDS[scene.background];
    this.backgroundElement.style.backgroundImage = `linear-gradient(180deg, ${bg.fallbackGradient[0]}, ${bg.fallbackGradient[1]})`;
    this.backgroundElement.replaceChildren(createNovelBackdrop(scene.background));
    if (bg.imagePath) tryLoadDomImage(bg.imagePath, path => {
      if (this.scene !== scene) return;
      this.backgroundElement.style.backgroundImage = `url("${path}")`;
      this.backgroundElement.replaceChildren();
    });
  }

  private renderActors(scene: NovelScene): void {
    this.actorsLayer.replaceChildren();
    this.actorElements.clear();
    for (const actor of scene.actors) {
      const def = NOVEL_CHARACTERS[actor.characterId];
      const element = document.createElement('div');
      element.className = `novel-actor novel-actor--${actor.slot}`;
      element.style.setProperty('--actor-color', def.color);
      element.dataset.character = actor.characterId;
      element.appendChild(createNovelFigure(actor.characterId));
      const label = document.createElement('span');
      label.className = 'novel-actor-label';
      label.textContent = def.displayName;
      element.appendChild(label);
      this.actorsLayer.appendChild(element);
      this.actorElements.set(actor.characterId, element);
      if (def.imagePath) tryLoadDomImage(def.imagePath, path => {
        if (this.scene !== scene) return;
        const image = document.createElement('img');
        image.className = 'novel-actor-image';
        image.alt = '';
        image.src = path;
        element.replaceChildren(image, label);
      });
    }
  }

  private advance(): void {
    if (!this.scene) return;
    this.lineIndex++;
    this.renderCurrentLine();
  }

  private renderCurrentLine(): void {
    if (!this.scene) return;
    const line = this.scene.lines[this.lineIndex];
    if (!line) { this.finish(); return; }
    const def = NOVEL_CHARACTERS[line.characterId];
    this.element.style.setProperty('--speaker-color', def.color);
    this.nameElement.textContent = def.displayName;
    this.textElement.textContent = line.text;
    this.progressElement.textContent = `${String(this.lineIndex + 1).padStart(2, '0')} / ${String(this.scene.lines.length).padStart(2, '0')}`;
    this.progressElement.setAttribute('aria-label', `Реплика ${this.lineIndex + 1} из ${this.scene.lines.length}`);
    this.nextButton.firstElementChild!.textContent = this.lineIndex === this.scene.lines.length - 1 ? (this.scene.continueLabel ?? 'Продолжить') : 'Дальше';
    for (const [id, actor] of this.actorElements) actor.classList.toggle('novel-actor--active', id === line.characterId);
  }

  private finish(): void {
    if (!this.scene) return;
    this.scene = null;
    this.element.classList.remove('novel-scene--visible');
    this.element.inert = true;
    this.element.setAttribute('aria-hidden', 'true');
    const callback = this.onComplete;
    this.onComplete = null;
    this.previousFocus?.focus({ preventScroll: true });
    this.previousFocus = null;
    callback?.();
  }
}
