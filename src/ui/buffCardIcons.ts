import type { BuffType } from '../gameplay/buffCards';

const ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

const ICONS: Record<BuffType | 'hybrid', string> = {
  fragments_gain: `<svg ${ICON_ATTRS}><path d="M12 2 L20 9 L12 22 L4 9 Z" /><path d="M4 9 L20 9" /><path d="M9 9 L12 2 L15 9" /></svg>`,
  enemy_slow: `<svg ${ICON_ATTRS}><path d="M6 3 H18 V7 L13 12 L18 17 V21 H6 V17 L11 12 L6 7 Z" /></svg>`,
  enemy_outline: `<svg ${ICON_ATTRS}><path d="M2 12 C5 6 9 4 12 4 C15 4 19 6 22 12 C19 18 15 20 12 20 C9 20 5 18 2 12 Z" /><circle cx="12" cy="12" r="3" /></svg>`,
  boss_dmg_reduction: `<svg ${ICON_ATTRS}><path d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z" /><path d="M9.5 12 L11.2 13.7 L14.8 10" /></svg>`,
  poison_shot: `<svg ${ICON_ATTRS}><path d="M12 3 C15 8 17.5 11.5 17.5 14.5 C17.5 18 15 21 12 21 C9 21 6.5 18 6.5 14.5 C6.5 11.5 9 8 12 3 Z" /></svg>`,
  hp_regen: `<svg ${ICON_ATTRS}><path d="M12 20 C6 15.5 3 12 3 8.5 C3 5.8 5.1 4 7.5 4 C9.2 4 10.8 5 12 6.5 C13.2 5 14.8 4 16.5 4 C18.9 4 21 5.8 21 8.5 C21 12 18 15.5 12 20 Z" /><path d="M12 9 V15 M9 12 H15" /></svg>`,
  hybrid: `<svg ${ICON_ATTRS}><path d="M9 3 L15 9 L9 15 L3 9 Z" /><path d="M15 9 L21 15 L15 21 L9 15" /></svg>`,
};

export function getBuffCardIcon(type: BuffType | 'hybrid'): string {
  return ICONS[type];
}
