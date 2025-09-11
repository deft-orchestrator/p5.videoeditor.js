class Timeline {
  constructor({ frameRate = 60, duration = 10000 } = {}) {
    this.frameRate = frameRate;
    this.duration = duration; // in milliseconds
    this.clips = [];
    this.time = 0;
    this.isPlaying = false;
  }

  addClip(clip) {
    this.clips.push(clip);
    // Sort clips by layer to ensure correct render order
    this.clips.sort((a, b) => a.layer - b.layer);
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

    // Update all active clips
    this.clips.forEach(clip => {
      if (this.time >= clip.start && this.time < (clip.start + clip.duration)) {
        const relativeTime = this.time - clip.start;
        clip.update(p, relativeTime);
      }
    });
  }

  // The render method is now only responsible for drawing
  render(p) {
    this.clips.forEach(clip => {
      if (this.time >= clip.start && this.time < (clip.start + clip.duration)) {
        const relativeTime = this.time - clip.start;
        clip.render(p, relativeTime);
      }
    });
  }
}

export default Timeline;
