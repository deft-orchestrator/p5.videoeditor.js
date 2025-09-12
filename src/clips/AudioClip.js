import ClipBase from './ClipBase.js';
import ErrorHandler from '../utils/ErrorHandler.js';

class AudioClip extends ClipBase {
  constructor(soundFile, options = {}) {
    // If the soundFile is a string (URL), use it as the assetKey
    if (typeof soundFile === 'string' && !options.assetKey) {
      options.assetKey = soundFile;
    }

    // Default properties for audio
    const defaultAudioProps = {
      volume: 1, // 0 to 1
      pan: 0,    // -1 (left) to 1 (right)
    };

    super({
      ...options,
      properties: { ...defaultAudioProps, ...(options.properties || {}) },
    });

    this.soundFile = soundFile; // p5.SoundFile object or a string URL
    this._isPlaying = false;
  }

  update(p, relativeTime) {
    super.update(p, relativeTime);

    if (!this.soundFile || typeof this.soundFile.play !== 'function') {
      // Sound not loaded or invalid yet
      return;
    }

    // Adjust sound properties based on keyframed values
    this.soundFile.setVolume(this.properties.volume);
    this.soundFile.pan(this.properties.pan);

    const isWithinClipBounds = relativeTime >= 0 && relativeTime < this.duration;

    if (isWithinClipBounds && !this._isPlaying) {
      // The timeline has entered the clip's duration, start playing.
      // Use jump to start from the correct time within the audio file.
      const startTimeInSound = relativeTime / 1000; // convert ms to seconds
      if (startTimeInSound < this.soundFile.duration()) {
        this.soundFile.play();
        this.soundFile.jump(startTimeInSound);
        this._isPlaying = true;
      }
    } else if (!isWithinClipBounds && this._isPlaying) {
      // The timeline is outside the clip's duration, stop playing.
      this.soundFile.stop();
      this._isPlaying = false;
    }
  }

  // Audio clips don't have a visual representation, so render is empty.
  render(p, relativeTime) {
    // No-op
  }
}

export default AudioClip;
