/**
 * HP-бар игрока — простой DOM-оверлей поверх canvas.
 * Рисовать HUD внутри Three.js-сцены избыточно и дороже;
 * для плоского 2D-интерфейса (HP, счёт, уровень) DOM+CSS проще
 * и на порядок дешевле по производительности.
 */
export class HpBar {
  private fillElement: HTMLDivElement;

  constructor(container: HTMLElement) {
    const wrapper = document.createElement('div');
    wrapper.className = 'hp-bar';

    this.fillElement = document.createElement('div');
    this.fillElement.className = 'hp-bar-fill';

    wrapper.appendChild(this.fillElement);
    container.appendChild(wrapper);
  }

  public update(current: number, max: number): void {
    const ratio = Math.max(0, Math.min(1, current / max));
    this.fillElement.style.width = `${ratio * 100}%`;

    // Ближе к смерти — бар краснеет резче, усиливая тревожность
    this.fillElement.classList.toggle('hp-bar-fill--critical', ratio <= 0.3);
  }
}
