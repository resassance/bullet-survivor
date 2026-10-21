import { FinalBossFight, type FightLoadout } from '../gameplay/FinalBossFight';
import { FINAL_BOSS, CORNERS, CENTER, type ArenaPoint, type CornerId } from '../gameplay/finalBossConfig';

interface EncounterCallbacks {
  isPaused: () => boolean;
  getHealth: () => { current: number; max: number };
  onDamage: (amount: number) => boolean;
  onInterlude: () => void;
  onVictory: () => void;
}

export class FinalBossEncounter {
  private readonly fight = new FinalBossFight();
  private readonly element: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly title: HTMLElement;
  private readonly instructions: HTMLElement;
  private readonly status: HTMLElement;
  private readonly health: HTMLElement;
  private readonly bossBar: HTMLProgressElement;
  private readonly castBar: HTMLProgressElement;
  private readonly cornerButtons: HTMLButtonElement[] = [];
  private readonly centerButton: HTMLButtonElement;
  private readonly heldKeys = new Set<string>();
  private visible = false;
  private pointerHeld = false;
  private feedback = '';
  private feedbackTime = 0;

  constructor(privateContainer: HTMLElement, callbacks: EncounterCallbacks) {
    this.container = privateContainer;
    this.callbacks = callbacks;
    this.element = document.createElement('div');
    this.element.className = 'final-boss';
    this.element.inert = true;
    this.element.innerHTML = `
      <canvas class="final-boss-canvas" tabindex="0" aria-label="Арена Войда. WASD или стрелки для уклонения; во второй фазе клавиши 1–4 выбирают угол."></canvas>
      <div class="final-boss-hud">
        <h1 class="final-boss-title"></h1>
        <div class="final-boss-health"></div>
        <progress class="final-boss-health-bar" max="100" value="100" aria-label="Защита Войда"></progress>
        <p class="final-boss-instructions"></p>
      </div>
      <div class="final-boss-warning" role="status" aria-live="polite">
        <p class="final-boss-status"></p>
        <progress class="final-boss-cast" max="1" value="0" aria-label="Подготовка атаки"></progress>
      </div>
      <button type="button" class="final-boss-center">В ЦЕНТР · ПРОБЕЛ</button>
    `;
    this.canvas = this.element.querySelector('.final-boss-canvas')!;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Final boss arena needs a 2D canvas');
    this.context = context;
    this.title = this.element.querySelector('.final-boss-title')!;
    this.instructions = this.element.querySelector('.final-boss-instructions')!;
    this.status = this.element.querySelector('.final-boss-status')!;
    this.health = this.element.querySelector('.final-boss-health')!;
    this.bossBar = this.element.querySelector('.final-boss-health-bar')!;
    this.castBar = this.element.querySelector('.final-boss-cast')!;
    this.centerButton = this.element.querySelector('.final-boss-center')!;
    this.centerButton.addEventListener('click', () => { if (!callbacks.isPaused()) this.fight.requestCenter(); });
    for (const corner of CORNERS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'final-boss-corner';
      button.dataset.corner = String(corner.id);
      button.style.left = `${corner.point.x * 100}%`;
      button.style.top = `${corner.point.y * 100}%`;
      button.addEventListener('click', () => {
        if (callbacks.isPaused()) return;
        this.fight.selectCorner(corner.id);
        this.render();
      });
      this.cornerButtons.push(button);
      this.element.appendChild(button);
    }
    this.canvas.addEventListener('pointerdown', event => {
      if (!this.visible || callbacks.isPaused()) return;
      this.pointerHeld = true;
      this.canvas.setPointerCapture(event.pointerId);
      this.pointerMove(event);
    });
    this.canvas.addEventListener('pointermove', event => {
      if (event.pointerType === 'mouse' || this.pointerHeld) this.pointerMove(event);
    });
    this.canvas.addEventListener('pointerup', () => { this.pointerHeld = false; });
    this.canvas.addEventListener('pointercancel', () => { this.pointerHeld = false; });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', event => this.heldKeys.delete(event.code));
    window.addEventListener('blur', () => this.heldKeys.clear());
    privateContainer.appendChild(this.element);
  }

