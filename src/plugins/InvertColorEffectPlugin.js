import EffectBase from '../effects/EffectBase.js';

/**
 * @class InvertColorEffect
 * @description A simple effect that inverts the colors of the clip it's applied to.
 * This serves as a clear example of a custom effect plugin.
 * @extends EffectBase
 */
export class InvertColorEffect extends EffectBase {
  constructor(options = {}) {
    super(options);
  }

  /**
   * Applies the color inversion effect.
   * @param {ClipBase} clip - The clip being processed.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time relative to the clip's start.
   */
  apply(clip, p, relativeTime) {
    // Apply the effect only within its active duration
    if (relativeTime >= this.start && relativeTime < this.start + this.duration) {
      p.filter(p.INVERT);
    }
  }
}

/**
 * @constant InvertColorEffectPlugin
 * @description The plugin object that allows the InvertColorEffect to be registered with the editor.
 * @example
 * // In your p5.js sketch:
 * import { InvertColorEffectPlugin } from './path/to/InvertColorEffectPlugin.js';
 * editor.use(InvertColorEffectPlugin);
 *
 * // Now you can use the 'invert' effect on any clip:
 * myClip.addEffect('invert', { start: 0, duration: 1000 });
 */
export const InvertColorEffectPlugin = {
  name: 'InvertColorEffect',
  type: 'effect',
  onLoad: (timeline) => {
    timeline.registerEffectType('invert', InvertColorEffect);
  },
};