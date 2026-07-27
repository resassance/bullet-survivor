import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  GlitchEffect,
  GlitchMode,
  BlendFunction,
} from 'postprocessing';

export class PostProcessing {
  private composer: EffectComposer;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    const bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      intensity: 1.3,
      luminanceThreshold: 0.22,
      luminanceSmoothing: 0.3,
      mipmapBlur: true,
      radius: 0.8,
    });

    const glitch = new GlitchEffect({
      delay: new THREE.Vector2(3, 8),
      duration: new THREE.Vector2(0.04, 0.12),
      strength: new THREE.Vector2(0.02, 0.06),
      ratio: 0.9,
    });
    glitch.mode = GlitchMode.SPORADIC;

    this.composer.addPass(new EffectPass(camera, bloom, glitch));
  }

  public resize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  public render(delta: number): void {
    this.composer.render(delta);
  }
}
