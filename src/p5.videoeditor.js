import Timeline from './core/Timeline.js';
import PlaybackController from './core/PlaybackController.js';
import PerformanceManager from './core/PerformanceManager.js';
import MemoryManager from './utils/MemoryManager.js';
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
    this.performanceManager = new PerformanceManager(options.performance);
    this.memoryManager = new MemoryManager();

    // Expose playback controls directly on the editor instance
    this.play = this.playbackController.play.bind(this.playbackController);
    this.pause = this.playbackController.pause.bind(this.playbackController);
    this.seek = this.playbackController.seek.bind(this.playbackController);
  }

  addClip(clip) {
    this.timeline.addClip(clip);
    return clip; // Return the clip for chaining
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
}

// Export all the public classes for advanced usage
export {
  VideoEditor,
  Timeline,
  PlaybackController,
  PerformanceManager,
  MemoryManager,
  ClipBase,
  TextClip,
  ShapeClip,
  ImageClip,
  EffectBase,
  FadeInEffect,
  FadeOutEffect,
};
