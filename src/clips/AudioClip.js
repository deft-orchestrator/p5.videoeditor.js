import ClipBase from './ClipBase.js';

/**
 * @class AudioClip
 * @extends ClipBase
 * @description A clip for managing and playing audio on the timeline. It handles
 * playback synchronization and allows for keyframing audio properties like volume and pan.
 *
 * @param {p5.SoundFile|string} soundFile - The p5.SoundFile object or a URL to the audio file.
 * If a URL is provided, it will be used as the `assetKey` for caching unless one is explicitly provided in the options.
 * @param {object} [options={}] - Configuration options for the audio clip. Inherits options from ClipBase.
 *
 * @example
 * // Assuming 'mySound.mp3' is preloaded
 * let audioClip = editor.createAudioClip(mySound, { start: 2000, duration: 5000 });
 * audioClip.addKeyframe('volume', 0, 0); // Start silent
 * audioClip.addKeyframe('volume', 1000, 1); // Fade in
 * audioClip.addKeyframe('volume', 4000, 1); // Hold volume
 * audioClip.addKeyframe('volume', 5000, 0); // Fade out
 */
class AudioClip extends ClipBase {
  constructor(soundFile, options = {}) {
    if (typeof soundFile === 'string' && !options.assetKey) {
      options.assetKey = soundFile;
    }

    const defaultAudioProps = {
      volume: 1,
      pan: 0,
    };

    super({
      ...options,
      properties: { ...defaultAudioProps, ...(options.properties || {}) },
    });

    this.soundFile = soundFile;
    this._isPlaying = false;
  }

  /**
   * Updates the audio playback state and properties based on the timeline's current position.
   * This method is called automatically by the timeline in the draw loop.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration, in milliseconds.
   */
  update(p, relativeTime) {
    super.update(p, relativeTime);

    if (!this.soundFile || typeof this.soundFile.play !== 'function') {
      return;
    }

    this.soundFile.setVolume(this.properties.volume);
    this.soundFile.pan(this.properties.pan);

    const isWithinClipBounds =
      relativeTime >= 0 && relativeTime < this.duration;

    if (isWithinClipBounds && !this._isPlaying) {
      const startTimeInSound = relativeTime / 1000;
      if (startTimeInSound < this.soundFile.duration()) {
        this.soundFile.play();
        this.soundFile.jump(startTimeInSound);
        this._isPlaying = true;
      }
    } else if (!isWithinClipBounds && this._isPlaying) {
      this.soundFile.stop();
      this._isPlaying = false;
    }
  }

  /**
   * Audio clips do not have a visual representation, so this method is a no-op.
   * It exists to fulfill the ClipBase interface.
   * It exists to fulfill the ClipBase interface.
   */
  render() {
    // Audio clips are not rendered visually.
  }
}

export default AudioClip;
