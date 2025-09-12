class Timeline {
  constructor({ frameRate = 60, duration = 10000 } = {}) {
    this.frameRate = frameRate;
    this.duration = duration; // in milliseconds
    this.clips = [];
    this.time = 0;
    this.isPlaying = false;
    this._activeClips = []; // Cache for active clips

    // For batch operations
    this.isBatching = false;
    this.dirtyClips = new Set();
    this.needsClipSorting = false;
  }

  addClip(clip) {
    this.clips.push(clip);
    clip.timeline = this; // Give clip a reference back to the timeline

    if (this.isBatching) {
      this.needsClipSorting = true;
    } else {
      // Sort clips by layer to ensure correct render order
      this.clips.sort((a, b) => a.layer - b.layer);
    }
  }

  batch(callback) {
    this.isBatching = true;
    try {
      callback();
    } finally {
      this.isBatching = false;
      this.finalizeBatch();
    }
  }

  finalizeBatch() {
    this.dirtyClips.forEach(clip => clip.finalizeChanges());
    this.dirtyClips.clear();

    if (this.needsClipSorting) {
      this.clips.sort((a, b) => a.layer - b.layer);
      this.needsClipSorting = false;
    }
  }

  getActiveClips() {
    return this.clips.filter(clip =>
      this.time >= clip.start && this.time < (clip.start + clip.duration)
    );
  }

  // The main update loop for the timeline and its clips
  update(p) {
    if (this.isPlaying) {
      this.time += p.deltaTime;
      // Simple loop for now
      if (this.time > this.duration) {
        this.time = 0;
      }
    }

    // Update the cache of active clips
    this._activeClips = this.getActiveClips();

    // Update all active clips
    this._activeClips.forEach(clip => {
      const relativeTime = this.time - clip.start;
      clip.update(p, relativeTime);
    });
  }

  // The render method is now only responsible for drawing
  render(p) {
    // Use the cached list of active clips
    this._activeClips.forEach(clip => {
      const relativeTime = this.time - clip.start;
      clip.render(p, relativeTime);
    });
  }
}

export default Timeline;
