/**
 * @class EffectBase
 * @description The abstract base class for all visual effects.
 * It defines the standard interface that all effects must implement.
 */
class EffectBase {
  /**
   * @constructor
   * @param {object} [options={}] - Configuration options for the effect.
   * @param {number} [options.start=0] - The start time of the effect, relative to the clip's start, in milliseconds.
   * @param {number} [options.duration=1000] - The duration of the effect in milliseconds.
   */
  constructor({ start = 0, duration = 1000 } = {}) {
    this.start = start;
    this.duration = duration;
  }

  /**
   * Abstract method to apply the effect.
   * This method must be implemented by any class that extends EffectBase.
   * @param {ClipBase} clip - The clip to which the effect is being applied.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration, in milliseconds.
   */
  apply(clip, p, relativeTime) {
    throw new Error('The "apply()" method must be implemented by a subclass.');
  }
}

export default EffectBase;
