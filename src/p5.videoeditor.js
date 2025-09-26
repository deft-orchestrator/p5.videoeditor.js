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
import VideoClip from './clips/VideoClip.js';
import SlideShowClip from './clips/SlideShowClip.js';
import GIF from 'gif.js/src/GIF';
import Exporter from './export/Exporter.js';
import EffectBase from './effects/EffectBase.js';

/**
 * @class VideoEditor
 * @description The main entry point for users of the p5.videoeditor.js library.
 * It encapsulates the core components like the timeline, playback controls,
 * and managers into a simplified and easy-to-use API.
 *
 * @example
 * // In your p5.js sketch:
 * let editor;
 *
 * function setup() {
 *   createCanvas(1280, 720);
 *   editor = new VideoEditor(p5.instance, { canvas: canvas.elt });
 *
 *   // Create clips and add keyframes using the ergonomic API
 *   editor.createTextClip("Hello World", { start: 1, duration: 5 })
 *     .addKeyframe('x', 0, 100)
 *     .addKeyframe('x', 5000, 500);
 * }
 *
 * async function draw() {
 *   background(0);
 *   editor.update(p5.instance);
 *   await editor.render();
 * }
 */
class VideoEditor {
  /**
   * @static
   * @property {ErrorHandler} ErrorHandler - Exposes the static ErrorHandler class for advanced use cases.
   */
  static ErrorHandler = ErrorHandler;

  /**
   * @constructor
   * @param {p5} p - The p5.js instance. Required for rendering.
   * @param {object} [options={}] - Configuration options for the editor.
   * @param {HTMLCanvasElement} [options.canvas=null] - The p5.js canvas element. Required for exporting.
   * @param {HTMLElement} [options.uiContainer=null] - The container to append the UI controls to.
   * @param {string} [options.gifWorkerPath=null] - The path to the 'gif.worker.js' file for GIF exporting.
   * @param {object} [options.performance] - Performance-related settings passed to the PerformanceManager.
   */
  constructor(
    p,
    {
      canvas = null,
      uiContainer = null,
      gifWorkerPath = './gif.worker.js', // Default path for the distributed worker file
      ...options
    } = {}
  ) {
    if (!p) {
      throw new Error(
        'A p5.js instance must be provided to the VideoEditor constructor.'
      );
    }
    this.options = { gifWorkerPath };
    this.timeline = new Timeline(p, canvas, options);
    this.playbackController = new PlaybackController(
      this.timeline,
      canvas,
      uiContainer
    );
    this.performanceManager = new PerformanceManager(options.performance);
    this.memoryManager = new MemoryManager();

    this.play = this.playbackController.play.bind(this.playbackController);
    this.pause = this.playbackController.pause.bind(this.playbackController);
    this.seek = this.playbackController.seek.bind(this.playbackController);
  }

  /**
   * Exports the timeline animation as a GIF file.
   * This process is resource-intensive and may take some time.
   * @param {object} [options={}] - Configuration options for the GIF export.
   * @param {number} [options.frameRate=15] - The frame rate of the exported GIF.
   * @param {number} [options.quality=10] - The quality of the GIF encoder. Lower is better.
   * @param {string} [options.filename='p5.videoeditor-export.gif'] - The filename for the downloaded GIF.
   * @param {function} [options.onProgress=null] - A callback function that receives the progress (0 to 1).
   * @returns {Promise<void>} A promise that resolves when the export is complete.
   * @example
   * // Basic export
   * editor.exportGIF();
   *
   * // Export with options and progress tracking
   * editor.exportGIF({
   *   frameRate: 24,
   *   quality: 5,
   *   filename: 'my-animation.gif',
   *   onProgress: (progress) => {
   *     console.log(`Export progress: ${Math.round(progress * 100)}%`);
   *   }
   * });
   */
  async exportGIF({
    frameRate = 15,
    quality = 10,
    filename = 'p5.videoeditor-export.gif',
    onProgress = null,
  } = {}) {
    console.log('Starting GIF export...');
    const wasPlaying = this.playbackController.isPlaying;
    const originalTime = this.timeline.time;

    this.pause();
    this.seek(0);

    const gif = new GIF({
      workers: 2,
      quality,
      workerScript: this.options.gifWorkerPath,
    });

    const frameDelay = 1000 / frameRate;
    const totalFrames = Math.floor(this.timeline.duration / frameDelay);

    for (let i = 0; i < totalFrames; i++) {
      const currentTime = i * frameDelay;
      this.seek(currentTime);
      this.update(this.timeline.p);
      await this.render();

      // addFrame can take a canvas element or a context
      gif.addFrame(this.timeline.canvas, {
        copy: true,
        delay: frameDelay,
      });

      if (onProgress) {
        onProgress((i + 1) / totalFrames);
      }
    }

    gif.on('finished', (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('GIF export finished.');

      // Restore original state
      this.seek(originalTime);
      if (wasPlaying) {
        this.play();
      }
    });

    console.log('Rendering GIF frames...');
    gif.render();
  }

