import { FINAL_BOSS, CENTER, CORNERS, PHASE_ONE_BOSS, mirrorPoint, type ArenaPoint, type CornerId } from './finalBossConfig.ts';

export type FinalBossPhase = 'idle' | 'ranged' | 'interlude' | 'mirror' | 'centering' | 'victory' | 'failed';
export type FightEvent = { type: 'damage'; amount: number } | { type: 'interlude' | 'victory' | 'reflected' | 'miss' };
export interface FightLoadout { damage: number; fireRate: number; magazine: number; reloadDuration: number }
export interface FightProjectile extends ArenaPoint { vx: number; vy: number; hostile: boolean; damage: number; life: number }

const distance = (a: ArenaPoint, b: ArenaPoint) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Pure encounter rules; pause/novel screens do not advance this simulation. */
export class FinalBossFight {
  public phase: FinalBossPhase = 'idle';
  public hero: ArenaPoint = { x: 0.5, y: 0.8 };
  public heroTarget: ArenaPoint = { ...this.hero };
  public boss: ArenaPoint = { ...PHASE_ONE_BOSS };
  public bossHealth: number = FINAL_BOSS.health;
  public destroyed = [false, false, false, false];
  public projectiles: FightProjectile[] = [];
  public attackKind: 'volley' | 'beam' = 'volley';
  public lockedTarget: ArenaPoint | null = null;
  public targetCorner: CornerId | null = null;
  public castRemaining = 0;
  public castDuration = 0;
  public reloadRemaining = 0;
  public ammo: number = FINAL_BOSS.magazine;
  public shieldFlash = 0;
  private cooldown = 0;
  private shotCooldown = 0;
  private attackNumber = 0;
  private readonly coverOrder: readonly CornerId[] = [0, 1, 3, 2];
  private loadout: FightLoadout = { damage: FINAL_BOSS.playerDamage, fireRate: FINAL_BOSS.playerFireRate, magazine: FINAL_BOSS.magazine, reloadDuration: FINAL_BOSS.reloadDuration };

  public get ren(): ArenaPoint { return mirrorPoint(this.hero); }
  public get brokenCount(): number { return this.destroyed.filter(Boolean).length; }

  public start(loadout: Partial<FightLoadout> = {}): void {
    this.reset();
    this.loadout = { ...this.loadout, ...loadout };
    this.ammo = this.loadout.magazine;
    this.phase = 'ranged';
    this.cooldown = FINAL_BOSS.firstAttackDelay;
  }

  public reset(): void {
    this.phase = 'idle';
    this.hero = { x: 0.5, y: 0.8 };
    this.heroTarget = { ...this.hero };
    this.boss = { ...PHASE_ONE_BOSS };
    this.bossHealth = FINAL_BOSS.health;
    this.destroyed = [false, false, false, false];
    this.projectiles = [];
    this.lockedTarget = null;
    this.targetCorner = null;
    this.castRemaining = 0;
    this.castDuration = 0;
    this.reloadRemaining = 0;
    this.shieldFlash = 0;
    this.cooldown = 0;
    this.shotCooldown = 0;
    this.attackNumber = 0;
  }

  public fail(): void { this.phase = 'failed'; this.projectiles = []; }

  public aimMovement(point: ArenaPoint): void {
    if (this.phase !== 'ranged') return;
    this.heroTarget = { x: clamp(point.x, 0.07, 0.93), y: clamp(point.y, 0.4, 0.91) };
  }

  public selectCorner(corner: CornerId): void {
    if (this.phase !== 'mirror' && this.phase !== 'centering') return;
    // Broken covers remain valid destinations, including after all four attacks.
    this.heroTarget = { ...CORNERS[corner].point };
  }

  public requestCenter(): void {
    if (this.phase === 'centering') this.heroTarget = { ...CENTER };
  }

  public beginMirror(): void {
    if (this.phase !== 'interlude') return;
    this.phase = 'mirror';
    this.boss = { ...CENTER };
    this.hero = { ...CORNERS[3].point };
    this.heroTarget = { ...this.hero };
    this.cooldown = FINAL_BOSS.mirrorCooldown;
  }

  public damageBoss(amount: number): FightEvent[] {
    if (this.phase !== 'ranged' || amount <= 0) return [];
    this.bossHealth = Math.max(FINAL_BOSS.phaseTwoThreshold, this.bossHealth - amount);
    if (this.bossHealth > FINAL_BOSS.phaseTwoThreshold) return [];
    this.phase = 'interlude';
    this.projectiles = [];
    this.castRemaining = 0;
    this.lockedTarget = null;
    return [{ type: 'interlude' }];
  }

