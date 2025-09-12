/**
 * @class PlaybackController
 * @description Provides a simple interface to control the playback of a timeline (play, pause, seek).
 * It acts as a layer of abstraction between the user and the timeline's internal state.
 */
class PlaybackController {
  /**
   * @constructor
   * @param {Timeline} timeline - The timeline instance to control.
   */
  constructor(timeline) {
    this.timeline = timeline;
  }

  /**
   * @method play
   * @description Starts or resumes playback of the timeline from its current time.
   */
  play() {
    this.timeline.play();
  }

  /**
   * @method pause
   * @description Pauses playback of the timeline at its current time.
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
}

export default PlaybackController;
