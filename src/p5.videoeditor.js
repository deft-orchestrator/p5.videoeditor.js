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

/**
 * @class VideoEditor
 * @description The main entry point for users of the p5.videoeditor.js library.
 * It encapsulates the core components like the timeline, playback controls,
 * and managers into a simplified and easy-to-use API.
 *
 * @example
 * let editor = new VideoEditor();
 * function setup() {
 *   createCanvas(400, 400);
 *   editor.createTextClip("Hello World", { start: 0, duration: 5 });
 * }
 * function draw() {
 *   background(0);
 *   editor.update(p5.instance);
 *   editor.render(p5.instance);
 * }
 */
class VideoEditor {
  /**
   * @static
   * @property {ErrorHandler} ErrorHandler - Exposes the static ErrorHandler class for advanced use cases,
   * such as configuring global error handling strategies.
   */
  static ErrorHandler = ErrorHandler;

  /**
   * @constructor
   * @param {object} [options={}] - Configuration options for the editor.
   * @param {object} [options.performance] - Performance-related settings passed to the PerformanceManager.
   */
  constructor(options = {}) {
    this.timeline = new Timeline(options);
    this.playbackController = new PlaybackController(this.timeline);
    this.performanceManager = new PerformanceManager(options.performance);
    this.memoryManager = new MemoryManager();

    this.play = this.playbackController.play.bind(this.playbackController);
    this.pause = this.playbackController.pause.bind(this.playbackController);
    this.seek = this.playbackController.seek.bind(this.playbackController);
  }

  /**
   * Creates a text clip and adds it to the timeline.
   * @param {string} text - The text content of the clip.
   * @param {object} [options={}] - Configuration options for the TextClip.
   * @returns {TextClip} The newly created TextClip instance.
   */
  createTextClip(text, options = {}) {
    const clip = new TextClip(text, options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Creates a shape clip and adds it to the timeline.
   * @param {string} shapeType - The type of shape to create (e.g., 'rect', 'circle').
   * @param {object} [options={}] - Configuration options for the ShapeClip.
   * @returns {ShapeClip} The newly created ShapeClip instance.
   */
  createShapeClip(shapeType, options = {}) {
    const clip = new ShapeClip(shapeType, options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Creates an image clip and adds it to the timeline.
   * @param {p5.Image|string} image - The p5.Image object or a URL to the image.
   * @param {object} [options={}] - Configuration options for the ImageClip.
   * @returns {ImageClip} The newly created ImageClip instance.
   */
  createImageClip(image, options = {}) {
    const clip = new ImageClip(image, options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Creates an audio clip and adds it to the timeline.
   * @param {p5.SoundFile|string} soundFile - The p5.SoundFile object or a URL to the audio file.
   * @param {object} [options={}] - Configuration options for the AudioClip.
   * @returns {AudioClip} The newly created AudioClip instance.
   */
  createAudioClip(soundFile, options = {}) {
    const clip = new AudioClip(soundFile, options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Caches an asset manually in the MemoryManager. This is useful for preloading
   * assets before they are needed to ensure smooth playback.
   * @param {string} key - The unique key to store the asset under. This key is often the asset's URL or a custom identifier.
   * @param {*} asset - The asset to cache (e.g., p5.Image, p5.SoundFile).
   */
  cacheAsset(key, asset) {
    this.memoryManager.addAsset(key, asset);
  }

  /**
   * Updates the state of the timeline and all active clips. This method should be
   * called in the `draw` loop of your p5.js sketch.
   * @param {p5} p - The p5.js instance, used to access timing variables like deltaTime.
   */
  update(p) {
    this.performanceManager.monitor(p);
    this.timeline.update(p);

    const activeAssetKeys = this.timeline.getActiveClips()
      .map(clip => clip.assetKey)
      .filter(key => key);
    this.memoryManager.clearUnusedAssets(activeAssetKeys);
  }

  /**
   * Renders the current state of the timeline to the canvas. This method should be
   * called in the `draw` loop of your p5.js sketch, after `update`.
   * @param {p5} p - The p5.js instance, used for drawing operations.
   */
  render(p) {
    this.timeline.render(p);
  }

  /**
   * Displays a user-friendly error message. In a future implementation, this could
   * render an overlay on the canvas for better visibility.
   * @param {Error} error - The error object to display.
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
