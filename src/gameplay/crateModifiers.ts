export interface CrateModifier {
  id: string;
  label: string;
  color: string;
}

export const CRATE_MODIFIERS: CrateModifier[] = [
  { id: 'multishot', label: '+1 ПУЛЯ В ЗАЛПЕ', color: '#ff3b6e' },
  { id: 'fireRate', label: '+35% СКОРОСТРЕЛЬНОСТЬ', color: '#9b7fff' },
  { id: 'damage', label: '+1 УРОН', color: '#3bffb0' },
  { id: 'bulletSpeed', label: '+20% СКОРОСТЬ ПУЛЬ', color: '#ffe23b' },
];
