class EffectBase {
  /**
   * @param {object} options - Effect options.
   * @param {number} [options.start=0] - The start time of the effect, relative to the clip's start.
   * @param {number} [options.duration=1000] - The duration of the effect.
   */
  constructor({ start = 0, duration = 1000 } = {}) {
    this.start = start;
    this.duration = duration;
  }

  /**
   * Apply the effect to a clip. This method is meant to be overridden by subclasses.
   * @param {ClipBase} clip - The clip instance to apply the effect to.
   * @param {p5} p - The p5 instance.
   * @param {number} relativeTime - The current time relative to the clip's start.
   */
  apply(clip, p, relativeTime) {
    // Subclasses will implement the actual effect logic here.
  }
}

export default EffectBase;
