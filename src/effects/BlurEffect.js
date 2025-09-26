import GPUEffectBase from './GPUEffectBase.js';

/**
 * @class BlurEffect
 * @description A two-pass Gaussian blur effect that leverages the GPU.
 * This effect demonstrates a more complex multi-pass post-processing effect.
 * @extends GPUEffectBase
 */
class BlurEffect extends GPUEffectBase {
  /**
   * @constructor
   * @param {object} options - Configuration options for the blur effect.
   * @param {number} [options.radius=5] - The radius of the blur in pixels. Higher values are more blurry.
   */
  constructor(options = {}) {
    super({
      ...options,
      type: 'blur',
      fragUrl: 'src/shaders/blur.frag',
    });
    this.radius = options.radius || 5;
  }

  /**
   * Applies the two-pass blur effect by queuing two separate post-processing steps.
   * @param {ClipBase} clip - The clip being processed.
   * @param {RenderEngine} renderEngine - The render engine instance.
   * @param {number} relativeTime - The current time relative to the clip's start.
   */
  apply(clip, renderEngine, relativeTime) {
    if (
      relativeTime >= this.start &&
      relativeTime < this.start + this.duration
    ) {
      // Ensure the shader is loaded
      renderEngine.loadShader(this.type, this.fragUrl);

      const resolution = Math.max(renderEngine.width, renderEngine.height);

      // Pass 1: Horizontal Blur
      renderEngine.postProcessingEffects.push({
        type: this.type,
        uniforms: {
          u_radius: this.radius,
          u_direction: [1.0, 0.0],
          u_resolution: resolution,
        },
      });

      // Pass 2: Vertical Blur
      renderEngine.postProcessingEffects.push({
        type: this.type,
        uniforms: {
          u_radius: this.radius,
          u_direction: [0.0, 1.0],
          u_resolution: resolution,
        },
      });
    }
  }
}

export default BlurEffect;