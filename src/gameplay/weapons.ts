export interface WeaponDefinition {
  id: string;
  name: string;
  fireRate: number;
  damage: number;
  pelletCount: number;
  spread: number;
  magazineSize: number;
  reloadDuration: number;
  bulletSpeed: number;
  color: number;
}

export const WEAPONS: WeaponDefinition[] = [
  {
    id: 'standard',
    name: 'Штатный пистолет',
    fireRate: 1.4,
    damage: 1,
    pelletCount: 1,
    spread: 0.16,
    magazineSize: 6,
    reloadDuration: 1.7,
    bulletSpeed: 24,
    color: 0xff3b6e,
  },
  {
    id: 'scatter',
    name: 'Дробовик',
    fireRate: 0.9,
    damage: 0.6,
    pelletCount: 5,
    spread: 1.1,
    magazineSize: 4,
    reloadDuration: 2.1,
    bulletSpeed: 20,
    color: 0xffb23b,
  },
  {
    id: 'rapid',
    name: 'Скорострельный',
    fireRate: 3.2,
    damage: 0.5,
    pelletCount: 1,
    spread: 0.1,
    magazineSize: 12,
    reloadDuration: 1.4,
    bulletSpeed: 26,
    color: 0x3bd6ff,
  },
];

export function findWeapon(id: string): WeaponDefinition {
  return WEAPONS.find((weapon) => weapon.id === id) ?? WEAPONS[0];
}
