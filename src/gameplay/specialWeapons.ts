export type SpecialWeaponId = 'lightning' | 'windSlash' | 'grenade';

export interface SpecialWeaponDefinition {
  id: SpecialWeaponId;
  name: string;
  description: string;
}

export const SPECIAL_WEAPONS: SpecialWeaponDefinition[] = [
  { id: 'lightning', name: 'Молния', description: 'Бьёт цепью по врагам вдоль пути' },
  { id: 'windSlash', name: 'Ветряные лезвия', description: 'Режущие волны, летящие прямо вперёд' },
  { id: 'grenade', name: 'Бомбы', description: 'Взрываются по таймеру или при приближении врага' },
];
