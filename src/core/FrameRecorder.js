/**
 * @class FrameRecorder
 * @description A class responsible for capturing and storing frames from a p5.js canvas.
 */
class FrameRecorder {
  /**
   * @param {HTMLCanvasElement} canvas - The p5.js canvas element to capture frames from.
   */
  constructor(canvas) {
    if (!canvas || typeof canvas.toDataURL !== 'function') {
      throw new Error('A valid canvas element must be provided to the FrameRecorder.');
    }
    this.canvas = canvas;
    this.frames = [];
  }

  /**
   * Starts a new recording session, clearing any previously captured frames.
   */
  start() {
    this.frames = [];
    console.log('Frame recording started.');
  }

  /**
   * Captures the current content of the canvas and stores it as a WebP Data URL.
   */
  captureFrame() {
    // Using 'image/webp' for a good balance of quality and file size.
    // Quality is set to 0.8.
    const frameDataUrl = this.canvas.toDataURL('image/webp', 0.8);
    this.frames.push(frameDataUrl);
  }

  /**
   * Stops the recording session. Currently a placeholder for future functionality.
   */
  stop() {
    console.log(`Frame recording stopped. Total frames captured: ${this.frames.length}`);
  }

  /**
   * Returns the array of captured frames.
   * @returns {string[]} An array of base64 Data URLs representing the captured frames.
   */
  getFrames() {
    return this.frames;
  }
}

export default FrameRecorder;