  private readonly container: HTMLElement;
  private readonly callbacks: EncounterCallbacks;

  public get started(): boolean { return this.fight.phase !== 'idle'; }

  public start(loadout: Partial<FightLoadout>): void {
    this.fight.start(loadout);
    this.feedback = '';
    this.feedbackTime = 0;
    this.setVisible(true);
    this.canvas.focus({ preventScroll: true });
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.element.inert = !visible;
    this.element.classList.toggle('final-boss--visible', visible);
    this.container.classList.toggle('is-final-boss', visible);
    this.heldKeys.clear();
    this.pointerHeld = false;
    if (visible) this.render();
  }

  public reset(): void { this.fight.reset(); this.setVisible(false); }
  public fail(): void { this.fight.fail(); this.heldKeys.clear(); this.render(); }
  public beginMirror(): void { this.fight.beginMirror(); this.heldKeys.clear(); this.render(); }

  public debugAdvance(): void {
    if (this.fight.phase === 'ranged') {
      this.fight.damageBoss(FINAL_BOSS.health);
      this.render();
      this.callbacks.onInterlude();
    }
  }

  public update(delta: number): void {
    if (!this.visible || this.callbacks.isPaused()) return;
    if (this.fight.phase === 'ranged') {
      const dx = Number(this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) - Number(this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft'));
      const dy = Number(this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) - Number(this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp'));
      if (dx || dy) {
        const scale = FINAL_BOSS.moveSpeed * delta / Math.hypot(dx, dy);
        this.fight.aimMovement({ x: this.fight.hero.x + dx * scale, y: this.fight.hero.y + dy * scale });
      }
    }
    this.feedbackTime = Math.max(0, this.feedbackTime - delta);
    for (const event of this.fight.update(delta)) {
      if (this.fight.phase === 'failed') break;
      if (event.type === 'damage' && !this.callbacks.onDamage(event.amount)) { this.fight.fail(); break; }
      if (event.type === 'interlude') this.callbacks.onInterlude();
      if (event.type === 'victory') this.callbacks.onVictory();
      if (event.type === 'reflected' || event.type === 'miss') {
        this.feedback = event.type === 'reflected' ? 'РЕН ОТРАЗИЛ УДАР' : 'РЕН НЕ УСПЕЛ — УДАР ПОВТОРИТСЯ';
        this.feedbackTime = 1;
      }
    }
    this.render();
  }

  private pointerMove(event: PointerEvent): void {
    if (!this.visible || this.callbacks.isPaused()) return;
    const rect = this.canvas.getBoundingClientRect();
    const point = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    if (this.fight.phase === 'ranged') this.fight.aimMovement(point);
    else if (this.pointerHeld) {
      if (this.fight.phase === 'centering' && Math.hypot(point.x - 0.5, point.y - 0.5) < 0.12) this.fight.requestCenter();
      else this.fight.selectCorner(((point.y < 0.5 ? 0 : 2) + (point.x < 0.5 ? 0 : 1)) as CornerId);
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.visible || this.callbacks.isPaused() || event.ctrlKey || event.metaKey || event.altKey) return;
    if (this.fight.phase === 'ranged') {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.code)) {
        event.preventDefault(); this.heldKeys.add(event.code);
      }
      return;
    }
    const number = /^(?:Digit|Numpad)([1-4])$/.exec(event.code);
    if (number) { event.preventDefault(); this.fight.selectCorner((Number(number[1]) - 1) as CornerId); }
    if (['Space', 'Digit5', 'Numpad5'].includes(event.code) && this.fight.phase === 'centering') { event.preventDefault(); this.fight.requestCenter(); }
    const target = { ...this.fight.heroTarget };
    if (['KeyW', 'ArrowUp'].includes(event.code)) target.y = 0.18;
    else if (['KeyS', 'ArrowDown'].includes(event.code)) target.y = 0.82;
    else if (['KeyA', 'ArrowLeft'].includes(event.code)) target.x = 0.18;
    else if (['KeyD', 'ArrowRight'].includes(event.code)) target.x = 0.82;
    else return;
    event.preventDefault();
    this.fight.selectCorner(((target.y < 0.5 ? 0 : 2) + (target.x < 0.5 ? 0 : 1)) as CornerId);
  };

