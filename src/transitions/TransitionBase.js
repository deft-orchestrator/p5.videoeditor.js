/**
 * @class TransitionBase
 * @description The foundational class for all transition effects between clips.
 * It provides the core logic for calculating transition progress.
 */
class TransitionBase {
  /**
   * @constructor
   * @param {object} options - The configuration object for the transition.
   * @param {ClipBase} options.fromClip - The clip the transition starts from.
   * @param {ClipBase} options.toClip - The clip the transition ends on.
   * @param {number} options.duration - The duration of the transition in milliseconds.
   */
  constructor({ fromClip, toClip, duration }) {
    if (!fromClip || !toClip) {
      throw new Error(
        'A transition requires both a `fromClip` and a `toClip`.'
      );
    }
    if (typeof duration !== 'number' || duration <= 0) {
      throw new Error('A transition requires a positive `duration`.');
    }

    this.fromClip = fromClip;
    this.toClip = toClip;
    this.duration = duration;

    // By default, a transition is assumed to start exactly when the `toClip` begins.
    // This could be made more flexible in the options later if needed.
    this.start = this.toClip.start;
  }

  /**
   * Calculates the progress of the transition at a given time.
   * The progress is clamped between 0.0 and 1.0.
   * @param {number} time - The current time on the main timeline in milliseconds.
   * @returns {number} The progress of the transition as a value from 0.0 to 1.0.
   */
  getProgress(time) {
    if (time < this.start) {
      return 0.0;
    }
    if (time > this.start + this.duration) {
      return 1.0;
    }
    // Linear progress calculation
    return (time - this.start) / this.duration;
  }

  /**
   * Abstract render method.
   * Subclasses must implement this method to apply the visual transition effect.
   * @param {p5} p - The p5.js instance.
   * @param {number} progress - The current progress of the transition (0.0 to 1.0).
   */
  render(_p, _progress) {
    // This method is intended to be overridden by subclasses.
    // For example, a fade transition would use the progress to control opacity.
    throw new Error(
      'The `render` method must be implemented by a subclass of TransitionBase.'
    );
  }
}

export default TransitionBase;
