/**
 * @class Timeline
 * @description Manages the collection of clips, their timing, and the overall playback state.
 * It is the central component that orchestrates the animation.
 */
class Timeline {
  /**
   * @constructor
   * @param {object} [options={}] - Configuration options for the timeline.
   * @param {number} [options.frameRate=60] - The target frame rate for the animation.
   * @param {number} [options.duration=10000] - The total duration of the timeline in milliseconds.
   */
  constructor({ frameRate = 60, duration = 10000 } = {}) {
    this.frameRate = frameRate;
    this.duration = duration;
    this.clips = [];
    this.time = 0;
    this.isPlaying = false;
    this._activeClips = [];

    this.isBatching = false;
    this.dirtyClips = new Set();
    this.needsClipSorting = false;
  }

  /**
   * Adds a clip to the timeline.
   * @param {ClipBase} clip - The clip instance to add.
   */
  addClip(clip) {
    this.clips.push(clip);
    clip.timeline = this;

    if (this.isBatching) {
      this.needsClipSorting = true;
    } else {
      this.clips.sort((a, b) => a.layer - b.layer);
    }
  }

  /**
   * Groups multiple clip or keyframe additions into a single operation to optimize performance.
   * Keyframes and clips are sorted only once at the end of the batch.
   * @param {Function} callback - A function that contains the operations to be batched.
   */
  batch(callback) {
    this.isBatching = true;
    try {
      callback();
    } finally {
      this.isBatching = false;
      this.finalizeBatch();
    }
  }

  /**
   * @private
   * Finalizes batch operations by sorting dirty clips and layers.
   */
  finalizeBatch() {
    this.dirtyClips.forEach(clip => clip.finalizeChanges());
    this.dirtyClips.clear();

    if (this.needsClipSorting) {
      this.clips.sort((a, b) => a.layer - b.layer);
      this.needsClipSorting = false;
    }
  }

  /**
   * Gets all clips that are active at the current time.
   * @returns {ClipBase[]} An array of active clips.
   */
  getActiveClips() {
    return this.clips.filter(clip =>
      this.time >= clip.start && this.time < (clip.start + clip.duration)
    );
  }

  /**
   * The main update loop for the timeline. It advances the time and updates all active clips.
   * @param {p5} p - The p5.js instance.
   */
  update(p) {
    if (this.isPlaying) {
      this.time += p.deltaTime;
      if (this.time > this.duration) {
        this.time = 0; // Simple loop
      }
    }

    this._activeClips = this.getActiveClips();

    this._activeClips.forEach(clip => {
      const relativeTime = this.time - clip.start;
      clip.update(p, relativeTime);
    });
  }

  /**
   * Renders all active clips to the canvas.
   * @param {p5} p - The p5.js instance.
   */
  render(p) {
    this._activeClips.forEach(clip => {
      const relativeTime = this.time - clip.start;
      clip.render(p, relativeTime);
    });
  }

  /**
   * Starts or resumes playback.
   */
  play() {
    this.isPlaying = true;
  }

  /**
   * Pauses playback.
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Seeks to a specific time in the timeline.
   * @param {number} time - The time to seek to, in milliseconds.
   */
  seek(time) {
    if (time >= 0 && time <= this.duration) {
      this.time = time;
    }
  }
}

export default Timeline;