  /**
   * Exports the timeline animation as an MP4 video file.
   * This process uses FFmpeg compiled to WebAssembly and can be resource-intensive.
   * @param {object} [options={}] - Configuration options for the MP4 export.
   * @param {number} [options.frameRate=30] - The frame rate of the exported video.
   * @param {string} [options.filename='p5.videoeditor-export.mp4'] - The filename for the downloaded video.
   * @param {function} [options.onProgress=null] - A callback for FFmpeg progress updates (0-100).
   * @param {function} [options.onLog=null] - A callback for FFmpeg log messages.
   * @returns {Promise<void>} A promise that resolves when the export is complete.
   * @example
   * // Basic export
   * editor.exportMP4();
   *
   * // Export with options and progress tracking
   * editor.exportMP4({
   *   frameRate: 60,
   *   filename: 'my-video.mp4',
   *   onProgress: (progress) => {
   *     console.log(`FFmpeg Progress: ${progress}%`);
   *   },
   *   onLog: (message) => {
   *     console.log(`FFmpeg Log: ${message}`);
   *   }
   * });
   */
  async exportMP4({
    frameRate = 30,
    filename = 'p5.videoeditor-export.mp4',
    onProgress = null,
    onLog = null,
  } = {}) {
    console.log('Starting MP4 export...');
    const wasPlaying = this.playbackController.isPlaying;
    const originalTime = this.timeline.time;
    let exporter = null;

    try {
      this.pause();
      this.seek(0);

      const frames = [];
      const frameDelay = 1000 / frameRate;
      const totalFrames = Math.floor(this.timeline.duration / frameDelay);

      if (onLog) onLog('Generating frames...');

      for (let i = 0; i < totalFrames; i++) {
        const currentTime = i * frameDelay;
        this.seek(currentTime);
        this.update(this.timeline.p);
        await this.render();
        // Capture frame as a WebP Data URL for efficiency
        const frameDataURL = this.timeline.canvas.toDataURL('image/webp', 0.9);
        frames.push(frameDataURL);
        // Provide a simple progress for the frame generation part
        if (onProgress) onProgress(((i + 1) / totalFrames) * 10); // Report up to 10% progress for frame gen
      }

      if (onLog) onLog('Frames generated. Initializing exporter...');

      await new Promise((resolve, reject) => {
        exporter = new Exporter({
          onProgress,
          onLog,
          onError: reject,
          onComplete: (videoBlob) => {
            const url = URL.createObjectURL(videoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('MP4 export finished.');
            resolve();
          },
        });

        exporter.export(frames, frameRate);
      });
    } catch (error) {
      console.error('MP4 export failed:', error);
      ErrorHandler.showUserFriendlyError(error);
    } finally {
      // Cleanup and restore state
      if (exporter) {
        exporter.terminate();
      }
      this.seek(originalTime);
      if (wasPlaying) {
        this.play();
      }
    }
  }

  /**
   * Creates a video clip and adds it to the timeline.
   * @param {string} videoSrc - The source URL of the video file.
   * @param {object} [options={}] - Configuration options for the VideoClip.
   * @returns {VideoClip} The newly created VideoClip instance for chaining.
   * @example
   * editor.createVideoClip('./assets/my-video.mp4', { start: 0, duration: 10 });
   */
  createVideoClip(videoSrc, options = {}) {
    const clip = new VideoClip(videoSrc, options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Creates a slideshow clip and adds it to the timeline.
   * This clip can contain other clips and be controlled with next() and previous().
   * @param {object} [options={}] - Configuration options for the SlideShowClip.
   * @returns {SlideShowClip} The newly created SlideShowClip instance for chaining.
   * @example
   * const slideshow = editor.createSlideShowClip({ duration: 20 });
   * slideshow.addSlide([ editor.createTextClip('First Slide') ]);
   * slideshow.addSlide([ editor.createTextClip('Second Slide') ]);
   */
  createSlideShowClip(options = {}) {
    const clip = new SlideShowClip(options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Creates a text clip and adds it to the timeline.
   * @param {string} text - The text content of the clip.
   * @param {object} [options={}] - Configuration options for the TextClip.
   * @returns {TextClip} The newly created TextClip instance for chaining.
   * @example
   * editor.createTextClip('Hello', { start: 1, duration: 3, properties: { y: 100 } })
   *   .addKeyframe('x', 0, 50)
   *   .addKeyframe('x', 3000, 250);
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
   * @returns {ShapeClip} The newly created ShapeClip instance for chaining.
   * @example
   * editor.createShapeClip('rect', { duration: 5, properties: { width: 100, fill: 'red' } });
   */
  createShapeClip(shapeType, options = {}) {
    const clip = new ShapeClip(shapeType, options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Creates an image clip and adds it to the timeline.
   * @param {p5.Image} image - The preloaded p5.Image object.
   * @param {object} [options={}] - Configuration options for the ImageClip.
   * @returns {ImageClip} The newly created ImageClip instance for chaining.
   * @example
   * // In preload: myImage = p.loadImage('./assets/logo.png');
   * // In setup:
   * editor.createImageClip(myImage, { duration: 4 });
   */
  createImageClip(image, options = {}) {
    const clip = new ImageClip(image, options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Creates an audio clip and adds it to the timeline.
   * @param {p5.SoundFile} soundFile - The preloaded p5.SoundFile object.
   * @param {object} [options={}] - Configuration options for the AudioClip.
   * @returns {AudioClip} The newly created AudioClip instance for chaining.
   * @example
   * // In preload: mySound = p.loadSound('./assets/music.mp3');
   * // In setup:
   * editor.createAudioClip(mySound, { start: 0, duration: 15 });
   */
  createAudioClip(soundFile, options = {}) {
    const clip = new AudioClip(soundFile, options);
    this.timeline.addClip(clip);
    return clip;
  }

  /**
   * Caches an asset manually in the MemoryManager.
   * @param {string} key - The unique key to store the asset under.
   * @param {*} asset - The asset to cache (e.g., p5.Image, p5.SoundFile).
   */
  cacheAsset(key, asset) {
    this.memoryManager.addAsset(key, asset);
  }

  /**
   * Updates the state of the timeline and all active clips.
   * @param {p5} p - The p5.js instance.
   */
  update(p) {
    this.performanceManager.monitor(p);
    this.timeline.update(p);

    const activeAssetKeys = this.timeline
      .getActiveClips()
      .map((clip) => clip.assetKey)
      .filter((key) => key);
    this.memoryManager.clearUnusedAssets(activeAssetKeys);
  }

  /**
   * Renders the current state of the timeline to the canvas.
   */
  async render() {
    await this.timeline.render();
  }

  /**
   * Handles mouse press events to check for interactions like hotspot clicks.
   * This method should be called from the p5.js `mousePressed()` function.
   * @param {p5} p - The p5.js instance, which provides mouseX and mouseY.
   * @example
   * function mousePressed() {
   *   editor.handleMousePressed(p);
   * }
   */
  handleMousePressed(p) {
    const activeClips = this.timeline.getActiveClips();
    // Iterate in reverse order so we check the topmost clips first.
    for (let i = activeClips.length - 1; i >= 0; i--) {
      const clip = activeClips[i];
      if (clip instanceof VideoClip) {
        const relativeTime = this.timeline.time - clip.start;
        const wasClicked = clip.checkClick(p, p.mouseX, p.mouseY, relativeTime);
        if (wasClicked) {
          // Stop after the first clip that handles the click.
          break;
        }
      }
    }
  }

  /**
   * Displays a user-friendly error message.
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
  VideoClip,
  SlideShowClip,
  EffectBase,
};
