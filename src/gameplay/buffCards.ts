export type BuffType =
  | 'fragments_gain'
  | 'enemy_slow'
  | 'enemy_outline'
  | 'boss_dmg_reduction'
  | 'poison_shot'
  | 'hp_regen';

export type CardTier = 1 | 2 | 3 | 4;

export interface BuffCardDef {
  id: string;
  type: BuffType;
  tier: CardTier;
  name: string;
  description: string;
  value: number;
  maxTier: CardTier;
}

export interface CardEffect {
  type: BuffType;
  value: number;
}

export interface BuffCardInstance {
  instanceId: string;
  type: BuffType | 'hybrid';
  tier: CardTier;
  name: string;
  description: string;
  effects: CardEffect[];
}

const BUFF_TYPE_NAMES: Record<BuffType, string> = {
  fragments_gain: 'Жажда осколков',
  enemy_slow: 'Вязкая земля',
  enemy_outline: 'Тепловизор',
  boss_dmg_reduction: 'Стойкость',
  poison_shot: 'Отравленные пули',
  hp_regen: 'Регенерация',
};

function describe(type: BuffType, value: number): string {
  switch (type) {
    case 'fragments_gain':
      return `Получаемые кристаллы +${value}%`;
    case 'enemy_slow':
      return `Скорость врагов -${value}%`;
    case 'enemy_outline':
      return 'Контур врагов подсвечивается';
    case 'boss_dmg_reduction':
      return `Урон от босса -${value}%`;
    case 'poison_shot':
      return `Ядовитые выстрелы -${value}%ХП/сек`;
    case 'hp_regen':
      return `Восстановление +${value}%ХП/сек`;
  }
}

const TIER_VALUES: Record<BuffType, number[]> = {
  fragments_gain: [1, 5, 20, 100],
  enemy_slow: [0.5, 2, 10, 50],
  enemy_outline: [0],
  boss_dmg_reduction: [5, 12, 25, 45],
  poison_shot: [0.5, 1.5, 4, 10],
  hp_regen: [0.1, 0.5, 2, 10],
};

export const BUFF_CARD_DEFS: BuffCardDef[] = [];

for (const type of Object.keys(TIER_VALUES) as BuffType[]) {
  const values = TIER_VALUES[type];
  const maxTier = values.length as CardTier;
  values.forEach((value, index) => {
    const tier = (index + 1) as CardTier;
    BUFF_CARD_DEFS.push({
      id: `${type}_${tier}`,
      type,
      tier,
      name: BUFF_TYPE_NAMES[type],
      description: describe(type, value),
      value,
      maxTier,
    });
  });
}

export function getBuffCardDef(type: BuffType, tier: CardTier): BuffCardDef | undefined {
  return BUFF_CARD_DEFS.find((def) => def.type === type && def.tier === tier);
}

export function purchasableDefs(): BuffCardDef[] {
  return BUFF_CARD_DEFS.filter((def) => def.tier <= 3);
}

let instanceCounter = 0;

export function instantiateCard(def: BuffCardDef): BuffCardInstance {
  instanceCounter += 1;
  return {
    instanceId: `card_${instanceCounter}`,
    type: def.type,
    tier: def.tier,
    name: def.name,
    description: def.description,
    effects: [{ type: def.type, value: def.value }],
  };
}

export function instantiateHybridCard(
  a: BuffCardInstance,
  b: BuffCardInstance
): BuffCardInstance {
  instanceCounter += 1;
  return {
    instanceId: `card_${instanceCounter}`,
    type: 'hybrid',
    tier: 4,
    name: `${a.name} + ${b.name}`,
    description: `${a.description} · ${b.description}`,
    effects: [...a.effects, ...b.effects],
  };
}

function rollTier(wave: number): CardTier {
  const w3 = Math.min(0.5, 0.03 * wave);
  const w2 = Math.min(0.4, 0.05 * wave);
  const w1 = Math.max(0.1, 1 - w2 - w3);
  const roll = Math.random() * (w1 + w2 + w3);
  if (roll < w1) return 1;
  if (roll < w1 + w2) return 2;
  return 3;
}

export function rollWaveOffers(wave: number, count: number): BuffCardDef[] {
  const offers: BuffCardDef[] = [];
  for (let i = 0; i < count; i++) {
    const tier = rollTier(wave);
    const pool = purchasableDefs().filter((def) => def.tier === tier);
    offers.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return offers;
}

export function rollShopOffers(count: number): BuffCardDef[] {
  const defs = purchasableDefs();
  const offers: BuffCardDef[] = [];
  for (let i = 0; i < count; i++) {
    offers.push(defs[Math.floor(Math.random() * defs.length)]);
  }
  return offers;
}
