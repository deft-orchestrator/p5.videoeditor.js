import EffectBase from '../effects/EffectBase.js';

export class FadeInEffect extends EffectBase {
  constructor(options = {}) {
    super(options);
    this.duration = options.duration || 500; // Default 500ms fade in
  }

  apply(clip, p, relativeTime) {
    if (
      relativeTime >= this.start &&
      relativeTime < this.start + this.duration
    ) {
      const effectTime = relativeTime - this.start;
      const t = effectTime / this.duration;
      // Multiplies the existing opacity, allowing it to fade-in to a keyframed value.
      clip.properties.opacity *= p.lerp(0, 1, t);
    }
  }
}

export const FadeInEffectPlugin = {
  name: 'FadeInEffect',
  type: 'effect',
  onLoad: (timeline) => {
    timeline.registerEffectType('fadeIn', FadeInEffect);
  },
};
