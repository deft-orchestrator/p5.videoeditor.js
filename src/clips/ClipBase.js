import Keyframe from '../core/Keyframe.js';
import Easing from '../utils/Easing.js';

class ClipBase {
  constructor({ start = 0, duration = 1000, layer = 0, ...options } = {}) {
    this.start = start;
    this.duration = duration;
    this.layer = layer;

    this.properties = {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      ...options,
    };

    // Store a copy of the initial properties to reset to on each frame
    this.initialProperties = JSON.parse(JSON.stringify(this.properties));

    this.keyframes = {};
    this.effects = [];
  }

  addKeyframe(property, time, value, easing = 'linear') {
    if (!this.properties.hasOwnProperty(property)) {
      console.warn(`Property "${property}" is not a recognized property of this clip.`);
    }
    if (!this.keyframes[property]) {
      this.keyframes[property] = [];
    }
    this.keyframes[property].push(new Keyframe(time, value, easing));
    this.keyframes[property].sort((a, b) => a.time - b.time);
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  update(p, relativeTime) {
    // 1. Reset all properties to their initial values
    Object.assign(this.properties, this.initialProperties);

    // 2. Calculate new values based on keyframes
    for (const prop in this.keyframes) {
      if (this.keyframes.hasOwnProperty(prop)) {
        this.properties[prop] = this._calculateValue(p, prop, relativeTime);
      }
    }

    // 3. Apply effects, which modify the calculated properties
    this.effects.forEach(effect => {
      effect.apply(this, p, relativeTime);
    });
  }

  _calculateValue(p, prop, time) {
    const kfs = this.keyframes[prop];
    if (!kfs || kfs.length === 0) {
      return this.initialProperties[prop];
    }

    if (time <= kfs[0].time) {
      return kfs[0].value;
    }

    if (time >= kfs[kfs.length - 1].time) {
      return kfs[kfs.length - 1].value;
    }

    let prevKeyframe = kfs[0];
    let nextKeyframe = kfs[kfs.length - 1];
    for (let i = 0; i < kfs.length - 1; i++) {
      if (time >= kfs[i].time && time <= kfs[i + 1].time) {
        prevKeyframe = kfs[i];
        nextKeyframe = kfs[i + 1];
        break;
      }
    }

    const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
    const easingFunction = Easing[prevKeyframe.easing] || Easing.linear;
    const easedT = easingFunction(t);

    return p.lerp(prevKeyframe.value, nextKeyframe.value, easedT);
  }

  render(p, relativeTime) {
    p.push();
    p.translate(this.properties.x, this.properties.y);
    p.rotate(this.properties.rotation);
    p.scale(this.properties.scale);
    // Note: opacity must be handled in the subclass renderers
  }
}

export default ClipBase;
