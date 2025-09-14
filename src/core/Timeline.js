import { PluginManager } from './PluginManager.js';
import RenderEngine from './RenderEngine.js';
import ErrorHandler from '../utils/ErrorHandler.js';

/**
 * @class Timeline
 * @description Manages the collection of clips, their timing, and the overall playback state.
 * It is the central component that orchestrates the animation. This class is typically
 * accessed via `editor.timeline`.
 */
class Timeline {
  /**
   * @constructor
   * @param {p5} p - The p5.js instance.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   * @param {object} [options={}] - Configuration options for the timeline.
   * @param {number} [options.duration=10000] - The total duration of the timeline in milliseconds.
   */
  constructor(p, canvas, { duration = 10000 } = {}) {
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
   * @param {object} plugin - The plugin to register.
   * @example
   * import MyCustomPlugin from './plugins/my-plugin.js';
   * editor.timeline.use(new MyCustomPlugin());
   */
  use(plugin) {
    this.pluginManager.register(plugin);
  }

  /**
   * Adds a clip to the timeline. Typically called by the `VideoEditor` factory methods.
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
   * Registers a new transition type with the timeline.
   * @param {string} name - The name of the transition (e.g., 'crossfade').
   * @param {TransitionBase} transitionClass - The class constructor for the transition.
   */
  registerTransitionType(name, transitionClass) {
    this.transitionTypes.set(name, transitionClass);
  }

  /**
   * Registers a new effect type with the timeline.
   * @param {string} name - The name of the effect (e.g., 'wiggle').
   * @param {EffectBase} effectClass - The class constructor for the effect.
   */
  registerEffectType(name, effectClass) {
    this.effectTypes.set(name, effectClass);
  }

  /**
   * Creates and adds a transition between two clips.
   * @param {object} options - The configuration for the transition.
   * @param {ClipBase} options.fromClip - The clip to transition from.
   * @param {ClipBase} options.toClip - The clip to transition to.
   * @param {number} options.duration - The duration of the transition in milliseconds.
   * @param {string} options.type - The type of transition (e.g., 'crossfade').
   * @returns {TransitionBase|null} The created transition instance, or null if the type is unknown.
   * @example
   * const clipA = editor.createTextClip('A', { start: 0, duration: 2 });
   * const clipB = editor.createTextClip('B', { start: 1, duration: 2 });
   * editor.timeline.addTransition({ fromClip: clipA, toClip: clipB, duration: 1, type: 'crossfade' });
   */
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
   * @param {Function} callback - A function that contains the operations to be batched.
   * @example
   * editor.timeline.batch(() => {
   *   editor.createTextClip(...);
   *   editor.createImageClip(...);
   * });
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
   * Gets all clips that are directly active at the current time.
   * Note: This does not include clips that are only active because of a transition.
   * @returns {ClipBase[]} An array of active clips.
   */
  getActiveClips() {
    const activeClips = [];
    for (const clip of this.clips) {
      if (this.time >= clip.start && this.time < clip.start + clip.duration) {
        activeClips.push(clip);
      }
    }
    return activeClips;
  }

  /**
   * @private
   * Determines which clips and transitions are active at a specific time.
   * @param {number} time - The time to check against.
   * @returns {{clipsToProcess: Set<ClipBase>, activeTransitions: TransitionBase[]}}
   */
  _getFrameState(time) {
    const clipsToProcess = new Set();
    const activeTransitions = [];

    for (const clip of this.clips) {
      if (time >= clip.start && time < clip.start + clip.duration) {
        clipsToProcess.add(clip);
      }
    }

    for (const transition of this.transitions) {
      if (
        time >= transition.start &&
        time < transition.start + transition.duration
      ) {
        activeTransitions.push(transition);
        clipsToProcess.add(transition.fromClip);
        clipsToProcess.add(transition.toClip);
      }
    }

    return { clipsToProcess, activeTransitions };
  }

  /**
   * The main update loop for the timeline. It advances the time and updates all relevant clips.
   * @param {p5} p - The p5.js instance.
   * @internal
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

    const { clipsToProcess } = this._getFrameState(this.time);

    for (const clip of clipsToProcess) {
      const relativeTime = this.time - clip.start;
      clip.update(p, relativeTime);
    }
  }

  /**
   * Renders the current state of the timeline by delegating to the RenderEngine.
   * @internal
   */
  async render() {
    const { clipsToProcess, activeTransitions } = this._getFrameState(
      this.time
    );
    await this.renderEngine.render(clipsToProcess, activeTransitions, this.time);
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
   */
  _loadPlugins() {
    for (const plugin of this.pluginManager.plugins) {
      try {
        plugin.onLoad(this);
      } catch (error) {
        ErrorHandler.critical(`Error loading plugin: ${plugin.name}`, error);
      }
    }
  }
}

export default Timeline;
