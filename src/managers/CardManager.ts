import {
  type BuffCardInstance,
  type BuffType,
  type CardTier,
  getBuffCardDef,
  instantiateCard,
  instantiateHybridCard,
} from '../gameplay/buffCards';
import { CARD_TUNING } from '../utils/constants';

export interface FusionGroup {
  type: BuffType;
  tier: CardTier;
  count: number;
}

export class CardManager {
  private inventory: BuffCardInstance[] = [];

  public get cards(): BuffCardInstance[] {
    return this.inventory;
  }

  public reset(): void {
    this.inventory = [];
  }

  public addCard(card: BuffCardInstance): void {
    this.inventory.push(card);
  }

  public totalEffect(type: BuffType): number {
    let total = 0;
    for (const card of this.inventory) {
      for (const effect of card.effects) {
        if (effect.type === type) total += effect.value;
      }
    }
    return total;
  }

  public hasEffect(type: BuffType): boolean {
    return this.inventory.some((card) => card.effects.some((effect) => effect.type === type));
  }

  public fusionGroups(): FusionGroup[] {
    const counts = new Map<string, FusionGroup>();
    for (const card of this.inventory) {
      if (card.type === 'hybrid' || card.tier >= 3) continue;
      const key = `${card.type}_${card.tier}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { type: card.type, tier: card.tier, count: 1 });
      }
    }
    return Array.from(counts.values()).filter((group) => group.count >= CARD_TUNING.FUSE_COUNT);
  }

  public fuse(type: BuffType, tier: CardTier): BuffCardInstance | null {
    const matching = this.inventory.filter((card) => card.type === type && card.tier === tier);
    if (matching.length < CARD_TUNING.FUSE_COUNT) return null;

    const toRemove = new Set(matching.slice(0, CARD_TUNING.FUSE_COUNT).map((card) => card.instanceId));
    this.inventory = this.inventory.filter((card) => !toRemove.has(card.instanceId));

    const nextTier = (tier + 1) as CardTier;
    const nextDef = getBuffCardDef(type, nextTier);
    if (!nextDef) return null;
    const created = instantiateCard(nextDef);
    this.addCard(created);
    return created;
  }

  public tierThreeCards(): BuffCardInstance[] {
    return this.inventory.filter((card) => card.tier === 3);
  }

  public awaken(instanceIdA: string, instanceIdB: string): BuffCardInstance | null {
    const cardA = this.inventory.find((card) => card.instanceId === instanceIdA);
    const cardB = this.inventory.find((card) => card.instanceId === instanceIdB);
    if (!cardA || !cardB || cardA.instanceId === cardB.instanceId) return null;
    if (cardA.tier !== 3 || cardB.tier !== 3) return null;

    this.inventory = this.inventory.filter(
      (card) => card.instanceId !== instanceIdA && card.instanceId !== instanceIdB
    );

    let result: BuffCardInstance;
    if (cardA.type === cardB.type && cardA.type !== 'hybrid') {
      const def = getBuffCardDef(cardA.type, 4);
      result = def ? instantiateCard(def) : instantiateHybridCard(cardA, cardB);
    } else {
      result = instantiateHybridCard(cardA, cardB);
    }

    this.addCard(result);
    return result;
  }
}
