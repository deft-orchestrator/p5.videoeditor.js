// A collection of easing functions.
// Based on https://gist.github.com/gre/1650294
const Easing = {
  // no easing, no acceleration
  linear: t => t,
  // accelerating from zero velocity
  easeInQuad: t => t*t,
  // decelerating to zero velocity
  easeOutQuad: t => t*(2-t),
  // acceleration until halfway, then deceleration
  easeInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
  // accelerating from zero velocity
  easeInCubic: t => t*t*t,
  // decelerating to zero velocity
  easeOutCubic: t => (--t)*t*t+1,
  // acceleration until halfway, then deceleration
  easeInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
};

export default Easing;
