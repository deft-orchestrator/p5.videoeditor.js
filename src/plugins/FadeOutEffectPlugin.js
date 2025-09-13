import EffectBase from '../effects/EffectBase.js';

export class FadeOutEffect extends EffectBase {
  constructor(options = {}) {
    super(options);
    this.duration = options.duration || 500; // Default 500ms fade out
  }

  apply(clip, p, relativeTime) {
    if (relativeTime >= this.start && relativeTime < this.start + this.duration) {
      const effectTime = relativeTime - this.start;
      const t = effectTime / this.duration;
      clip.properties.opacity *= p.lerp(1, 0, t);
    }
  }
}

export const FadeOutEffectPlugin = {
  name: 'FadeOutEffect',
  type: 'effect',
  onLoad: (timeline) => {
    timeline.registerEffectType('fadeOut', FadeOutEffect);
  },
};