  private render(): void {
    if (!this.visible) return;
    const fight = this.fight;
    this.element.dataset.phase = fight.phase;
    this.element.dataset.target = fight.targetCorner === null ? '' : String(fight.targetCorner);
    this.element.dataset.castX = fight.lockedTarget ? String(fight.lockedTarget.x) : '';
    const mirror = ['mirror', 'centering', 'victory'].includes(fight.phase);
    this.title.textContent = mirror ? 'ВОЙД · ФАЗА 2 · ЗЕРКАЛЬНАЯ СВЯЗЬ' : 'ВОЙД · ФАЗА 1 · ПРОБЕЙТЕ ЗАЩИТУ';
    const hp = this.callbacks.getHealth();
    this.health.textContent = `ЮКИ${mirror ? ' + РЕН' : ''}: ${Math.ceil(hp.current)} / ${hp.max} · ${mirror ? `УКРЫТИЯ: ${fight.brokenCount} / 4` : `ПАТРОНЫ: ${fight.ammo}${fight.reloadRemaining > 0 ? ' · ПЕРЕЗАРЯДКА' : ''}`}`;
    this.bossBar.value = fight.bossHealth;
    this.bossBar.hidden = mirror;
    this.instructions.textContent = mirror ? 'Юки уходит в противоположный угол — Рен встречает удар. Клик / 1–4 / стрелки.' : 'Уклоняйтесь мышью, касанием или WASD. Юки стреляет автоматически, даже при движении.';
    this.centerButton.hidden = fight.phase !== 'centering';
    const status = fight.phase === 'centering' ? 'ЧЕТЫРЕ УДАРА ОТРАЖЕНЫ. СОБЕРИТЕСЬ В ЦЕНТРЕ.'
      : this.feedbackTime > 0 ? this.feedback
      : fight.targetCorner !== null ? `ВОЙД ЦЕЛИТСЯ: ${CORNERS[fight.targetCorner].name}`
      : fight.lockedTarget ? (fight.attackKind === 'beam' ? 'ЛУЧ: УЙДИТЕ ИЗ КРАСНОЙ ПОЛОСЫ' : 'ПРИЦЕЛЬНЫЙ ЗАЛП: СМЕНИТЕ ПОЗИЦИЮ')
      : mirror ? 'СЛЕДИТЕ ЗА НАПРАВЛЕНИЕМ УДАРА' : 'ЩИТ ВОЙДА ТРЕСНЕТ ПРИ 30%';
    if (this.status.textContent !== status) this.status.textContent = status;
    this.castBar.value = fight.castDuration > 0 ? Math.max(0, 1 - fight.castRemaining / fight.castDuration) : 0;
    this.castBar.hidden = fight.castRemaining <= 0;
    for (const corner of CORNERS) {
      const button = this.cornerButtons[corner.id];
      button.hidden = !mirror;
      button.classList.toggle('final-boss-corner--target', fight.targetCorner === corner.id);
      button.classList.toggle('final-boss-corner--broken', fight.destroyed[corner.id]);
      button.setAttribute('aria-pressed', String(Math.hypot(fight.heroTarget.x - corner.point.x, fight.heroTarget.y - corner.point.y) < 0.01));
      button.textContent = `${corner.name} · ${corner.id + 1}${fight.destroyed[corner.id] ? '\nРАЗРУШЕНО · МОЖНО ВСТАТЬ' : ''}`;
    }
    this.draw(mirror);
  }

