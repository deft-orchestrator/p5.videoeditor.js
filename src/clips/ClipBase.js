import Keyframe from '../core/Keyframe.js';
import Easing from '../utils/Easing.js';
import ErrorHandler from '../utils/ErrorHandler.js';

/**
 * @class ClipBase
 * @description The fundamental building block for all media types on the timeline.
 * It manages common properties like timing, position, rotation, scale, and opacity,
 * as well as the keyframe and effects systems. This class is not intended to be used
 * directly but rather to be extended by specific clip types (e.g., TextClip, ImageClip).
 */
class ClipBase {
  /**
   * @constructor
   * @param {object} [options={}] - The configuration object for the clip.
   * @param {number} [options.start=0] - The start time of the clip on the timeline, in milliseconds.
   * @param {number} [options.duration=1000] - The duration of the clip, in milliseconds.
   * @param {number} [options.layer=0] - The layer order for rendering. Higher numbers are rendered on top.
   * @param {string|null} [options.assetKey=null] - A key to identify the asset associated with this clip, used for memory management.
   * @param {object} [options.properties={}] - Initial values for animatable properties (e.g., x, y, rotation, scale, opacity).
   */
  constructor({ start = 0, duration = 1000, layer = 0, assetKey = null, ...options } = {}) {
    this.start = start;
    this.duration = duration;
    this.layer = layer;
    this.assetKey = assetKey;
    this.timeline = null;

    this.properties = {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      ...(options.properties || {}),
    };

    this.initialProperties = JSON.parse(JSON.stringify(this.properties));
    this.keyframes = {};
    this.effects = [];
  }

  /**
   * Adds a keyframe for a specific property.
   * @param {string} property - The name of the property to animate (e.g., 'x', 'opacity').
   * @param {number} time - The time for this keyframe, relative to the clip's start time, in milliseconds.
   * @param {*} value - The value of the property at this keyframe.
   * @param {string} [easing='linear'] - The easing function to use for the transition from the previous keyframe.
   * @throws {Error} If the specified property is not a recognized animatable property of the clip.
   */
  addKeyframe(property, time, value, easing = 'linear') {
    if (!Object.prototype.hasOwnProperty.call(this.properties, property)) {
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

  /**
   * Adds an effect to the clip.
   * @param {EffectBase} effect - An instance of a class that extends EffectBase.
   */
  addEffect(effect) {
    this.effects.push(effect);
  }

  /**
   * Sorts the keyframes for all properties. This is called by the timeline after
   * a batch update operation to ensure keyframes are in the correct chronological order.
   */
  finalizeChanges() {
    for (const prop in this.keyframes) {
      if (Object.prototype.hasOwnProperty.call(this.keyframes, prop)) {
        this.keyframes[prop].sort((a, b) => a.time - b.time);
      }
    }
  }

  /**
   * Updates the clip's properties based on the current time.
   * This involves resetting properties, calculating values from keyframes, and applying effects.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration, in milliseconds.
   */
  update(p, relativeTime) {
    Object.assign(this.properties, this.initialProperties);

    for (const prop in this.keyframes) {
      if (Object.prototype.hasOwnProperty.call(this.keyframes, prop)) {
        this.properties[prop] = this._calculateValue(p, prop, relativeTime);
      }
    }

    this.effects.forEach(effect => {
      effect.apply(this, p, relativeTime);
    });
  }

  /**
   * Calculates the interpolated value for a property at a given time.
   * @private
   * @param {p5} p - The p5.js instance.
   * @param {string} prop - The name of the property to calculate.
   * @param {number} time - The current time within the clip's duration.
   * @returns {*} The interpolated value of the property.
   */
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

    let low = 0;
    let high = kfs.length - 1;
    let prevKeyframeIndex = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (kfs[mid].time < time) {
        prevKeyframeIndex = mid;
        low = mid + 1;
      } else if (kfs[mid].time > time) {
        high = mid - 1;
      } else {
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

  /**
   * Renders the clip's base transformations (translation, rotation, scale).
   * Subclasses are responsible for the actual drawing of content (e.g., text, image).
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    p.push();
    p.translate(this.properties.x, this.properties.y);
    p.rotate(this.properties.rotation);
    p.scale(this.properties.scale);
  }
}

export default ClipBase;
