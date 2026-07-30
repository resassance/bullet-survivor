export class WeaponIndicator {
  private element: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'weapon-indicator';
    container.appendChild(this.element);
  }

  public update(weaponName: string, specialName: string | null, specialCooldownRatio: number): void {
    if (specialName) {
      const percent = Math.round(specialCooldownRatio * 100);
      this.element.textContent = `${weaponName} · ${specialName} ${percent}%`;
    } else {
      this.element.textContent = weaponName;
    }
  }
}
