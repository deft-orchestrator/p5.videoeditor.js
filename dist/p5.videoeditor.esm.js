/**
 * @class PluginManager
 * @description Manages the registration and validation of all plugins.
 */
class PluginManager {
  constructor() {
    /**
     * @type {Array<object>}
     */
    this.plugins = [];
  }

  /**
   * @method register
   * @description Registers and validates a plugin.
   * @param {object} plugin - The plugin object to register.
   * @property {string} plugin.name - The name of the plugin.
   * @property {string} plugin.type - The type of the plugin (e.g., 'effect', 'transition').
   * @property {function} plugin.onLoad - The function to be called when the plugin is loaded.
   */
  register(plugin) {
    if (!plugin) {
      console.warn('Invalid plugin: Plugin object is null or undefined.');
      return;
    }

    if (typeof plugin.name !== 'string' || plugin.name.trim() === '') {
      console.warn(
        'Invalid plugin: "name" must be a non-empty string.',
        plugin
      );
      return;
    }

    if (typeof plugin.type !== 'string' || plugin.type.trim() === '') {
      console.warn(
        'Invalid plugin: "type" must be a non-empty string.',
        plugin
      );
      return;
    }

    if (typeof plugin.onLoad !== 'function') {
      console.warn('Invalid plugin: "onLoad" must be a function.', plugin);
      return;
    }

    if (this.plugins.some((p) => p.name === plugin.name)) {
      console.warn(`Plugin with name "${plugin.name}" is already registered.`);
      return;
    }

    this.plugins.push(plugin);
  }
}

/**
 * @class RenderEngine
 * @description Handles all WebGL-based drawing operations.
 * Manages a multi-pass rendering pipeline for applying post-processing effects.
 */
class RenderEngine {
  /**
   * @constructor
   * @param {p5} p - The p5.js instance used for drawing.
   * @param {HTMLCanvasElement} canvas - The main canvas element.
   */
  constructor(p, canvas) {
    this.p = p;
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    // Create off-screen graphics buffers for multi-pass rendering
    // sceneBuffer is where the main scene (clips and transitions) is drawn.
    this.sceneBuffer = p.createGraphics(this.width, this.height, p.WEBGL);
    // effectBuffer is used for applying post-processing shaders.
    this.effectBuffer = p.createGraphics(this.width, this.height, p.WEBGL);

    this.shaders = {}; // Cache for compiled shaders
    this.shaderPromises = {}; // Cache for shader loading promises
    this.postProcessingEffects = []; // Queue of effects for the current frame
  }

  /**
   * Loads a shader and caches the loading promise.
   * @param {string} key - A unique key to identify the shader.
   * @param {string} fragUrl - The URL to the fragment shader file.
   */
  loadShader(key, fragUrl) {
    if (this.shaders[key] || this.shaderPromises[key]) {
      return;
    }
    // p5.js's loadShader is asynchronous. We store the promise.
    const vertUrl = 'src/shaders/passthrough.vert'; // Assuming a generic vertex shader
    const promise = this.p.loadShader(vertUrl, fragUrl, (shader) => {
      this.shaders[key] = shader;
      delete this.shaderPromises[key]; // Remove promise once resolved
      console.log(`Shader "${key}" loaded.`);
    });
    this.shaderPromises[key] = promise;
  }

  /**
   * The main rendering entry point. It orchestrates the multi-pass rendering process.
   * This method is now async to await shader loading.
   * @param {Set<ClipBase>} clipsToRender - A Set of all clips that should be rendered this frame.
   * @param {TransitionBase[]} activeTransitions - A list of transitions currently active.
   * @param {number} time - The current time of the timeline.
   */
  async render(clipsToRender, activeTransitions, time) {
    // Pass 1: Render the entire scene (clips and transitions) to the scene buffer.
    this.sceneBuffer.clear();
    this.sceneBuffer.push();

    const clipsInTransition = new Set();
    for (const transition of activeTransitions) {
      clipsInTransition.add(transition.fromClip);
      clipsInTransition.add(transition.toClip);
    }

    const standaloneClips = [...clipsToRender].filter(
      (clip) => !clipsInTransition.has(clip)
    );
    standaloneClips.sort((a, b) => a.layer - b.layer);

    // Render all clips that are not part of an active transition.
    for (const clip of standaloneClips) {
      const relativeTime = time - clip.start;
      // Apply effects and render to the scene buffer
      for (const effect of clip.effects) {
        // NOTE: This logic assumes non-GPU effects for now.
        // A full implementation would check effect type.
        effect.apply(clip, this.sceneBuffer, relativeTime);
      }
      clip.render(this.sceneBuffer, relativeTime);
    }

    // Render the active transitions.
    for (const transition of activeTransitions) {
      transition.render(this.sceneBuffer, time);
    }

    this.sceneBuffer.pop();

    // Pass 2: Apply post-processing effects.
    // We'll ping-pong between buffers if there are multiple effects.
    // For now, we just apply one effect from sceneBuffer to effectBuffer.
    let sourceBuffer = this.sceneBuffer;

    if (this.postProcessingEffects.length > 0) {
      for (const effect of this.postProcessingEffects) {
        // Ensure the shader is loaded before trying to use it.
        if (this.shaderPromises[effect.type]) {
          await this.shaderPromises[effect.type];
        }

        const shader = this.shaders[effect.type];
        if (shader) {
          this.effectBuffer.shader(shader);
          shader.setUniform('u_texture', sourceBuffer);

          // Apply all uniforms defined on the effect object
          if (effect.uniforms) {
            for (const [key, value] of Object.entries(effect.uniforms)) {
              shader.setUniform(key, value);
            }
          }

          // Draw a full-screen quad to apply the shader to the entire buffer
          this.effectBuffer.rect(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
          );
          sourceBuffer = this.effectBuffer; // The output of this pass is the input for the next
        }
      }
    }

    // Pass 3: Draw the final result to the main canvas.
    this.p.image(sourceBuffer, 0, 0);

    // Clear the effects queue for the next frame.
    this.postProcessingEffects = [];
  }
}

