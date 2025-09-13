import EffectBase from './EffectBase.js';

/**
 * @class BrightnessContrastEffect
 * @extends EffectBase
 * @description A GPU-based effect to adjust brightness and contrast.
 */
class BrightnessContrastEffect extends EffectBase {
  /**
   * @constructor
   * @param {object} [options={}] - Configuration options.
   * @param {number} [options.brightness=0.0] - Brightness adjustment (-1 to 1).
   * @param {number} [options.contrast=0.0] - Contrast adjustment (-1 to 1).
   */
  constructor({ brightness = 0.0, contrast = 0.0, ...baseOptions } = {}) {
    super(baseOptions);
    this.type = 'BrightnessContrast';
    this.brightness = brightness;
    this.contrast = contrast;
  }

  /**
   * Signals the RenderEngine to apply this effect by adding itself to the post-processing queue.
   * This method is called by the RenderEngine during the main render pass.
   * @param {p5} p - The p5.js instance (or graphics buffer).
   * @param {ClipBase} clip - The clip to which the effect is being applied.
   */
  apply(p, clip) {
    // Add this effect instance to the engine's queue for this frame.
    // The engine will then use its data (brightness, contrast) in the shader pass.
    if (clip.timeline && clip.timeline.renderEngine) {
      clip.timeline.renderEngine.postProcessingEffects.push(this);
    }
  }
}

export default BrightnessContrastEffect;
