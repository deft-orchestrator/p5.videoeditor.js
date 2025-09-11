import EffectBase from './EffectBase.js';

export class FadeInEffect extends EffectBase {
  apply(clip, p, relativeTime) {
    if (relativeTime >= this.start && relativeTime < this.start + this.duration) {
      const effectTime = relativeTime - this.start;
      const t = effectTime / this.duration;
      // This assumes the keyframe calculation for opacity has already happened.
      // It modifies the result.
      clip.properties.opacity *= p.lerp(0, 1, t);
    }
  }
}

export class FadeOutEffect extends EffectBase {
  apply(clip, p, relativeTime) {
    if (relativeTime >= this.start && relativeTime < this.start + this.duration) {
      const effectTime = relativeTime - this.start;
      const t = effectTime / this.duration;
      clip.properties.opacity *= p.lerp(1, 0, t);
    }
  }
}
