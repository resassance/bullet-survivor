import * as THREE from 'three';
import { RENDERER } from '../utils/constants';

/**
 * Оборачивает THREE.WebGLRenderer.
 * Отвечает за инициализацию рендерера и адаптивный resize,
 * включая фикс для мобильных браузеров, где 100vh "плавает"
 * из-за скрывающейся адресной строки.
 */
export class RendererManager {
  public readonly renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: RENDERER.ANTIALIAS,
      powerPreference: 'high-performance',
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, RENDERER.MAX_PIXEL_RATIO)
    );

    this.applyViewportFix();
    this.resize();
  }

  /**
   * Фикс для мобильных браузеров: реальная высота вьюпорта
   * записывается в CSS-переменную --vh, т.к. `100vh` в Safari/Chrome
   * mobile не учитывает динамическую адресную строку.
   */
  private applyViewportFix(): void {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
  }

  public get aspect(): number {
    return window.innerWidth / window.innerHeight;
  }

  public render(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.renderer.render(scene, camera);
  }
}
