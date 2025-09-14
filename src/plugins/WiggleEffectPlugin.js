import EffectBase from '../effects/EffectBase.js';

/**
 * @class WiggleEffect
 * @extends EffectBase
 * @description Applies a procedural "wiggle" to a clip's position using Perlin noise.
 * This is a CPU-based effect that modifies clip properties before rendering.
 */
class WiggleEffect extends EffectBase {
  /**
   * @constructor
   * @param {object} [options={}] - Configuration options.
   * @param {number} [options.frequency=1] - The speed of the wiggle. Higher values are faster.
   * @param {number} [options.amplitude=10] - The maximum distance the clip will move from its original position, in pixels.
   */
  constructor({ frequency = 1, amplitude = 10, ...baseOptions } = {}) {
    super(baseOptions);
    this.frequency = frequency;
    this.amplitude = amplitude;
  }

  /**
   * Applies the wiggle effect by modifying the clip's x and y properties.
   * @param {p5} p - The p5.js instance.
   * @param {ClipBase} clip - The clip to which the effect is being applied.
   */
  apply(p, clip) {
    // Use the p5.js millis() function for a continuous time value, scaled by frequency.
    // Dividing by 1000 converts it to seconds for more manageable frequency values.
    const time = (p.millis() / 1000) * this.frequency;

    // Use Perlin noise to generate smooth, random-like values between 0 and 1.
    // We use different "seeds" for x and y by adding a large offset to the noise input
    // to ensure the motion is not just diagonal.
    const noiseX = p.noise(time);
    const noiseY = p.noise(time + 10000); // Large offset for a different noise value

    // Map the noise value from its original [0, 1] range to [-1, 1]
    const offsetX = (noiseX * 2 - 1) * this.amplitude;
    const offsetY = (noiseY * 2 - 1) * this.amplitude;

    // Add the calculated offset to the clip's current properties.
    // This is non-destructive because properties are reset from keyframes
    // in the ClipBase.update() method on every frame.
    clip.properties.x += offsetX;
    clip.properties.y += offsetY;
  }
}

/**
 * @type {object}
 * @name WiggleEffectPlugin
 * @description The plugin object for the WiggleEffect.
 * This object is what users will register with the timeline.
 */
export const WiggleEffectPlugin = {
  name: 'WiggleEffect',
  type: 'effect',
  onLoad: (timeline) => {
    timeline.registerEffectType('wiggle', WiggleEffect);
  },
};
