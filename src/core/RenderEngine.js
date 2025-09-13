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

    const standaloneClips = [...clipsToRender].filter(clip => !clipsInTransition.has(clip));
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