  private draw(mirror: boolean): void {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    const ratio = Math.min(window.devicePixelRatio, 2);
    if (this.canvas.width !== Math.round(width * ratio) || this.canvas.height !== Math.round(height * ratio)) {
      this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio);
    }
    const ctx = this.context;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = '#11151c'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#232b36'; ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      ctx.beginPath(); ctx.moveTo(width * i / 10, 0); ctx.lineTo(width * i / 10, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, height * i / 10); ctx.lineTo(width, height * i / 10); ctx.stroke();
    }
    const fight = this.fight;
    if (mirror) {
      for (const corner of CORNERS) {
        const x = corner.point.x * width, y = corner.point.y * height;
        ctx.fillStyle = fight.destroyed[corner.id] ? '#252831' : '#414855';
        ctx.fillRect(x - width * 0.11, y - height * 0.055, width * 0.22, height * 0.11);
        if (fight.destroyed[corner.id]) {
          ctx.strokeStyle = '#78818d'; ctx.beginPath(); ctx.moveTo(x - 20, y + 12); ctx.lineTo(x, y - 8); ctx.lineTo(x + 20, y + 10); ctx.stroke();
        }
      }
      if (fight.targetCorner !== null) this.drawAttack(fight.boss, CORNERS[fight.targetCorner].point, width, height);
    } else if (fight.lockedTarget) {
      if (fight.attackKind === 'beam') {
        ctx.fillStyle = 'rgba(255, 77, 87, 0.24)';
        ctx.fillRect((fight.lockedTarget.x - FINAL_BOSS.beamHalfWidth) * width, height * 0.34, width * FINAL_BOSS.beamHalfWidth * 2, height * 0.62);
      } else this.drawAttack(fight.boss, fight.lockedTarget, width, height);
    }
    ctx.fillStyle = '#e26778';
    ctx.beginPath(); ctx.ellipse(fight.boss.x * width, fight.boss.y * height, width * 0.045, height * 0.045, 0, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('ВОЙД', fight.boss.x * width, fight.boss.y * height + 5);
    for (const shot of fight.projectiles) {
      ctx.fillStyle = shot.hostile ? '#ff6a55' : '#bca2ff';
      ctx.beginPath(); ctx.ellipse(shot.x * width, shot.y * height, width * 0.006, height * 0.006, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (fight.phase === 'centering' || fight.phase === 'victory') {
      ctx.strokeStyle = '#f3ce81'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(CENTER.x * width, CENTER.y * height, width * 0.08, height * 0.08, 0, 0, Math.PI * 2); ctx.stroke();
    }
    this.drawHero(fight.hero, '#b8a0eb', 'ЮКИ', width, height);
    if (mirror) this.drawHero(fight.ren, '#80d8b0', 'РЕН', width, height);
    if (fight.shieldFlash > 0 && mirror) {
      ctx.strokeStyle = '#adffe0'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(fight.ren.x * width, fight.ren.y * height, width * 0.05, height * 0.05, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  private drawAttack(from: ArenaPoint, to: ArenaPoint, width: number, height: number): void {
    const ctx = this.context;
    ctx.strokeStyle = '#ff5965'; ctx.lineWidth = 4; ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.moveTo(from.x * width, from.y * height); ctx.lineTo(to.x * width, to.y * height); ctx.stroke(); ctx.setLineDash([]);
  }

  private drawHero(point: ArenaPoint, color: string, name: string, width: number, height: number): void {
    const ctx = this.context, x = point.x * width, y = point.y * height;
    ctx.fillStyle = color; ctx.fillRect(x - width * 0.015, y - height * 0.02, width * 0.03, height * 0.04);
    ctx.beginPath(); ctx.ellipse(x, y - height * 0.033, width * 0.012, height * 0.012, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(name, x, y + height * 0.045);
  }
}