/**
 * @class ErrorHandler
 * @description Provides a centralized way to handle and display errors and warnings.
 */
class ErrorHandler {
  /**
   * Handles critical errors that might stop the execution.
   * Logs the error and throws it to stop the script.
   * @param {string} message - The error message.
   * @param {Error} [originalError] - The original error object.
   */
  static critical(message, originalError) {
    console.error(`[p5.videoeditor.js] Critical Error: ${message}`);
    if (originalError) {
      console.error('Original Error:', originalError);
    }
    throw new Error(`[p5.videoeditor.js] ${message}`);
  }

  /**
   * Handles warnings for non-critical issues.
   * Logs a warning message to the console.
   * @param {string} message - The warning message.
   */
  static warning(message) {
    console.warn(`[p5.videoeditor.js] Warning: ${message}`);
  }

  /**
   * Displays a user-friendly error message.
   * In a real UI, this might show a modal or a notification.
   * For now, it will just log a formatted error.
   * @param {Error} error - The error object to display.
   */
  static showUserFriendlyError(error) {
    // For now, just log a friendly message.
    // This can be expanded to show an overlay on the p5.js canvas.
    console.error(`[p5.videoeditor.js] An error occurred: ${error.message}`);
  }
}

/**
 * @class Timeline
 * @description Manages the collection of clips, their timing, and the overall playback state.
 * It is the central component that orchestrates the animation.
 */
class Timeline {
  /**
   * @constructor
   * @param {object} [options={}] - Configuration options for the timeline.
   * @param {p5} p - The p5 instance.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   * @param {number} [options.frameRate=60] - The target frame rate for the animation.
   * @param {number} [options.duration=10000] - The total duration of the timeline in milliseconds.
   */
  constructor(p, canvas, { frameRate = 60, duration = 10000 } = {}) {
    this.frameRate = frameRate;
    this.duration = duration;
    this.clips = [];
    this.transitions = [];
    this.time = 0;
    this.isPlaying = false;

    this.isBatching = false;
    this.dirtyClips = new Set();
    this.needsClipSorting = false;

    this.renderEngine = new RenderEngine(p, canvas);
    this.pluginManager = new PluginManager();
    this.transitionTypes = new Map();
    this.effectTypes = new Map();
    this._pluginsLoaded = false;
  }

  /**
   * Registers a plugin with the timeline.
   * This is a wrapper around the PluginManager's register method.
   * @param {object} plugin - The plugin to register.
   */
  use(plugin) {
    this.pluginManager.register(plugin);
  }

  /**
   * Adds a clip to the timeline.
   * @param {ClipBase} clip - The clip instance to add.
   */
  addClip(clip) {
    this.clips.push(clip);
    clip.timeline = this;

    if (this.isBatching) {
      this.needsClipSorting = true;
    } else {
      this.clips.sort((a, b) => a.layer - b.layer);
    }
  }

  /**
   * Creates and adds a transition between two clips.
   * @param {object} options - The configuration for the transition.
   * @param {ClipBase} options.fromClip - The clip to transition from.
   * @param {ClipBase} options.toClip - The clip to transition to.
   * @param {number} options.duration - The duration of the transition in milliseconds.
   * @param {string} options.type - The type of transition (e.g., 'crossfade').
   * @returns {TransitionBase} The created transition instance.
   */
  /**
   * Registers a new transition type with the timeline.
   * This is typically called by a transition plugin's onLoad method.
   * @param {string} name - The name of the transition (e.g., 'crossfade').
   * @param {TransitionBase} transitionClass - The class constructor for the transition.
   */
  registerTransitionType(name, transitionClass) {
    this.transitionTypes.set(name, transitionClass);
  }

  /**
   * Registers a new effect type with the timeline.
   * This is typically called by an effect plugin's onLoad method.
   * @param {string} name - The name of the effect (e.g., 'wiggle').
   * @param {EffectBase} effectClass - The class constructor for the effect.
   */
  registerEffectType(name, effectClass) {
    this.effectTypes.set(name, effectClass);
  }

  addTransition(options) {
    const TransitionClass = this.transitionTypes.get(options.type);
    if (!TransitionClass) {
      ErrorHandler.warning(`Unknown transition type: ${options.type}`);
      return null;
    }
    const transition = new TransitionClass(options);
    this.transitions.push(transition);
    return transition;
  }

  /**
   * Groups multiple clip or keyframe additions into a single operation to optimize performance.
   * Keyframes and clips are sorted only once at the end of the batch.
   * @param {Function} callback - A function that contains the operations to be batched.
   */
  batch(callback) {
    this.isBatching = true;
    try {
      callback();
    } finally {
      this.isBatching = false;
      this.finalizeBatch();
    }
  }

  /**
   * @private
   * Finalizes batch operations by sorting dirty clips and layers.
   */
  finalizeBatch() {
    this.dirtyClips.forEach((clip) => clip.finalizeChanges());
    this.dirtyClips.clear();

    if (this.needsClipSorting) {
      this.clips.sort((a, b) => a.layer - b.layer);
      this.needsClipSorting = false;
    }
  }

  /**
   * Gets all clips that are active at the current time.
   * @returns {ClipBase[]} An array of active clips.
   */
  getActiveClips() {
    return this.clips.filter(
      (clip) =>
        this.time >= clip.start && this.time < clip.start + clip.duration
    );
  }

