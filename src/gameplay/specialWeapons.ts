export type SpecialWeaponId = 'lightning' | 'windSlash' | 'grenade';

export interface SpecialWeaponDefinition {
  id: SpecialWeaponId;
  name: string;
}

export const SPECIAL_WEAPONS: SpecialWeaponDefinition[] = [
  { id: 'lightning', name: 'Молния' },
  { id: 'windSlash', name: 'Ветряные лезвия' },
  { id: 'grenade', name: 'Бомбы' },
];
