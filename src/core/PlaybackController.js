import FrameRecorder from './FrameRecorder.js';
import Exporter from '../export/Exporter.js';

/**
 * @class PlaybackController
 * @description Provides a UI and logic to control timeline playback and trigger exports.
 */
class PlaybackController {
  /**
   * @constructor
   * @param {Timeline} timeline - The timeline instance to control.
   * @param {HTMLCanvasElement} canvas - The p5.js canvas element for recording.
   * @param {HTMLElement} container - The HTML element to append the UI controls to.
   */
  constructor(timeline, canvas, container) {
    this.timeline = timeline;
    this.canvas = canvas;
    this.container = container;

    // Initialize the components needed for exporting
    this.frameRecorder = new FrameRecorder(this.canvas);
    this.exporter = new Exporter({
      onProgress: this.handleExportProgress.bind(this),
      onComplete: this.handleExportComplete.bind(this),
      onError: this.handleExportError.bind(this),
      onLog: (log) => console.log('Exporter Log:', log),
    });

    this._createUI();
  }

  /**
   * Creates and appends the playback and export UI controls.
   * @private
   */
  _createUI() {
    if (!this.container) return;

    this.uiWrapper = document.createElement('div');
    this.uiWrapper.style.padding = '10px';
    this.uiWrapper.style.backgroundColor = '#f0f0f0';
    this.uiWrapper.style.borderTop = '1.5px solid #ccc';

    // --- Basic Play/Pause Button ---
    this.playButton = document.createElement('button');
    this.playButton.textContent = 'Play';
    this.playButton.onclick = () => {
      if (this.timeline.isPlaying) {
        this.pause();
        this.playButton.textContent = 'Play';
      } else {
        this.play();
        this.playButton.textContent = 'Pause';
      }
    };
    this.uiWrapper.appendChild(this.playButton);

    // --- Export Button ---
    this.exportButton = document.createElement('button');
    this.exportButton.textContent = 'Ekspor Video';
    this.exportButton.style.marginLeft = '10px';
    this.exportButton.onclick = () => this.startExportProcess();
    this.uiWrapper.appendChild(this.exportButton);

    // --- Status Display ---
    this.exportStatus = document.createElement('span');
    this.exportStatus.style.marginLeft = '15px';
    this.exportStatus.style.fontFamily = 'monospace';
    this.exportStatus.style.display = 'none'; // Hidden by default
    this.uiWrapper.appendChild(this.exportStatus);

    this.container.appendChild(this.uiWrapper);
  }

  /**
   * Starts the entire export workflow: rendering frames and then encoding them.
   * @private
   */
  async startExportProcess() {
    this.exportButton.disabled = true;
    this.playButton.disabled = true;
    this.exportStatus.style.display = 'inline';
    this.exportStatus.textContent = 'Rendering frames...';

    // Ensure playback is paused and reset to the start
    this.pause();
    this.seek(0);

    this.frameRecorder.start();

    const frameRate = this.timeline.frameRate || 30;
    const frameDuration = 1000 / frameRate;
    const totalDuration = this.timeline.duration;

    // Use a short timeout to allow the UI to update before the heavy loop starts.
    await new Promise((resolve) => setTimeout(resolve, 50));

    // --- Offline Rendering Loop ---
    for (let time = 0; time <= totalDuration; time += frameDuration) {
      this.timeline.seek(time); // Manually set the time
      this.timeline.render(); // Manually trigger a render at that time
      this.frameRecorder.captureFrame();
    }

    this.frameRecorder.stop();
    this.exportStatus.textContent =
      'Mengenkode video... (ini mungkin perlu waktu)';

    // Hand off the captured frames to the exporter
    this.exporter.export(this.frameRecorder.getFrames(), frameRate);
  }

  /**
   * Handles progress updates from the exporter.
   * @private
   * @param {number} progress - The export progress percentage (0-100).
   */
  handleExportProgress(progress) {
    this.exportStatus.textContent = `Mengenkode... ${progress}%`;
  }

  /**
   * Handles the completion of the export process.
   * @private
   * @param {Blob} videoBlob - The resulting video file as a Blob.
   */
  handleExportComplete(videoBlob) {
    this.exportStatus.textContent = 'Ekspor selesai! Memulai pengunduhan...';

    // Create a temporary link to trigger the download
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'p5-video-export.mp4';
    document.body.appendChild(a);
    a.click();

    // Clean up the temporary link and object URL
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this._resetUIState();
    }, 100);
  }

  /**
   * Handles any errors that occur during the export process.
   * @private
   * @param {Error} error - The error object.
   */
  handleExportError(error) {
    console.error('Export failed:', error);
    this.exportStatus.textContent = `Error: ${error.message}`;
    // Do not reset immediately, so the user can see the error.
    // Consider adding a close button for the error message in a real app.
    setTimeout(() => this._resetUIState(), 5000); // Reset after 5 seconds
  }

  /**
   * Resets the UI controls to their default, interactive state.
   * @private
   */
  _resetUIState() {
    this.exportButton.disabled = false;
    this.playButton.disabled = false;
    this.exportStatus.style.display = 'none';
    this.exportStatus.textContent = '';
  }

  /**
   * @method play
   * @description Starts or resumes playback of the timeline.
   */
  play() {
    this.timeline.play();
  }

  /**
   * @method pause
   * @description Pauses playback of the timeline.
   */
  pause() {
    this.timeline.pause();
  }

  /**
   * @method seek
   * @description Jumps to a specific time on the timeline.
   * @param {number} time - The time to seek to, in milliseconds.
   */
  seek(time) {
    this.timeline.seek(time);
  }

  /**
   * Removes the UI controls and cleans up event listeners.
   */
  destroy() {
    if (this.uiWrapper) {
      this.uiWrapper.remove();
    }
  }
}

export default PlaybackController;
