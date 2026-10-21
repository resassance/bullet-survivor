import test from 'node:test';
import assert from 'node:assert/strict';
import { FinalBossFight } from '../src/gameplay/FinalBossFight.ts';
import { CENTER, CORNERS, FINAL_BOSS, PHASE_ONE_BOSS, mirrorPoint, oppositeCorner, type CornerId } from '../src/gameplay/finalBossConfig.ts';

function mirrorFight(): FinalBossFight {
  const fight = new FinalBossFight();
  fight.start();
  fight.damageBoss(100);
  fight.beginMirror();
  return fight;
}

function cast(fight: FinalBossFight): CornerId {
  fight.update(FINAL_BOSS.mirrorCooldown + 0.05);
  assert.notEqual(fight.targetCorner, null);
  return fight.targetCorner!;
}

function reflect(fight: FinalBossFight): CornerId {
  const target = cast(fight);
  fight.selectCorner(oppositeCorner(target));
  const events = fight.update(FINAL_BOSS.mirrorCast + 0.05);
  assert.equal(events.filter(event => event.type === 'reflected').length, 1);
  assert.equal(fight.destroyed[target], true);
  return target;
}

test('stationary boss and actual auto-fired shots advance the ranged phase', () => {
  const fight = new FinalBossFight();
  fight.start();
  const events = fight.update(35);
  assert.deepEqual(fight.boss, PHASE_ONE_BOSS);
  assert.equal(fight.phase, 'interlude');
  assert.equal(events.filter(event => event.type === 'interlude').length, 1);
  assert.equal(fight.bossHealth, FINAL_BOSS.phaseTwoThreshold);
  assert.equal(fight.projectiles.length, 0);
});

test('damage threshold interrupts casting once and cannot skip the novel', () => {
  const fight = new FinalBossFight();
  fight.start();
  assert.deepEqual(fight.damageBoss(69), []);
  assert.equal(fight.phase, 'ranged');
  assert.deepEqual(fight.damageBoss(1), [{ type: 'interlude' }]);
  assert.deepEqual(fight.damageBoss(1000), []);
  fight.update(100);
  assert.equal(fight.phase, 'interlude');
  fight.beginMirror();
  assert.equal(fight.phase, 'mirror');
});

test('boss telegraph locks its target instead of following a dodge', () => {
  const fight = new FinalBossFight();
  fight.start();
  fight.update(FINAL_BOSS.firstAttackDelay + 0.05);
  const locked = { ...fight.lockedTarget! };
  fight.aimMovement({ x: 0.1, y: 0.85 });
  fight.update(0.2);
  assert.deepEqual(fight.lockedTarget, locked);
  assert.notEqual(fight.hero.x, locked.x);
});

test('hero can dodge while the auto-weapon reloads', () => {
  const fight = new FinalBossFight();
  fight.start({ magazine: 1, reloadDuration: 2 });
  fight.update(0.05);
  assert.ok(fight.reloadRemaining > 0);
  fight.aimMovement({ x: 0.1, y: 0.5 });
  const before = { ...fight.hero };
  fight.update(0.3);
  assert.notDeepEqual(fight.hero, before);
  assert.ok(fight.reloadRemaining > 0);
});

test('Ren mirrors both axes continuously, including between corners', () => {
  const fight = mirrorFight();
  fight.selectCorner(0);
  fight.update(0.2);
  assert.deepEqual(fight.ren, mirrorPoint(fight.hero));
  assert.ok(fight.hero.x > 0.18 && fight.hero.x < 0.82);
  assert.equal(fight.hero.x + fight.ren.x, 1);
  assert.equal(fight.hero.y + fight.ren.y, 1);
});

test('choosing the opposite corner reflects the attack and destroys exactly its cover', () => {
  const fight = mirrorFight();
  assert.equal(reflect(fight), 0);
  assert.equal(fight.brokenCount, 1);
  assert.deepEqual(fight.destroyed, [true, false, false, false]);
});

test('wrong corner causes damage and repeats the same intact cover', () => {
  const fight = mirrorFight();
  const target = cast(fight);
  fight.selectCorner(target);
  const events = fight.update(FINAL_BOSS.mirrorCast + 0.05);
  assert.equal(events.filter(event => event.type === 'damage').length, 1);
  assert.equal(fight.brokenCount, 0);
  assert.equal(cast(fight), target);
});

test('selecting too late does not reflect before Ren arrives', () => {
  const fight = mirrorFight();
  const target = cast(fight);
  fight.selectCorner(target);
  fight.update(FINAL_BOSS.mirrorCast - 0.08);
  fight.selectCorner(oppositeCorner(target));
  const events = fight.update(0.12);
  assert.ok(events.some(event => event.type === 'damage'));
  assert.equal(fight.brokenCount, 0);
});

test('four different covers lead to centering, never to automatic victory', () => {
  const fight = mirrorFight();
  const targets = new Set<CornerId>();
  for (let i = 0; i < 4; i++) targets.add(reflect(fight));
  assert.equal(targets.size, 4);
  assert.equal(fight.phase, 'centering');
  assert.deepEqual(fight.update(30), []);
  assert.equal(fight.phase, 'centering');
});

test('destroyed corners remain reachable and mirror positions remain valid', () => {
  const fight = mirrorFight();
  for (let i = 0; i < 4; i++) reflect(fight);
  for (const corner of CORNERS) {
    fight.selectCorner(corner.id);
    fight.update(2);
    assert.deepEqual(fight.hero, corner.point);
    const expectedRen = CORNERS[oppositeCorner(corner.id)].point;
    assert.ok(Math.hypot(fight.ren.x - expectedRen.x, fight.ren.y - expectedRen.y) < 1e-12);
    assert.equal(fight.phase, 'centering');
  }
});

test('victory requires both heroes to actually reach the center and fires once', () => {
  const fight = mirrorFight();
  for (let i = 0; i < 4; i++) reflect(fight);
  fight.requestCenter();
  assert.equal(fight.phase, 'centering');
  const events = fight.update(2);
  assert.deepEqual(fight.hero, CENTER);
  assert.deepEqual(fight.ren, CENTER);
  assert.equal(events.filter(event => event.type === 'victory').length, 1);
  assert.deepEqual(fight.update(10), []);
});

test('failed encounter freezes attacks and never emits victory', () => {
  const fight = mirrorFight();
  cast(fight);
  fight.fail();
  const before = fight.castRemaining;
  assert.deepEqual(fight.update(30), []);
  assert.equal(fight.castRemaining, before);
  assert.equal(fight.phase, 'failed');
});

test('retry resets cover destruction and starts from the ranged phase', () => {
  const fight = mirrorFight();
  reflect(fight);
  fight.fail();
  fight.start();
  assert.equal(fight.phase, 'ranged');
  assert.equal(fight.brokenCount, 0);
  assert.equal(fight.bossHealth, FINAL_BOSS.health);
});
