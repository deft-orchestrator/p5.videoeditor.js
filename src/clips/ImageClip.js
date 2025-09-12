import ClipBase from './ClipBase.js';

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
    super(options);
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
      p.image(this.image, 0, 0);
    }

    p.pop();
  }
}

export default ImageClip;
