import type { BuffType } from '../gameplay/buffCards';
import { getBuffCardIcon } from './buffCardIcons';

export interface BuffCardElementOptions {
  type: BuffType | 'hybrid';
  tier: number;
  name: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  selected?: boolean;
  onActivate?: () => void;
}

export function createBuffCardElement(options: BuffCardElementOptions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'buff-card';
  if (options.disabled) card.classList.add('buff-card--disabled');
  if (options.selected) card.classList.add('buff-card--selected');

  card.innerHTML = `
    <div class="buff-card-inner">
      <div class="buff-card-face buff-card-front">
        <button type="button" class="buff-card-info" aria-label="описание">?</button>
        <div class="buff-card-icon">${getBuffCardIcon(options.type)}</div>
        <div class="buff-card-name">${options.name}</div>
        <div class="buff-card-tier">тир ${options.tier}</div>
        ${options.badge ? `<div class="buff-card-badge">${options.badge}</div>` : ''}
      </div>
      <div class="buff-card-face buff-card-back">
        <div class="buff-card-description">${options.description}</div>
      </div>
    </div>
  `;

  const infoButton = card.querySelector('.buff-card-info') as HTMLButtonElement;
  infoButton.addEventListener('click', (event) => {
    event.stopPropagation();
    card.classList.toggle('buff-card--flipped');
  });

  if (options.onActivate && !options.disabled) {
    card.classList.add('buff-card--clickable');
    card.addEventListener('click', () => options.onActivate?.());
  }

  return card;
}