  /**
   * The main update loop for the timeline. It advances the time and updates all relevant clips.
   * This includes clips that are currently active and any clips involved in an active transition.
   * @param {p5} p - The p5.js instance.
   */
  update(p) {
    if (!this._pluginsLoaded) {
      this._loadPlugins();
      this._pluginsLoaded = true;
    }

    if (this.isPlaying) {
      this.time += p.deltaTime;
      if (this.time >= this.duration) {
        this.time %= this.duration; // Frame-accurate loop
      }
    }

    const clipsToUpdate = new Set();

    // Add all clips that are currently active
    for (const clip of this.clips) {
      if (this.time >= clip.start && this.time < clip.start + clip.duration) {
        clipsToUpdate.add(clip);
      }
    }

    // Add clips from active transitions to ensure they are updated,
    // even if they are outside their normal active window.
    for (const transition of this.transitions) {
      if (
        this.time >= transition.start &&
        this.time < transition.start + transition.duration
      ) {
        clipsToUpdate.add(transition.fromClip);
        clipsToUpdate.add(transition.toClip);
      }
    }

    // Call update on every clip that needs processing for this frame.
    for (const clip of clipsToUpdate) {
      const relativeTime = this.time - clip.start;
      clip.update(p, relativeTime);
    }
  }

  /**
   * Renders the current state of the timeline by delegating to the RenderEngine.
   * @param {p5} p - The p5.js instance (passed for consistency, but RenderEngine already has it).
   */
  async render(p) {
    const clipsToRender = new Set();
    for (const clip of this.clips) {
      if (this.time >= clip.start && this.time < clip.start + clip.duration) {
        clipsToRender.add(clip);
      }
    }

    const activeTransitions = [];
    for (const transition of this.transitions) {
      if (
        this.time >= transition.start &&
        this.time < transition.start + transition.duration
      ) {
        activeTransitions.push(transition);
        // Ensure both clips involved in the transition are considered for rendering
        clipsToRender.add(transition.fromClip);
        clipsToRender.add(transition.toClip);
      }
    }

    await this.renderEngine.render(clipsToRender, activeTransitions, this.time);
  }

  /**
   * Starts or resumes playback.
   */
  play() {
    this.isPlaying = true;
  }

  /**
   * Pauses playback.
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Seeks to a specific time in the timeline.
   * @param {number} time - The time to seek to, in milliseconds.
   */
  seek(time) {
    if (time >= 0 && time <= this.duration) {
      this.time = time;
    }
  }

  /**
   * @private
   * Loads all registered plugins by calling their onLoad methods.
   * This is called automatically before the first update cycle.
   */
  _loadPlugins() {
    for (const plugin of this.pluginManager.plugins) {
      try {
        plugin.onLoad(this);
      } catch (error) {
        ErrorHandler.error(`Error loading plugin: ${plugin.name}`, error);
      }
    }
  }
}

/**
 * @class FrameRecorder
 * @description A class responsible for capturing and storing frames from a p5.js canvas.
 */
class FrameRecorder {
  /**
   * @param {HTMLCanvasElement} canvas - The p5.js canvas element to capture frames from.
   */
  constructor(canvas) {
    if (!canvas || typeof canvas.toDataURL !== 'function') {
      throw new Error(
        'A valid canvas element must be provided to the FrameRecorder.'
      );
    }
    this.canvas = canvas;
    this.frames = [];
  }

  /**
   * Starts a new recording session, clearing any previously captured frames.
   */
  start() {
    this.frames = [];
    console.log('Frame recording started.');
  }

  /**
   * Captures the current content of the canvas and stores it as a WebP Data URL.
   */
  captureFrame() {
    // Using 'image/webp' for a good balance of quality and file size.
    // Quality is set to 0.8.
    const frameDataUrl = this.canvas.toDataURL('image/webp', 0.8);
    this.frames.push(frameDataUrl);
  }

  /**
   * Stops the recording session. Currently a placeholder for future functionality.
   */
  stop() {
    console.log(
      `Frame recording stopped. Total frames captured: ${this.frames.length}`
    );
  }

  /**
   * Returns the array of captured frames.
   * @returns {string[]} An array of base64 Data URLs representing the captured frames.
   */
  getFrames() {
    return this.frames;
  }
}

/**
 * @class Exporter
 * @description Manages the video export process by communicating with a Web Worker.
 */
class Exporter {
  /**
   * @param {object} [options={}] - Configuration options.
   * @param {function} [options.onProgress] - Callback for progress updates.
   * @param {function} [options.onLog] - Callback for log messages from FFmpeg.
   * @param {function} [options.onError] - Callback for errors during the export process.
   * @param {function} [options.onComplete] - Callback when the export is finished, receiving the video Blob.
   */
  constructor({ onProgress, onLog, onError, onComplete } = {}) {
    this.worker = new Worker(new URL('./encoder.worker.js', import.meta.url), {
      type: 'module',
    });

    this.onProgress = onProgress;
    this.onLog = onLog;
    this.onError = onError;
    this.onComplete = onComplete;

    this.worker.onmessage = this.handleWorkerMessage.bind(this);
  }

  /**
   * Handles messages received from the encoding worker.
   * @param {MessageEvent} event - The message event from the worker.
   */
  handleWorkerMessage({ data }) {
    switch (data.type) {
      case 'log':
        if (this.onLog) this.onLog(data.data);
        break;
      case 'progress':
        if (this.onProgress) this.onProgress(data.data);
        break;
      case 'error':
        if (this.onError) this.onError(new Error(data.data));
        break;
      case 'done':
        const videoBlob = new Blob([data.data.buffer], { type: 'video/mp4' });
        if (this.onComplete) this.onComplete(videoBlob);
        break;
      default:
        console.warn(
          'Exporter received unknown message type from worker:',
          data.type
        );
    }
  }

