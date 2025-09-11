class PlaybackController {
  constructor(timeline) {
    this.timeline = timeline;
  }

  play() {
    this.timeline.isPlaying = true;
  }

  pause() {
    this.timeline.isPlaying = false;
  }

  seek(time) {
    if (time >= 0 && time <= this.timeline.duration) {
      this.timeline.time = time;
    }
  }
}

export default PlaybackController;
