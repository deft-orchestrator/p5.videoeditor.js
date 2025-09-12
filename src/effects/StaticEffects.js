import EffectBase from './EffectBase.js';

/**
 * @class FadeInEffect
 * @extends EffectBase
 * @description Applies a fade-in effect to a clip by animating its opacity property from 0 to its current value.
 *
 * @example
 * let clip = editor.createTextClip("Fading In");
 * clip.addEffect(new FadeInEffect({ duration: 1000 }));
 */
export class FadeInEffect extends EffectBase {
  /**
   * Applies the fade-in logic to the clip's opacity.
   * @param {ClipBase} clip - The clip to apply the effect to.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip.
   */
  apply(clip, p, relativeTime) {
    if (relativeTime >= this.start && relativeTime < this.start + this.duration) {
      const effectTime = relativeTime - this.start;
      const t = effectTime / this.duration;
      // Multiplies the existing opacity, allowing it to fade-in to a keyframed value.
      clip.properties.opacity *= p.lerp(0, 1, t);
    }
  }
}

/**
 * @class FadeOutEffect
 * @extends EffectBase
 * @description Applies a fade-out effect to a clip by animating its opacity property from its current value to 0.
 *
 * @example
 * let clip = editor.createTextClip("Fading Out");
 * // Fade out over the last second of a 5-second clip
 * clip.addEffect(new FadeOutEffect({ start: 4000, duration: 1000 }));
 */
export class FadeOutEffect extends EffectBase {
  /**
   * Applies the fade-out logic to the clip's opacity.
   * @param {ClipBase} clip - The clip to apply the effect to.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip.
   */
  apply(clip, p, relativeTime) {
    if (relativeTime >= this.start && relativeTime < this.start + this.duration) {
      const effectTime = relativeTime - this.start;
      const t = effectTime / this.duration;
      clip.properties.opacity *= p.lerp(1, 0, t);
    }
  }
}
