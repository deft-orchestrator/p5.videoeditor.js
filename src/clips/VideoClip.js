import ClipBase from './ClipBase.js';
import ErrorHandler from '../utils/ErrorHandler.js';

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'blob:', 'data:'];

/**
 * @class Hotspot
 * @description Represents a clickable area on a video clip.
 * This is a helper class used internally by VideoClip.
 */
class Hotspot {
  constructor(options = {}) {
    this.x = options.x || 0; // Center x, relative to the video's center
    this.y = options.y || 0; // Center y, relative to the video's center
    this.width = options.width || 100;
    this.height = options.height || 50;
    this.start = options.start || 0; // Start time relative to the video clip's start, in ms
    this.duration = options.duration || 1000; // Duration in ms
    this.onClick = options.onClick || (() => {});
  }

  /**
   * Checks if a point is inside the hotspot's bounds.
   * The coordinates are relative to the video clip's center.
   * @param {number} px - The x-coordinate of the point to check.
   * @param {number} py - The y-coordinate of the point to check.
   * @returns {boolean} True if the point is inside the hotspot.
   */
  isHit(px, py) {
    // Assuming imageMode(CENTER)
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    return (
      px >= this.x - halfW &&
      px <= this.x + halfW &&
      py >= this.y - halfH &&
      py <= this.y + halfH
    );
  }
}

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

    this.hotspots = [];
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
  /**
   * Adds a clickable hotspot to the video clip.
   * @param {object} options - Configuration for the hotspot.
   * @param {number} options.x - Center x-coordinate, relative to the video's center.
   * @param {number} options.y - Center y-coordinate, relative to the video's center.
   * @param {number} options.width - Width of the hotspot.
   * @param {number} options.height - Height of the hotspot.
   * @param {number} options.start - Start time, relative to the clip's start, in ms.
   * @param {number} options.duration - Duration of the hotspot, in ms.
   * @param {Function} options.onClick - The callback function to execute when clicked.
   * @returns {this} The current VideoClip instance for chaining.
   */
  addHotspot(options = {}) {
    this.hotspots.push(new Hotspot(options));
    return this;
  }

  /**
   * Checks if a click at the given canvas coordinates hits any active hotspot.
   * @internal
   * @param {p5} p - The p5 instance.
   * @param {number} canvasX - The mouseX coordinate on the canvas.
   * @param {number} canvasY - The mouseY coordinate on the canvas.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  checkClick(p, canvasX, canvasY, relativeTime) {
    // This simple implementation does not account for parent clip rotation or scale.
    // It assumes the video clip is only translated.
    const clipCanvasX = this.properties.x;
    const clipCanvasY = this.properties.y;

    // Convert canvas coordinates to be relative to the clip's center.
    const relativeX = canvasX - clipCanvasX;
    const relativeY = canvasY - clipCanvasY;

    for (const hotspot of this.hotspots) {
      const isTimeActive =
        relativeTime >= hotspot.start &&
        relativeTime < hotspot.start + hotspot.duration;

      if (isTimeActive && hotspot.isHit(relativeX, relativeY)) {
        hotspot.onClick();
        // Stop after the first hit to prevent multiple triggers.
        return true;
      }
    }
    return false;
  }

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

    // --- Render Hotspots (for debugging/visualization) ---
    // Make sure we are in a p5.js environment with drawing capabilities
    if (p.rectMode) {
      p.push();
      p.rectMode(p.CENTER);
      p.stroke('rgba(255, 0, 0, 0.75)');
      p.strokeWeight(2);
      p.noFill();
      for (const hotspot of this.hotspots) {
        const isTimeActive =
          relativeTime >= hotspot.start &&
          relativeTime < hotspot.start + hotspot.duration;
        if (isTimeActive) {
          p.rect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);
        }
      }
      p.pop();
    }
    // --- End Hotspot Rendering ---

    p.pop();
  }
}

export default VideoClip;
