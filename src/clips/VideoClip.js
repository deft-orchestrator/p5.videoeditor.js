import ClipBase from './ClipBase.js';

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
    this.videoSrc = videoSrc;
    this.isPlaying = false;

    // Add width and height to the animatable properties, with defaults.
    this.properties.width = options.width || 1920; // Default to common video width
    this.properties.height = options.height || 1080; // Default to common video height

    // Create the HTML5 video element
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
    super.update(p, relativeTime);

    // Determine if the clip should be considered active based on its time.
    const isActive = relativeTime >= 0 && relativeTime < this.duration;

    // Play or pause the video based on the active state
    if (isActive && !this.isPlaying) {
      // Using a flag `isPlaying` prevents calling play() on every frame.
      const playPromise = this.videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Autoplay was prevented.
          // console.error("Video play failed:", error);
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
   * This method is called by the timeline's render loop.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    // Let the base class handle transformations (translation, rotation, scale)
    super.render(p, relativeTime);

    // HAVE_FUTURE_DATA (3) or HAVE_ENOUGH_DATA (4) are good states to check for readiness.
    if (this.videoElement.readyState >= 3) {
      p.imageMode(p.CENTER);
      p.image(
        this.videoElement,
        0, // x position is handled by super.render() translate
        0, // y position is handled by super.render() translate
        this.properties.width,
        this.properties.height
      );
    }

    // Restore the drawing context
    p.pop();
  }
}

export default VideoClip;
