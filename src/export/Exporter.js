/**
 * @class Exporter
 * @description Manages the video export process by communicating with a Web Worker.
 */
class Exporter {
  /**
   * @param {object} [options={}] - Configuration options.
   * @param {function} [options.onProgress] - Callback for progress updates.
   * @param {function} [options.onLog] - Callback for log messages from FFmpeg.
   * @param {function} [options.onError] - Callback for errors during the export process.
   * @param {function} [options.onComplete] - Callback when the export is finished, receiving the video Blob.
   */
  constructor({ onProgress, onLog, onError, onComplete } = {}) {
    this.worker = new Worker(new URL('./encoder.worker.js', import.meta.url), {
      type: 'module',
    });

    this.onProgress = onProgress;
    this.onLog = onLog;
    this.onError = onError;
    this.onComplete = onComplete;

    this.worker.onmessage = this.handleWorkerMessage.bind(this);
  }

  /**
   * Handles messages received from the encoding worker.
   * @param {MessageEvent} event - The message event from the worker.
   */
  handleWorkerMessage({ data }) {
    switch (data.type) {
      case 'log':
        if (this.onLog) this.onLog(data.data);
        break;
      case 'progress':
        if (this.onProgress) this.onProgress(data.data);
        break;
      case 'error':
        if (this.onError) this.onError(new Error(data.data));
        break;
      case 'done':
        const videoBlob = new Blob([data.data.buffer], { type: 'video/mp4' });
        if (this.onComplete) this.onComplete(videoBlob);
        break;
      default:
        console.warn('Exporter received unknown message type from worker:', data.type);
    }
  }

  /**
   * Starts the export process by sending the captured frames to the worker.
   * @param {string[]} frames - An array of frame Data URLs.
   * @param {number} [frameRate=30] - The frame rate for the output video.
   */
  export(frames, frameRate = 30) {
    if (!frames || frames.length === 0) {
      const error = new Error('Cannot export without frames.');
      if (this.onError) {
        this.onError(error);
      } else {
        throw error;
      }
      return;
    }

    if (this.onLog) this.onLog('Sending frames to export worker...');
    this.worker.postMessage({ frames, frameRate });
  }

  /**
   * Terminates the worker. Useful for cleanup when the exporter is no longer needed.
   */
  terminate() {
    this.worker.terminate();
  }
}

export default Exporter;
