import { PluginManager } from './PluginManager.js';
import RenderEngine from './RenderEngine.js';

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
    this._clipsToProcessThisFrame = [];

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
      // In a real application, you might use ErrorHandler here.
      console.error(`Unknown transition type: ${options.type}`);
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
    this.dirtyClips.forEach(clip => clip.finalizeChanges());
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
    return this.clips.filter(clip =>
      this.time >= clip.start && this.time < (clip.start + clip.duration)
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
      if (this.time > this.duration) {
        this.time = 0; // Simple loop
      }
    }

    const clipsToUpdate = new Set(this.getActiveClips());

    // Add clips from active transitions to ensure they are updated,
    // even if they are no longer technically "active".
    for (const transition of this.transitions) {
      if (this.time >= transition.start && this.time < (transition.start + transition.duration)) {
        clipsToUpdate.add(transition.fromClip);
        clipsToUpdate.add(transition.toClip);
      }
    }

    this._clipsToProcessThisFrame = Array.from(clipsToUpdate);

    // Call update on every clip that needs processing for this frame.
    for (const clip of this._clipsToProcessThisFrame) {
      const relativeTime = this.time - clip.start;
      clip.update(p, relativeTime);
    }
  }

  /**
   * Renders the current state of the timeline by delegating to the RenderEngine.
   * @param {p5} p - The p5.js instance (passed for consistency, but RenderEngine already has it).
   */
  render(p) {
    this.renderEngine.render(this._clipsToProcessThisFrame, this.transitions, this.time);
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
        // In a real application, you might use ErrorHandler here.
        console.error(`Error loading plugin: ${plugin.name}`, error);
      }
    }
  }
}

export default Timeline;