  /**
   * Starts the export process by sending the captured frames to the worker.
   * @param {string[]} frames - An array of frame Data URLs.
   * @param {number} [frameRate=30] - The frame rate for the output video.
   */
  export(frames, frameRate = 30) {
    if (!frames || frames.length === 0) {
      const error = new Error('Cannot export without frames.');
      if (this.onError) {
        this.onError(error);
      } else {
        throw error;
      }
      return;
    }

    if (this.onLog) this.onLog('Sending frames to export worker...');
    this.worker.postMessage({ frames, frameRate });
  }

  /**
   * Terminates the worker. Useful for cleanup when the exporter is no longer needed.
   */
  terminate() {
    this.worker.terminate();
  }
}

/**
 * @class PlaybackController
 * @description Provides a UI and logic to control timeline playback and trigger exports.
 */
class PlaybackController {
  /**
   * @constructor
   * @param {Timeline} timeline - The timeline instance to control.
   * @param {HTMLCanvasElement} canvas - The p5.js canvas element for recording.
   * @param {HTMLElement} container - The HTML element to append the UI controls to.
   */
  constructor(timeline, canvas, container) {
    this.timeline = timeline;
    this.canvas = canvas;
    this.container = container;

    // Initialize the components needed for exporting
    this.frameRecorder = new FrameRecorder(this.canvas);
    this.exporter = new Exporter({
      onProgress: this.handleExportProgress.bind(this),
      onComplete: this.handleExportComplete.bind(this),
      onError: this.handleExportError.bind(this),
      onLog: (log) => console.log('Exporter Log:', log),
    });

    this._createUI();
  }

  /**
   * Creates and appends the playback and export UI controls.
   * @private
   */
  _createUI() {
    if (!this.container) return;

    const wrapper = document.createElement('div');
    wrapper.style.padding = '10px';
    wrapper.style.backgroundColor = '#f0f0f0';
    wrapper.style.borderTop = '1.5px solid #ccc';

    // --- Basic Play/Pause Button ---
    this.playButton = document.createElement('button');
    this.playButton.textContent = 'Play';
    this.playButton.onclick = () => {
      if (this.timeline.isPlaying) {
        this.pause();
        this.playButton.textContent = 'Play';
      } else {
        this.play();
        this.playButton.textContent = 'Pause';
      }
    };
    wrapper.appendChild(this.playButton);

    // --- Export Button ---
    this.exportButton = document.createElement('button');
    this.exportButton.textContent = 'Ekspor Video';
    this.exportButton.style.marginLeft = '10px';
    this.exportButton.onclick = () => this.startExportProcess();
    wrapper.appendChild(this.exportButton);

    // --- Status Display ---
    this.exportStatus = document.createElement('span');
    this.exportStatus.style.marginLeft = '15px';
    this.exportStatus.style.fontFamily = 'monospace';
    this.exportStatus.style.display = 'none'; // Hidden by default
    wrapper.appendChild(this.exportStatus);

    this.container.appendChild(wrapper);
  }

  /**
   * Starts the entire export workflow: rendering frames and then encoding them.
   * @private
   */
  async startExportProcess() {
    this.exportButton.disabled = true;
    this.playButton.disabled = true;
    this.exportStatus.style.display = 'inline';
    this.exportStatus.textContent = 'Rendering frames...';

    // Ensure playback is paused and reset to the start
    this.pause();
    this.seek(0);

    this.frameRecorder.start();

    const frameRate = this.timeline.frameRate || 30;
    const frameDuration = 1000 / frameRate;
    const totalDuration = this.timeline.duration;

    // Use a short timeout to allow the UI to update before the heavy loop starts.
    await new Promise((resolve) => setTimeout(resolve, 50));

    // --- Offline Rendering Loop ---
    for (let time = 0; time <= totalDuration; time += frameDuration) {
      this.timeline.seek(time); // Manually set the time
      this.timeline.render(); // Manually trigger a render at that time
      this.frameRecorder.captureFrame();
    }

    this.frameRecorder.stop();
    this.exportStatus.textContent =
      'Mengenkode video... (ini mungkin perlu waktu)';

    // Hand off the captured frames to the exporter
    this.exporter.export(this.frameRecorder.getFrames(), frameRate);
  }

  /**
   * Handles progress updates from the exporter.
   * @private
   * @param {number} progress - The export progress percentage (0-100).
   */
  handleExportProgress(progress) {
    this.exportStatus.textContent = `Mengenkode... ${progress}%`;
  }

  /**
   * Handles the completion of the export process.
   * @private
   * @param {Blob} videoBlob - The resulting video file as a Blob.
   */
  handleExportComplete(videoBlob) {
    this.exportStatus.textContent = 'Ekspor selesai! Memulai pengunduhan...';

    // Create a temporary link to trigger the download
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'p5-video-export.mp4';
    document.body.appendChild(a);
    a.click();

    // Clean up the temporary link and object URL
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this._resetUIState();
    }, 100);
  }

  /**
   * Handles any errors that occur during the export process.
   * @private
   * @param {Error} error - The error object.
   */
  handleExportError(error) {
    console.error('Export failed:', error);
    this.exportStatus.textContent = `Error: ${error.message}`;
    // Do not reset immediately, so the user can see the error.
    // Consider adding a close button for the error message in a real app.
    setTimeout(() => this._resetUIState(), 5000); // Reset after 5 seconds
  }

  /**
   * Resets the UI controls to their default, interactive state.
   * @private
   */
  _resetUIState() {
    this.exportButton.disabled = false;
    this.playButton.disabled = false;
    this.exportStatus.style.display = 'none';
    this.exportStatus.textContent = '';
  }

  /**
   * @method play
   * @description Starts or resumes playback of the timeline.
   */
  play() {
    this.timeline.play();
  }

  /**
   * @method pause
   * @description Pauses playback of the timeline.
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

/**
 * @class PerformanceManager
 * @description Monitors application performance, primarily frame rate.
 */
