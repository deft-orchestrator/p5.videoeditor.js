import ClipBase from './ClipBase.js';
import ErrorHandler from '../utils/ErrorHandler.js';

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'blob:', 'data:'];

/**
 * Represents a video clip that can be placed on the timeline.
 * Manages the playback and synchronization of an HTML5 video element.
 */
class VideoClip extends ClipBase {
  /**
   * @param {string} videoSrc - The source URL of the video.
   * @param {object} options - The options for the clip, passed to ClipBase.
   */
  constructor(videoSrc, options = {}) {
    super(options);

    // Explicitly block javascript: URLs before attempting to parse.
    if (
      typeof videoSrc === 'string' &&
      videoSrc.trim().toLowerCase().startsWith('javascript:')
    ) {
      ErrorHandler.critical(
        `Unsafe video protocol: javascript:. Only safe protocols are allowed.`
      );
    }

    try {
      const url = new URL(videoSrc, document.baseURI);
      if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
        ErrorHandler.critical(
          `Unsafe video protocol: ${url.protocol}. Only safe protocols are allowed.`
        );
      }
    } catch (e) {
      ErrorHandler.critical(`Invalid video source URL: ${videoSrc}`, e);
    }

    this.videoSrc = videoSrc;
    this.isPlaying = false;
    this.videoElement = null; // Element will be created lazily

    // Add width and height to the animatable properties, with defaults.
    this.properties.width = options.width || 1920; // Default to common video width
    this.properties.height = options.height || 1080; // Default to common video height
  }

  /**
   * @private
   * Creates the video element and sets its initial properties.
   * This is called lazily to avoid creating DOM elements unnecessarily.
   */
  _initElement() {
    if (this.videoElement) return;

    this.videoElement = document.createElement('video');
    this.videoElement.src = this.videoSrc;
    this.videoElement.preload = 'auto';
    this.videoElement.muted = true; // Essential for browser autoplay policies
    this.videoElement.playsInline = true; // Essential for mobile playback
  }

  /**
   * Updates the video's state based on the timeline's current time.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration, in milliseconds.
   */
  update(p, relativeTime) {
    this._initElement(); // Ensure element exists
    super.update(p, relativeTime);

    // Synchronize video time with timeline time.
    const targetTime = relativeTime / 1000;
    const timeDifference = Math.abs(this.videoElement.currentTime - targetTime);
    if (timeDifference > 0.05 || this.videoElement.paused) {
      this.videoElement.currentTime = targetTime;
    }

    const isActive = relativeTime >= 0 && relativeTime < this.duration;
    if (isActive && !this.isPlaying) {
      const playPromise = this.videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented.
        });
      }
      this.isPlaying = true;
    } else if (!isActive && this.isPlaying) {
      this.videoElement.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Renders the video frame to the p5.js canvas if the clip is active.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    this._initElement(); // Ensure element exists
    super.render(p, relativeTime);

    if (this.videoElement && this.videoElement.readyState >= 3) {
      p.imageMode(p.CENTER);
      p.image(
        this.videoElement,
        0,
        0,
        this.properties.width,
        this.properties.height
      );
    }

    p.pop();
  }
}

export default VideoClip;
