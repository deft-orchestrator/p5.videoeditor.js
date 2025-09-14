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
    this.sceneBuffer = p.createGraphics(this.width, this.height, p.WEBGL);
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
    const vertUrl = 'src/shaders/passthrough.vert';
    const promise = this.p.loadShader(vertUrl, fragUrl, (shader) => {
      this.shaders[key] = shader;
      delete this.shaderPromises[key];
      console.log(`Shader "${key}" loaded.`);
    });
    this.shaderPromises[key] = promise;
  }

  /**
   * Orchestrates the multi-pass rendering process.
   * @param {Set<ClipBase>} clipsToRender - A Set of all clips that should be rendered this frame.
   * @param {TransitionBase[]} activeTransitions - A list of transitions currently active.
   * @param {number} time - The current time of the timeline.
   */
  async render(clipsToRender, activeTransitions, time) {
    // Pass 1: Render the scene of clips and transitions to a buffer.
    this._renderScene(clipsToRender, activeTransitions, time);

    // Pass 2: Apply post-processing effects, ping-ponging between buffers.
    const finalBuffer = await this._applyPostProcessing();

    // Pass 3: Draw the final result to the main canvas.
    this.p.image(finalBuffer, 0, 0);

    // Clear the effects queue for the next frame.
    this.postProcessingEffects = [];
  }

  /**
   * @private
   * Renders all active clips and transitions to the main scene buffer.
   */
  _renderScene(clipsToRender, activeTransitions, time) {
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

    for (const clip of standaloneClips) {
      const relativeTime = time - clip.start;
      for (const effect of clip.effects) {
        effect.apply(clip, this.sceneBuffer, relativeTime);
      }
      clip.render(this.sceneBuffer);
    }

    for (const transition of activeTransitions) {
      transition.render(this.sceneBuffer, time);
    }

    this.sceneBuffer.pop();
  }

  /**
   * @private
   * Applies all queued post-processing effects to the scene buffer.
   * @returns {p5.Graphics} The final graphics buffer with all effects applied.
   */
  async _applyPostProcessing() {
    if (this.postProcessingEffects.length === 0) {
      return this.sceneBuffer;
    }

    let sourceBuffer = this.sceneBuffer;
    let destinationBuffer = this.effectBuffer;

    for (let i = 0; i < this.postProcessingEffects.length; i++) {
      const effect = this.postProcessingEffects[i];

      if (this.shaderPromises[effect.type]) {
        await this.shaderPromises[effect.type];
      }

      const shader = this.shaders[effect.type];
      if (shader) {
        destinationBuffer.shader(shader);
        shader.setUniform('u_texture', sourceBuffer);

        if (effect.uniforms) {
          for (const [key, value] of Object.entries(effect.uniforms)) {
            shader.setUniform(key, value);
          }
        }

        destinationBuffer.rect(
          -this.width / 2,
          -this.height / 2,
          this.width,
          this.height
        );

        // Ping-pong: swap buffers for the next pass
        [sourceBuffer, destinationBuffer] = [destinationBuffer, sourceBuffer];
      }
    }

    // The final rendered image is in the last sourceBuffer
    return sourceBuffer;
  }
}

export default RenderEngine;