class PerformanceManager {
  /**
   * @constructor
   * @param {object} options - Configuration options.
   * @param {number} [options.frameRateThreshold=45] - The frame rate below which a warning is logged.
   */
  constructor({ frameRateThreshold = 45 } = {}) {
    this.frameRateThreshold = frameRateThreshold;
    this.enabled = true;
  }

  /**
   * @method monitor
   * @description Checks the current frame rate and logs a warning if it's below the threshold.
   * @param {object} p5 - The p5.js instance.
   */
  monitor(p5) {
    if (!this.enabled || !p5) {
      return;
    }

    const currentFrameRate = p5.frameRate();
    if (currentFrameRate < this.frameRateThreshold) {
      console.warn(
        `PerformanceWarning: Frame rate is ${currentFrameRate.toFixed(2)} FPS, which is below the threshold of ${this.frameRateThreshold} FPS.`
      );
    }
  }

  /**
   * @method enable
   * @description Enables the performance monitor.
   */
  enable() {
    this.enabled = true;
  }

  /**
   * @method disable
   * @description Disables the performance monitor.
   */
  disable() {
    this.enabled = false;
  }
}

/**
 * @class MemoryManager
 * @description Manages memory by caching assets and providing methods to clear unused ones.
 */
class MemoryManager {
  /**
   * @constructor
   */
  constructor() {
    this.cache = new Map();
    this.enabled = true;
  }

  /**
   * @method addAsset
   * @description Adds an asset to the cache.
   * @param {string} key - The unique key for the asset (e.g., image URL or asset ID).
   * @param {*} asset - The asset to be cached.
   */
  addAsset(key, asset) {
    if (!this.enabled) return;
    this.cache.set(key, asset);
    console.log(`Asset added to cache: ${key}`);
  }

  /**
   * @method getAsset
   * @description Retrieves an asset from the cache.
   * @param {string} key - The key of the asset to retrieve.
   * @returns {*} The cached asset, or undefined if the key does not exist.
   */
  getAsset(key) {
    return this.cache.get(key);
  }

