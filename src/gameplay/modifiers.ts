export interface GateModifier {
  id: string;
  label: string;
  color: string;
}

export const GATE_MODIFIERS: GateModifier[] = [
  { id: 'multishot', label: '+2 ПУЛИ', color: '#ff3b6e' },
  { id: 'fireRate', label: 'x2 СКОРОСТРЕЛЬНОСТЬ', color: '#9b7fff' },
  { id: 'damage', label: '+1 УРОН', color: '#3bffb0' },
  { id: 'bulletSpeed', label: 'x1.5 СКОРОСТЬ ПУЛЬ', color: '#ffe23b' },
];
