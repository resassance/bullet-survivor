import type { Skill } from '../gameplay/skills';

export class LevelUpOverlay {
  private element: HTMLDivElement;
  private cardsContainer: HTMLDivElement;
  private onPick: (skillId: string) => void;

  constructor(container: HTMLElement, onPick: (skillId: string) => void) {
    this.onPick = onPick;

    this.element = document.createElement('div');
    this.element.className = 'level-up-screen';
    this.element.innerHTML = `
      <div class="level-up-content">
        <h1 class="level-up-title">новый уровень</h1>
        <div class="level-up-cards"></div>
      </div>
    `;

    this.cardsContainer = this.element.querySelector(
      '.level-up-cards'
    ) as HTMLDivElement;

    container.appendChild(this.element);
  }

  public show(skills: Skill[]): void {
    this.cardsContainer.innerHTML = '';

    for (const skill of skills) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'level-up-card';
      card.innerHTML = `
        <span class="level-up-card-name">${skill.name}</span>
        <span class="level-up-card-description">${skill.description}</span>
      `;
      card.addEventListener('click', () => this.onPick(skill.id));
      this.cardsContainer.appendChild(card);
    }

    this.element.classList.add('level-up-screen--visible');
  }

  public hide(): void {
    this.element.classList.remove('level-up-screen--visible');
  }
}