  /**
   * @method clearUnusedAssets
   * @description Removes assets from the cache that are not present in the provided list of active asset keys.
   * @param {string[]} activeAssetKeys - An array of keys for assets that are currently active or required.
   */
  clearUnusedAssets(activeAssetKeys) {
    if (!this.enabled) return;
    const activeKeysSet = new Set(activeAssetKeys);
    let clearedCount = 0;
    for (const key of this.cache.keys()) {
      if (!activeKeysSet.has(key)) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} unused assets from cache.`);
    }
  }

  /**
   * @method clearAll
   * @description Clears the entire asset cache unconditionally.
   */
  clearAll() {
    this.cache.clear();
    console.log('Cleared all assets from cache.');
  }

  /**
   * @method enable
   * @description Enables the memory manager.
   */
  enable() {
    this.enabled = true;
  }

  /**
   * @method disable
   * @description Disables the memory manager. Caching and clearing will be skipped.
   */
  disable() {
    this.enabled = false;
  }
}

class Keyframe {
  /**
   * @param {number} time - The time in milliseconds, relative to the clip's start.
   * @param {*} value - The value of the property at this keyframe.
   * @param {string} [easing='linear'] - The easing function to use from this keyframe to the next.
   */
  constructor(time, value, easing = 'linear') {
    this.time = time;
    this.value = value;
    this.easing = easing;
  }
}

/**
 * @namespace Easing
 * @description A collection of easing functions for controlling animation speed.
 * These functions take a single argument `t` (time) which is a value between 0 and 1,
 * and return a new value, also between 0 and 1.
 * Based on the work of Grégoire Divaret-Chauveau.
 * @see {@link https://gist.github.com/gre/1650294}
 */
const Easing = {
  /**
   * No easing, no acceleration.
   * @param {number} t - Time.
   * @returns {number}
   */
  linear: (t) => t,
  /**
   * Accelerating from zero velocity.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeInQuad: (t) => t * t,
  /**
   * Decelerating to zero velocity.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeOutQuad: (t) => t * (2 - t),
  /**
   * Acceleration until halfway, then deceleration.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  /**
   * Accelerating from zero velocity.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeInCubic: (t) => t * t * t,
  /**
   * Decelerating to zero velocity.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeOutCubic: (t) => --t * t * t + 1,
  /**
   * Acceleration until halfway, then deceleration.
   * @param {number} t - Time.
   * @returns {number}
   */
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

/**
 * @class ClipBase
 * @description The fundamental building block for all media types on the timeline.
 * It manages common properties like timing, position, rotation, scale, and opacity,
 * as well as the keyframe and effects systems. This class is not intended to be used
 * directly but rather to be extended by specific clip types (e.g., TextClip, ImageClip).
 */
class ClipBase {
  /**
   * @constructor
   * @param {object} [options={}] - The configuration object for the clip.
   * @param {number} [options.start=0] - The start time of the clip on the timeline, in milliseconds.
   * @param {number} [options.duration=1000] - The duration of the clip, in milliseconds.
   * @param {number} [options.layer=0] - The layer order for rendering. Higher numbers are rendered on top.
   * @param {string|null} [options.assetKey=null] - A key to identify the asset associated with this clip, used for memory management.
   * @param {object} [options.properties={}] - Initial values for animatable properties (e.g., x, y, rotation, scale, opacity).
   */
  constructor({
    start = 0,
    duration = 1000,
    layer = 0,
    assetKey = null,
    ...options
  } = {}) {
    this.start = start;
    this.duration = duration;
    this.layer = layer;
    this.assetKey = assetKey;
    this.timeline = null;

    this.properties = {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      ...(options.properties || {}),
    };

    this.initialProperties = JSON.parse(JSON.stringify(this.properties));
    this.keyframes = {};
    this.effects = [];
  }

  /**
   * Adds a keyframe for a specific property.
   * @param {string} property - The name of the property to animate (e.g., 'x', 'opacity').
   * @param {number} time - The time for this keyframe, relative to the clip's start time, in milliseconds.
   * @param {*} value - The value of the property at this keyframe.
   * @param {string} [easing='linear'] - The easing function to use for the transition from the previous keyframe.
   * @throws {Error} If the specified property is not a recognized animatable property of the clip.
   */
  addKeyframe(property, time, value, easing = 'linear') {
    if (!Object.prototype.hasOwnProperty.call(this.properties, property)) {
      throw new Error(
        `Property "${property}" is not a recognized or animatable property of this clip.`
      );
    }

    if (!this.keyframes[property]) {
      this.keyframes[property] = [];
    }
    this.keyframes[property].push(new Keyframe(time, value, easing));

    if (this.timeline && this.timeline.isBatching) {
      this.timeline.dirtyClips.add(this);
    } else {
      this.keyframes[property].sort((a, b) => a.time - b.time);
    }
  }

  /**
   * Adds an effect to the clip using a factory pattern based on the effect type.
   * @param {object} options - The configuration for the effect.
   * @param {string} options.type - The type of effect to add (e.g., 'fadeIn', 'wiggle').
   * @returns {ClipBase} The current clip instance for chaining.
   */
  addEffect(options = {}) {
    const { type } = options;

    if (!this.timeline) {
      ErrorHandler.error(
        'Cannot add an effect to a clip that is not on a timeline.'
      );
      return this;
    }

    const EffectClass = this.timeline.effectTypes.get(type);
    if (EffectClass) {
      const effect = new EffectClass(options);
      this.effects.push(effect);
    } else {
      ErrorHandler.warn(`Effect with type "${type}" not found.`);
    }

    return this; // Allow chaining
  }

  /**
   * Sorts the keyframes for all properties. This is called by the timeline after
   * a batch update operation to ensure keyframes are in the correct chronological order.
   */
  finalizeChanges() {
    for (const prop in this.keyframes) {
      if (Object.prototype.hasOwnProperty.call(this.keyframes, prop)) {
        this.keyframes[prop].sort((a, b) => a.time - b.time);
      }
    }
  }

  /**
   * Updates the clip's properties based on the current time.
   * This involves resetting properties, calculating values from keyframes, and applying effects.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration, in milliseconds.
   */
  update(p, relativeTime) {
    Object.assign(this.properties, this.initialProperties);

    for (const prop in this.keyframes) {
      if (Object.prototype.hasOwnProperty.call(this.keyframes, prop)) {
        this.properties[prop] = this._calculateValue(p, prop, relativeTime);
      }
    }

    // The responsibility of applying effects has been moved to the RenderEngine.
  }

  /**
   * Calculates the interpolated value for a property at a given time.
   * @private
   * @param {p5} p - The p5.js instance.
   * @param {string} prop - The name of the property to calculate.
   * @param {number} time - The current time within the clip's duration.
   * @returns {*} The interpolated value of the property.
   */
  _calculateValue(p, prop, time) {
    const kfs = this.keyframes[prop];
    if (!kfs || kfs.length === 0) {
      return this.initialProperties[prop];
    }

    if (time <= kfs[0].time) {
      return kfs[0].value;
    }
    if (time >= kfs[kfs.length - 1].time) {
      return kfs[kfs.length - 1].value;
    }

    let low = 0;
    let high = kfs.length - 1;
    let prevKeyframeIndex = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (kfs[mid].time < time) {
        prevKeyframeIndex = mid;
        low = mid + 1;
      } else if (kfs[mid].time > time) {
        high = mid - 1;
      } else {
        return kfs[mid].value;
      }
    }

    const prevKeyframe = kfs[prevKeyframeIndex];
    const nextKeyframe = kfs[prevKeyframeIndex + 1];

    const t =
      (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
    const easingFunction = Easing[prevKeyframe.easing] || Easing.linear;
    const easedT = easingFunction(t);

    const from = prevKeyframe.value;
    const to = nextKeyframe.value;

    // Check if the values are p5.Color objects for color interpolation
    if (p.Color && from instanceof p.Color && to instanceof p.Color) {
      return p.lerpColor(from, to, easedT);
    }

    // Default to linear interpolation for numbers
    return p.lerp(from, to, easedT);
  }

  /**
   * Renders the clip's base transformations (translation, rotation, scale).
   * Subclasses are responsible for the actual drawing of content (e.g., text, image).
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    p.push();
    p.translate(this.properties.x, this.properties.y);
    p.rotate(this.properties.rotation);
    p.scale(this.properties.scale);
  }
}

/**
 * @class TextClip
 * @extends ClipBase
 * @description A clip for rendering and animating text on the canvas.
 *
 * @param {string} text - The text content to display.
 * @param {object} [options={}] - Configuration options for the text clip. Inherits options from ClipBase.
 * @param {number} [options.fontSize=24] - The font size of the text.
 * @param {p5.Color|string} [options.fill='#ffffff'] - The fill color of the text.
 * @param {string} [options.align='center'] - The horizontal alignment of the text ('left', 'center', 'right').
 *
 * @example
 * let textClip = editor.createTextClip("Hello, p5.js!", {
 *   start: 0,
 *   duration: 5000,
 *   properties: { x: 200, y: 200, fontSize: 32, fill: 'yellow' }
 * });
 * textClip.addKeyframe('opacity', 0, 0);
 * textClip.addKeyframe('opacity', 1000, 1);
 */
class TextClip extends ClipBase {
  constructor(text, options = {}) {
    super(options);
    this.text = text;
    this.properties.fontSize = options.fontSize || 24;
    this.properties.fill = options.fill || '#ffffff';
    this.properties.align = options.align || 'center';
  }

  /**
   * Renders the text to the canvas with its current properties and transformations.
   * This method is called automatically by the timeline in the draw loop.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    super.render(p, relativeTime);

    p.fill(this.properties.fill); // TODO: Handle opacity
    p.textSize(this.properties.fontSize);
    p.textAlign(this.properties.align, p.CENTER);
    p.text(this.text, 0, 0);

    p.pop();
  }
}

/**
 * @class ShapeClip
 * @extends ClipBase
 * @description A clip for drawing and animating basic p5.js shapes like rectangles and ellipses.
 *
 * @param {string} [shapeType='rect'] - The type of shape to draw ('rect' or 'ellipse').
 * @param {object} [options={}] - Configuration options for the shape clip. Inherits options from ClipBase.
 * @param {number} [options.width=100] - The width of the shape.
 * @param {number} [options.height=100] - The height of the shape.
 * @param {p5.Color|string} [options.fill='#ffffff'] - The fill color of the shape.
 * @param {p5.Color|string} [options.stroke='#000000'] - The stroke color of the shape.
 * @param {number} [options.strokeWeight=1] - The stroke weight of the shape.
 *
 * @example
 * let rectClip = editor.createShapeClip('rect', {
 *   start: 0,
 *   duration: 3000,
 *   properties: { width: 50, height: 50, fill: 'red' }
 * });
 * rectClip.addKeyframe('rotation', 0, 0);
 * rectClip.addKeyframe('rotation', 3000, Math.PI * 2);
 */
class ShapeClip extends ClipBase {
  constructor(shapeType = 'rect', options = {}) {
    super({
      ...options,
      properties: {
        width: 100,
        height: 100,
        fill: '#ffffff',
        stroke: '#000000',
        strokeWeight: 1,
        ...(options.properties || {}),
      },
    });
    this.shapeType = shapeType;
  }

  /**
   * Renders the shape to the canvas with its current properties and transformations.
   * This method is called automatically by the timeline in the draw loop.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    super.render(p, relativeTime);

    p.fill(this.properties.fill); // TODO: Handle opacity
    p.stroke(this.properties.stroke);
    p.strokeWeight(this.properties.strokeWeight);

    if (this.shapeType === 'rect') {
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.properties.width, this.properties.height);
    } else if (this.shapeType === 'ellipse') {
      p.ellipseMode(p.CENTER);
      p.ellipse(0, 0, this.properties.width, this.properties.height);
    }

    p.pop();
  }
}

/**
 * @class ImageClip
 * @extends ClipBase
 * @description A clip for displaying and animating an image on the canvas.
 *
 * @param {p5.Image|string} image - The p5.Image object or a URL to the image file.
 * If a URL is provided, it will be used as the `assetKey` for caching unless one is explicitly provided in the options.
 * @param {object} [options={}] - Configuration options for the image clip. Inherits options from ClipBase.
 *
 * @example
 * // Assuming 'logo.png' is preloaded
 * let imageClip = editor.createImageClip(logo, { start: 1000, duration: 4000 });
 * imageClip.addKeyframe('scale', 0, 0.5);
 * imageClip.addKeyframe('scale', 1000, 1);
 */
class ImageClip extends ClipBase {
  constructor(image, options = {}) {
    if (typeof image === 'string' && !options.assetKey) {
      options.assetKey = image;
    }
    super({
      ...options,
      properties: {
        width: image ? image.width : 0,
        height: image ? image.height : 0,
        ...(options.properties || {}),
      },
    });
    this.image = image;
  }

  /**
   * Renders the image to the canvas with its current transformations.
   * This method is called automatically by the timeline in the draw loop.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    super.render(p, relativeTime);

    if (this.image) {
      // TODO: Handle opacity with p.tint()
      p.imageMode(p.CENTER);
      p.image(this.image, 0, 0, this.properties.width, this.properties.height);
    }

    p.pop();
  }
}

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
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    // Audio clips are not rendered visually.
  }
}

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'blob:', 'data:'];

/**
 * Represents a video clip that can be placed on the timeline.
 * Manages the playback and synchronization of an HTML5 video element.
 */
class VideoClip extends ClipBase {
  /**
   * @param {string} videoSrc - The source URL of the video.
   * @param {object} options - The options for the clip, passed to ClipBase.
   */
  constructor(videoSrc, options = {}) {
    super(options);

    // Explicitly block javascript: URLs before attempting to parse.
    if (
      typeof videoSrc === 'string' &&
      videoSrc.trim().toLowerCase().startsWith('javascript:')
    ) {
      ErrorHandler.critical(
        `Unsafe video protocol: javascript:. Only safe protocols are allowed.`
      );
    }

    try {
      const url = new URL(videoSrc, document.baseURI);
      if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
        ErrorHandler.critical(
          `Unsafe video protocol: ${url.protocol}. Only safe protocols are allowed.`
        );
      }
    } catch (e) {
      ErrorHandler.critical(`Invalid video source URL: ${videoSrc}`, e);
    }

    this.videoSrc = videoSrc;
    this.isPlaying = false;

    // Add width and height to the animatable properties, with defaults.
    this.properties.width = options.width || 1920; // Default to common video width
    this.properties.height = options.height || 1080; // Default to common video height

    // Create the HTML5 video element
    this.videoElement = document.createElement('video');
    this.videoElement.src = this.videoSrc;
    this.videoElement.preload = 'auto';
    this.videoElement.muted = true; // Essential for browser autoplay policies
    this.videoElement.playsInline = true; // Essential for mobile playback
  }

  /**
   * Updates the video's state based on the timeline's current time.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration, in milliseconds.
   */
  update(p, relativeTime) {
    super.update(p, relativeTime);

    // Synchronize video time with timeline time.
    // We convert relativeTime from ms to seconds for the video element.
    const targetTime = relativeTime / 1000;

    // Add a small tolerance to prevent stuttering from minor seeks during normal playback.
    const timeDifference = Math.abs(this.videoElement.currentTime - targetTime);

    // Only seek if the difference is significant (e.g., > 50ms) or if the video is paused.
    // This handles both timeline scrubbing and initial play commands.
    if (timeDifference > 0.05 || this.videoElement.paused) {
      this.videoElement.currentTime = targetTime;
    }

    // Determine if the clip should be considered active based on its time.
    const isActive = relativeTime >= 0 && relativeTime < this.duration;

    // Play or pause the video based on the active state
    if (isActive && !this.isPlaying) {
      // Using a flag `isPlaying` prevents calling play() on every frame.
      const playPromise = this.videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Autoplay was prevented. For now, we silently ignore,
          // but a future implementation could use the ErrorHandler.
          // ErrorHandler.warning(`Video for ${this.videoSrc} failed to play: ${error.message}`);
        });
      }
      this.isPlaying = true;
    } else if (!isActive && this.isPlaying) {
      this.videoElement.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Renders the video frame to the p5.js canvas if the clip is active.
   * This method is called by the timeline's render loop.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    // Let the base class handle transformations (translation, rotation, scale)
    super.render(p, relativeTime);

    // HAVE_FUTURE_DATA (3) or HAVE_ENOUGH_DATA (4) are good states to check for readiness.
    if (this.videoElement.readyState >= 3) {
      p.imageMode(p.CENTER);
      p.image(
        this.videoElement,
        0, // x position is handled by super.render() translate
        0, // y position is handled by super.render() translate
        this.properties.width,
        this.properties.height
      );
    }

    // Restore the drawing context
    p.pop();
  }
}

/**
 * @class EffectBase
 * @description The abstract base class for all visual effects.
 * It defines the standard interface that all effects must implement.
 */
class EffectBase {
  /**
   * @constructor
   * @param {object} [options={}] - Configuration options for the effect.
   * @param {number} [options.start=0] - The start time of the effect, relative to the clip's start, in milliseconds.
   * @param {number} [options.duration=1000] - The duration of the effect in milliseconds.
   */
  constructor({ start = 0, duration = 1000 } = {}) {
    this.start = start;
    this.duration = duration;
  }

  /**
   * Abstract method to apply the effect.
   * This method must be implemented by any class that extends EffectBase.
   * @param {ClipBase} clip - The clip to which the effect is being applied.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration, in milliseconds.
   */
  apply(clip, p, relativeTime) {
    throw new Error('The "apply()" method must be implemented by a subclass.');
  }
}

/**
 * @class VideoEditor
 * @description The main entry point for users of the p5.videoeditor.js library.
 * It encapsulates the core components like the timeline, playback controls,
 * and managers into a simplified and easy-to-use API.
 *
 * @example
 * let editor = new VideoEditor();
 * let myFont;
 *
 * function preload() {
 *   myFont = loadFont('assets/font.otf');
 * }
 *
 * function setup() {
 *   createCanvas(1280, 720);
 *   editor.createVideoClip('assets/background.mp4', { start: 0, duration: 10 });
 *   const title = editor.createTextClip("Hello World", { start: 1, duration: 5 });
 *   title.addKeyframe('x', 0, 100);
 *   title.addKeyframe('x', 5000, 500);
 * }
 *
 * // The draw loop needs to be async if using shaders, but it's good practice
 * // to make it async anyway to handle any future async rendering tasks.
 * async function draw() {
 *   background(0);
 *   editor.update(p5.instance);
 *   await editor.render(p5.instance);
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
   * @param {p5} p - The p5.js instance. Required for rendering.
   * @param {object} [options.performance] - Performance-related settings passed to the PerformanceManager.
   * @param {HTMLCanvasElement} [options.canvas=null] - The p5.js canvas element. Required for exporting.
   * @param {HTMLElement} [options.uiContainer=null] - The container to append the UI controls to.
   */
  constructor(p, { canvas = null, uiContainer = null, ...options } = {}) {
    if (!p) {
      throw new Error(
        'A p5.js instance must be provided to the VideoEditor constructor.'
      );
    }
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
   * Creates a video clip and adds it to the timeline.
   * @param {string} videoSrc - The source URL of the video file.
   * @param {object} [options={}] - Configuration options for the VideoClip.
   * @returns {VideoClip} The newly created VideoClip instance.
   */
  createVideoClip(videoSrc, options = {}) {
    const clip = new VideoClip(videoSrc, options);
    this.timeline.addClip(clip);
    return clip;
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

    const activeAssetKeys = this.timeline
      .getActiveClips()
      .map((clip) => clip.assetKey)
      .filter((key) => key);
    this.memoryManager.clearUnusedAssets(activeAssetKeys);
  }

  /**
   * Renders the current state of the timeline to the canvas. This method should be
   * called in the `draw` loop of your p5.js sketch, after `update`.
   * @param {p5} p - The p5.js instance, used for drawing operations.
   */
  async render(p) {
    await this.timeline.render(p);
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

export {
  AudioClip,
  ClipBase,
  EffectBase,
  ErrorHandler,
  ImageClip,
  MemoryManager,
  PerformanceManager,
  PlaybackController,
  ShapeClip,
  TextClip,
  Timeline,
  VideoClip,
  VideoEditor,
};
//# sourceMappingURL=p5.videoeditor.esm.js.map
