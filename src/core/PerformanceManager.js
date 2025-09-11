/**
 * @class PerformanceManager
 * @description Monitors application performance, primarily frame rate.
 */
class PerformanceManager {
  /**
   * @constructor
   * @param {object} options - Configuration options.
   * @param {number} [options.frameRateThreshold=45] - The frame rate below which a warning is logged.
   */
  constructor({ frameRateThreshold = 45 } = {}) {
    this.frameRateThreshold = frameRateThreshold;
    this.enabled = true;
  }

  /**
   * @method monitor
   * @description Checks the current frame rate and logs a warning if it's below the threshold.
   * @param {object} p5 - The p5.js instance.
   */
  monitor(p5) {
    if (!this.enabled || !p5) {
      return;
    }

    const currentFrameRate = p5.frameRate();
    if (currentFrameRate < this.frameRateThreshold) {
      console.warn(
        `PerformanceWarning: Frame rate is ${currentFrameRate.toFixed(2)} FPS, which is below the threshold of ${this.frameRateThreshold} FPS.`
      );
    }
  }

  /**
   * @method enable
   * @description Enables the performance monitor.
   */
  enable() {
    this.enabled = true;
  }

  /**
   * @method disable
   * @description Disables the performance monitor.
   */
  disable() {
    this.enabled = false;
  }
}

export default PerformanceManager;
