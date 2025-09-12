import Keyframe from '../core/Keyframe.js';
import Easing from '../utils/Easing.js';
import ErrorHandler from '../utils/ErrorHandler.js';

class ClipBase {
  constructor({ start = 0, duration = 1000, layer = 0, assetKey = null, ...options } = {}) {
    this.start = start;
    this.duration = duration;
    this.layer = layer;
    this.assetKey = assetKey;
    this.timeline = null; // Will be set by the timeline upon adding

    this.properties = {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      ...(options.properties || {}),
    };

    // Store a copy of the initial properties to reset to on each frame
    this.initialProperties = JSON.parse(JSON.stringify(this.properties));

    this.keyframes = {};
    this.effects = [];
  }

  addKeyframe(property, time, value, easing = 'linear') {
    if (!Object.prototype.hasOwnProperty.call(this.properties, property)) {
      // Fail-fast: Throw a critical error if the property doesn't exist.
      throw new Error(`Property "${property}" is not a recognized or animatable property of this clip.`);
    }

    if (!this.keyframes[property]) {
      this.keyframes[property] = [];
    }
    this.keyframes[property].push(new Keyframe(time, value, easing));

    if (this.timeline && this.timeline.isBatching) {
      this.timeline.dirtyClips.add(this);
    } else {
      this.keyframes[property].sort((a, b) => a.time - b.time);
    }
  }

  addEffect(effect) {
    this.effects.push(effect);
  }

  finalizeChanges() {
    // Sort all keyframe arrays that might have been modified during a batch operation
    for (const prop in this.keyframes) {
      if (Object.prototype.hasOwnProperty.call(this.keyframes, prop)) {
        this.keyframes[prop].sort((a, b) => a.time - b.time);
      }
    }
  }

  update(p, relativeTime) {
    // 1. Reset all properties to their initial values
    Object.assign(this.properties, this.initialProperties);

    // 2. Calculate new values based on keyframes
    for (const prop in this.keyframes) {
      if (Object.prototype.hasOwnProperty.call(this.keyframes, prop)) {
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

    // Handle edge cases: time is before the first keyframe or after the last one
    if (time <= kfs[0].time) {
      return kfs[0].value;
    }
    if (time >= kfs[kfs.length - 1].time) {
      return kfs[kfs.length - 1].value;
    }

    // Binary search to find the index of the keyframe just before the current time
    let low = 0;
    let high = kfs.length - 1;
    let prevKeyframeIndex = 0; // Will hold the index of the keyframe to the left

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (kfs[mid].time < time) {
        prevKeyframeIndex = mid;
        low = mid + 1;
      } else if (kfs[mid].time > time) {
        high = mid - 1;
      } else {
        // Exact match found, return the value directly
        return kfs[mid].value;
      }
    }

    const prevKeyframe = kfs[prevKeyframeIndex];
    const nextKeyframe = kfs[prevKeyframeIndex + 1];

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
