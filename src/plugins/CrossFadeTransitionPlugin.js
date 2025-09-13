import TransitionBase from '../transitions/TransitionBase.js';

/**
 * @class CrossFadeTransition
 * @extends TransitionBase
 * @description A transition that fades out the `fromClip` while fading in the `toClip`.
 */
export class CrossFadeTransition extends TransitionBase {
  /**
   * @constructor
   * @param {object} options - The configuration object for the transition.
   *                          Inherits options from TransitionBase.
   */
  constructor(options) {
    super(options);
  }

  /**
   * Renders the cross-fade effect by adjusting the opacity of the two clips.
   * This method is called by the timeline's render loop when the transition is active.
   * @param {p5} p - The p5.js instance.
   * @param {number} time - The current time on the main timeline in milliseconds.
   */
  render(p, time) {
    const progress = this.getProgress(time);

    // Store the original opacities to ensure the transition is non-destructive.
    const fromClipOpacity = this.fromClip.properties.opacity;
    const toClipOpacity = this.toClip.properties.opacity;

    try {
      // Apply the transitional opacity.
      this.fromClip.properties.opacity = fromClipOpacity * (1 - progress);
      this.toClip.properties.opacity = toClipOpacity * progress;

      // Apply effects for both clips before rendering them.
      const fromRelativeTime = time - this.fromClip.start;
      for (const effect of this.fromClip.effects) {
        effect.apply(this.fromClip, p, fromRelativeTime);
      }
      this.fromClip.render(p, fromRelativeTime);

      const toRelativeTime = time - this.toClip.start;
      for (const effect of this.toClip.effects) {
        effect.apply(this.toClip, p, toRelativeTime);
      }
      this.toClip.render(p, toRelativeTime);

    } finally {
      // IMPORTANT: Restore the original opacities after rendering.
      this.fromClip.properties.opacity = fromClipOpacity;
      this.toClip.properties.opacity = toClipOpacity;
    }
  }
}

/**
 * @type {object}
 * @name CrossFadeTransitionPlugin
 * @description The plugin object for the CrossFadeTransition.
 * This object is what users will register with the timeline.
 */
export const CrossFadeTransitionPlugin = {
  name: 'CrossFadeTransition',
  type: 'transition',
  onLoad: (timeline) => {
    timeline.registerTransitionType('crossfade', CrossFadeTransition);
  }
};
