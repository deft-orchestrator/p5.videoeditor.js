class Keyframe {
  /**
   * @param {number} time - The time in milliseconds, relative to the clip's start.
   * @param {*} value - The value of the property at this keyframe.
   * @param {string} [easing='linear'] - The easing function to use from this keyframe to the next.
   */
  constructor(time, value, easing = 'linear') {
    this.time = time;
    this.value = value;
    this.easing = easing;
  }
}

export default Keyframe;