  public update(delta: number): FightEvent[] {
    const events: FightEvent[] = [];
    // Substeps prevent fast shots tunnelling through the boss/hero at low FPS.
    let remaining = Math.max(0, delta);
    while (remaining > 0 && ['ranged', 'mirror', 'centering'].includes(this.phase)) {
      const step = Math.min(remaining, 0.025);
      remaining -= step;
      this.move(step);
      this.shieldFlash = Math.max(0, this.shieldFlash - step);
      if (this.phase === 'ranged') this.updateRanged(step, events);
      else if (this.phase === 'mirror') this.updateMirror(step, events);
      else if (distance(this.heroTarget, CENTER) === 0 && distance(this.hero, CENTER) < 0.008 && distance(this.ren, CENTER) < 0.008) {
        this.hero = { ...CENTER };
        this.phase = 'victory';
        events.push({ type: 'victory' });
      }
    }
    return events;
  }

  private move(delta: number): void {
    const length = distance(this.hero, this.heroTarget);
    if (length === 0) return;
    const fraction = Math.min(1, FINAL_BOSS.moveSpeed * delta / length);
    if (fraction === 1) { this.hero = { ...this.heroTarget }; return; }
    this.hero.x += (this.heroTarget.x - this.hero.x) * fraction;
    this.hero.y += (this.heroTarget.y - this.hero.y) * fraction;
  }

  private updateRanged(delta: number, events: FightEvent[]): void {
    if (this.reloadRemaining > 0) {
      this.reloadRemaining = Math.max(0, this.reloadRemaining - delta);
      if (this.reloadRemaining === 0) this.ammo = this.loadout.magazine;
    } else {
      this.shotCooldown -= delta;
      if (this.shotCooldown <= 0) {
        this.launch(this.hero, this.boss, 1.25, false, this.loadout.damage);
        this.shotCooldown += 1 / this.loadout.fireRate;
        if (--this.ammo <= 0) this.reloadRemaining = this.loadout.reloadDuration;
      }
    }
    this.updateRangedAttack(delta, events);
    const alive: FightProjectile[] = [];
    for (const shot of this.projectiles) {
      shot.x += shot.vx * delta;
      shot.y += shot.vy * delta;
      shot.life -= delta;
      const target = shot.hostile ? this.hero : this.boss;
      if (distance(shot, target) < (shot.hostile ? 0.035 : 0.055)) {
        if (shot.hostile) events.push({ type: 'damage', amount: shot.damage });
        else events.push(...this.damageBoss(shot.damage));
        if (this.phase !== 'ranged') return;
      } else if (shot.life > 0 && shot.x > -0.1 && shot.x < 1.1 && shot.y > -0.1 && shot.y < 1.1) alive.push(shot);
    }
    this.projectiles = alive;
  }

  private updateRangedAttack(delta: number, events: FightEvent[]): void {
    if (!this.lockedTarget) {
      this.cooldown -= delta;
      if (this.cooldown > 0) return;
      this.attackKind = this.attackNumber++ % 2 === 0 ? 'volley' : 'beam';
      this.lockedTarget = { ...this.hero };
      this.castDuration = this.attackKind === 'volley' ? FINAL_BOSS.volleyCast : FINAL_BOSS.beamCast;
      this.castRemaining = this.castDuration;
      return;
    }
    this.castRemaining -= delta;
    if (this.castRemaining > 0) return;
    if (this.attackKind === 'beam') {
      if (Math.abs(this.hero.x - this.lockedTarget.x) < FINAL_BOSS.beamHalfWidth) events.push({ type: 'damage', amount: 1 });
    } else {
      for (const spread of [-0.14, 0, 0.14]) this.launch(this.boss, this.lockedTarget, 0.58, true, 1, spread);
    }
    this.lockedTarget = null;
    this.castRemaining = 0;
    this.cooldown = FINAL_BOSS.attackCooldown;
  }

  private launch(from: ArenaPoint, target: ArenaPoint, speed: number, hostile: boolean, damage: number, spread = 0): void {
    const angle = Math.atan2(target.y - from.y, target.x - from.x) + spread;
    this.projectiles.push({ ...from, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, hostile, damage, life: 3 });
  }

  private updateMirror(delta: number, events: FightEvent[]): void {
    if (this.targetCorner === null) {
      this.cooldown -= delta;
      if (this.cooldown > 0) return;
      this.targetCorner = this.coverOrder.find(corner => !this.destroyed[corner]) ?? null;
      this.castDuration = FINAL_BOSS.mirrorCast;
      this.castRemaining = this.castDuration;
      return;
    }
    this.castRemaining -= delta;
    if (this.castRemaining > 0) return;
    const target = this.targetCorner;
    const reflected = distance(this.ren, CORNERS[target].point) < FINAL_BOSS.reflectionRadius;
    if (reflected) {
      this.destroyed[target] = true;
      this.shieldFlash = 0.8;
      events.push({ type: 'reflected' });
    } else {
      if (FINAL_BOSS.breakCoverOnMiss) this.destroyed[target] = true;
      events.push({ type: 'damage', amount: 1 }, { type: 'miss' });
    }
    this.targetCorner = null;
    this.castRemaining = 0;
    this.cooldown = FINAL_BOSS.mirrorCooldown;
    if (this.brokenCount === 4) this.phase = 'centering';
  }
}
