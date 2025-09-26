import EffectBase from './EffectBase.js';
import ErrorHandler from '../utils/ErrorHandler.js';

/**
 * @class GPUEffectBase
 * @description A base class for GPU-accelerated post-processing effects.
 * This class handles the interaction with the RenderEngine's post-processing pipeline.
 * @extends EffectBase
 */
class GPUEffectBase extends EffectBase {
  /**
   * @constructor
   * @param {object} options - Configuration options for the effect.
   * @param {string} options.type - The unique type name of the effect, matching its shader key.
   * @param {string} options.fragUrl - The URL to the fragment shader file.
   */
  constructor(options = {}) {
    super(options);
    if (!options.type || !options.fragUrl) {
      ErrorHandler.critical(
        'GPUEffectBase requires a `type` and `fragUrl` in its options.'
      );
    }
    this.type = options.type;
    this.fragUrl = options.fragUrl;
    this.uniforms = options.uniforms || {};
  }

  /**
   * Applies the GPU effect by queuing it in the RenderEngine.
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

      // Add this effect to the post-processing queue for this frame
      renderEngine.postProcessingEffects.push({
        type: this.type,
        uniforms: this.getUniforms(relativeTime),
      });
    }
  }

  /**
   * Returns the uniforms to be passed to the shader for the current frame.
   * This method can be overridden by subclasses to compute dynamic uniforms.
   * @param {number} relativeTime - The current time relative to the clip's start.
   * @returns {object} An object containing the shader uniforms.
   */
  getUniforms(relativeTime) {
    return this.uniforms;
  }
}

export default GPUEffectBase;