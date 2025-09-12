import Timeline from './core/Timeline.js';
import PlaybackController from './core/PlaybackController.js';
import PerformanceManager from './core/PerformanceManager.js';
import ErrorHandler from './utils/ErrorHandler.js';
import MemoryManager from './utils/MemoryManager.js';
import ClipBase from './clips/ClipBase.js';
import TextClip from './clips/TextClip.js';
import ShapeClip from './clips/ShapeClip.js';
import ImageClip from './clips/ImageClip.js';
import AudioClip from './clips/AudioClip.js';
import { FadeInEffect, FadeOutEffect } from './effects/StaticEffects.js';
import EffectBase from './effects/EffectBase.js';

// The VideoEditor class is the main entry point for users.
// It wraps the core components into a simpler API.
class VideoEditor {
  // Expose the static error handler for advanced use
  static ErrorHandler = ErrorHandler;

  constructor(options = {}) {
    this.timeline = new Timeline(options);
    this.playbackController = new PlaybackController(this.timeline);
    this.performanceManager = new PerformanceManager(options.performance);
    this.memoryManager = new MemoryManager();

    // Expose playback controls directly on the editor instance
    this.play = this.playbackController.play.bind(this.playbackController);
    this.pause = this.playbackController.pause.bind(this.playbackController);
    this.seek = this.playbackController.seek.bind(this.playbackController);
  }

  // Factory methods for creating and adding clips
  createTextClip(text, options = {}) {
    const clip = new TextClip(text, options);
    this.timeline.addClip(clip);
    return clip;
  }

  createShapeClip(shapeType, options = {}) {
    const clip = new ShapeClip(shapeType, options);
    this.timeline.addClip(clip);
    return clip;
  }

  createImageClip(image, options = {}) {
    const clip = new ImageClip(image, options);
    this.timeline.addClip(clip);
    return clip;
  }

  createAudioClip(soundFile, options = {}) {
    const clip = new AudioClip(soundFile, options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Caches an asset manually. Useful for preloading.
   * @param {string} key - The key to store the asset under.
   * @param {*} asset - The asset to cache.
   */
  cacheAsset(key, asset) {
    this.memoryManager.addAsset(key, asset);
  }

  // The user must call these methods from their p5.js sketch's draw loop.
  update(p) {
    this.performanceManager.monitor(p);
    this.timeline.update(p);

    // Automatically clear unused assets from memory
    const activeAssetKeys = this.timeline.getActiveClips()
      .map(clip => clip.assetKey)
      .filter(key => key); // Filter out null/undefined keys
    this.memoryManager.clearUnusedAssets(activeAssetKeys);
  }

  render(p) {
    this.timeline.render(p);
  }

  /**
   * A user-friendly way to show an error, as suggested by the README.
   * In a future implementation, this could render an overlay on the canvas.
   * @param {Error} error - The error to display.
   */
  showUserFriendlyError(error) {
    ErrorHandler.showUserFriendlyError(error);
  }
}

// Export all the public classes for advanced usage
export {
  VideoEditor,
  Timeline,
  PlaybackController,
  PerformanceManager,
  MemoryManager,
  ErrorHandler,
  ClipBase,
  TextClip,
  ShapeClip,
  ImageClip,
  AudioClip,
  EffectBase,
  FadeInEffect,
  FadeOutEffect,
};
