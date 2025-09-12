class PlaybackController {
  constructor(timeline) {
    this.timeline = timeline;
  }

  play() {
    this.timeline.play();
  }

  pause() {
    this.timeline.pause();
  }

  seek(time) {
    this.timeline.seek(time);
  }
}

export default PlaybackController;
