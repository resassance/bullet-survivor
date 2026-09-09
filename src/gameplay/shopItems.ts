export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'stub_ammo_cache',
    name: 'Ящик патронов',
    description: 'Заглушка. Здесь будет полезный эффект.',
    price: 15,
  },
  {
    id: 'stub_armor_plate',
    name: 'Бронепластина',
    description: 'Заглушка. Здесь будет полезный эффект.',
    price: 25,
  },
  {
    id: 'stub_energy_cell',
    name: 'Энергоячейка',
    description: 'Заглушка. Здесь будет полезный эффект.',
    price: 30,
  },
  {
    id: 'stub_mystery_crate',
    name: 'Загадочный ящик',
    description: 'Заглушка. Здесь будет полезный эффект.',
    price: 40,
  },
];
