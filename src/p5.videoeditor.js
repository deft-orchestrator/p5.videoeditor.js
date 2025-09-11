import Timeline from './core/Timeline.js';
import PlaybackController from './core/PlaybackController.js';
import ClipBase from './clips/ClipBase.js';
import TextClip from './clips/TextClip.js';
import ShapeClip from './clips/ShapeClip.js';
import ImageClip from './clips/ImageClip.js';
import { FadeInEffect, FadeOutEffect } from './effects/StaticEffects.js';
import EffectBase from './effects/EffectBase.js';

// The VideoEditor class is the main entry point for users.
// It wraps the core components into a simpler API.
class VideoEditor {
  constructor(options = {}) {
    this.timeline = new Timeline(options);
    this.playbackController = new PlaybackController(this.timeline);

    // Expose playback controls directly on the editor instance
    this.play = this.playbackController.play.bind(this.playbackController);
    this.pause = this.playbackController.pause.bind(this.playbackController);
    this.seek = this.playbackController.seek.bind(this.playbackController);
  }

  addClip(clip) {
    this.timeline.addClip(clip);
    return clip; // Return the clip for chaining
  }

  // The user must call these methods from their p5.js sketch's draw loop.
  update(p) {
    this.timeline.update(p);
  }

  render(p) {
    this.timeline.render(p);
  }
}

// Export all the public classes for advanced usage
export {
  VideoEditor,
  Timeline,
  PlaybackController,
  ClipBase,
  TextClip,
  ShapeClip,
  ImageClip,
  EffectBase,
  FadeInEffect,
  FadeOutEffect,
};
