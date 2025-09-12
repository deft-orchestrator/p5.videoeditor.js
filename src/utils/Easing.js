/**
 * @namespace Easing
 * @description A collection of easing functions for controlling animation speed.
 * These functions take a single argument `t` (time) which is a value between 0 and 1,
 * and return a new value, also between 0 and 1.
 * Based on the work of Grégoire Divaret-Chauveau.
 * @see {@link https://gist.github.com/gre/1650294}
 */
const Easing = {
  /**
   * No easing, no acceleration.
   * @param {number} t - Time.
   * @returns {number}
   */
  linear: t => t,
  /**
   * Accelerating from zero velocity.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeInQuad: t => t*t,
  /**
   * Decelerating to zero velocity.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeOutQuad: t => t*(2-t),
  /**
   * Acceleration until halfway, then deceleration.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
  /**
   * Accelerating from zero velocity.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeInCubic: t => t*t*t,
  /**
   * Decelerating to zero velocity.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeOutCubic: t => (--t)*t*t+1,
  /**
   * Acceleration until halfway, then deceleration.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
};

export default Easing;
