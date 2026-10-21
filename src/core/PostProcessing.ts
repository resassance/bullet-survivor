import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, HueSaturationEffect, BlendFunction } from 'postprocessing';
import { ATMOSPHERE, type LightingMode } from '../world/lightingProfiles';

export class PostProcessing {
  private composer: EffectComposer;
  private bloom: BloomEffect;
  private vignette: VignetteEffect;
  private renderer: THREE.WebGLRenderer;
  private mode: LightingMode = 'checkpoint';

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    renderer.toneMappingExposure = ATMOSPHERE.checkpoint.exposure;
    this.composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      intensity: ATMOSPHERE.checkpoint.bloom,
      luminanceThreshold: 1,
      luminanceSmoothing: 0.25,
      mipmapBlur: true,
      radius: 0.65,
      resolutionScale: 0.5,
    });
    this.composer.addPass(new EffectPass(camera, this.bloom));
    this.vignette = new VignetteEffect({ offset: 0.3, darkness: ATMOSPHERE.checkpoint.vignette });
    this.composer.addPass(new EffectPass(camera,
      new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
      new HueSaturationEffect({ saturation: -0.12 }),
      this.vignette,
    ));
  }

  public setLightingMode(mode: LightingMode): void { this.mode = mode; }

  public resize(width: number, height: number): void { this.composer.setSize(width, height); }

  public render(delta: number): void {
    const profile = ATMOSPHERE[this.mode];
    const blend = 1 - Math.exp(-4 * delta);
    this.renderer.toneMappingExposure += (profile.exposure - this.renderer.toneMappingExposure) * blend;
    this.bloom.intensity += (profile.bloom - this.bloom.intensity) * blend;
    this.vignette.darkness += (profile.vignette - this.vignette.darkness) * blend;
    this.composer.render(delta);
  }
}
