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
    this.postProcessingEffects = []; // Queue of effects for the current frame
  }

  /**
   * Preloads a shader file.
   * @param {string} key - A unique key to identify the shader.
   * @param {string} fragUrl - The URL to the fragment shader file.
   */
  async loadShader(key, fragUrl) {
    if (this.shaders[key]) return;
    // p5.js's loadShader needs both a vert and a frag shader.
    // We can use a generic pass-through vertex shader for post-processing.
    const vertUrl = 'src/shaders/passthrough.vert'; // Assuming a generic vertex shader
    this.shaders[key] = this.p.loadShader(vertUrl, fragUrl);
    console.log(`Shader "${key}" loaded.`);
  }

  /**
   * The main rendering entry point. It orchestrates the multi-pass rendering process.
   * @param {ClipBase[]} clipsToProcess - The list of clips that need to be rendered.
   * @param {TransitionBase[]} transitions - The list of all transitions.
   * @param {number} time - The current time of the timeline.
   */
  render(clipsToProcess, transitions, time) {
    // Pass 1: Render the entire scene (clips and transitions) to the scene buffer.
    this.sceneBuffer.clear();
    this.sceneBuffer.push();

    // --- Start of logic moved from old Timeline.render() ---
    const standaloneClips = new Set(clipsToProcess);
    const activeTransitions = [];

    // Identify active transitions and separate their clips from the main render list
    for (const transition of transitions) {
      if (time >= transition.start && time < (transition.start + transition.duration)) {
        activeTransitions.push(transition);
        standaloneClips.delete(transition.fromClip);
        standaloneClips.delete(transition.toClip);
      }
    }

    // Render all clips that are not part of an active transition, sorted by layer.
    const sortedClips = Array.from(standaloneClips).sort((a, b) => a.layer - b.layer);
    for (const clip of sortedClips) {
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
    // --- End of logic moved ---

    this.sceneBuffer.pop();

    // Pass 2: Apply post-processing effects.
    // We'll ping-pong between buffers if there are multiple effects.
    // For now, we just apply one effect from sceneBuffer to effectBuffer.
    let sourceBuffer = this.sceneBuffer;

    if (this.postProcessingEffects.length > 0) {
        for (const effect of this.postProcessingEffects) {
            const shader = this.shaders[effect.type];
            if (shader) {
                this.effectBuffer.shader(shader);
                shader.setUniform('u_texture', sourceBuffer);
                shader.setUniform('u_brightness', effect.brightness || 0.0);
                shader.setUniform('u_contrast', effect.contrast || 0.0);

                // Draw a full-screen quad to apply the shader to the entire buffer
                this.effectBuffer.rect(-this.width / 2, -this.height / 2, this.width, this.height);
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

export default RenderEngine;
