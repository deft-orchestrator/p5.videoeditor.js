import ClipBase from './ClipBase.js';

class ImageClip extends ClipBase {
  constructor(image, options = {}) {
    // If the image is a string (like a URL), use it as the assetKey by default
    if (typeof image === 'string' && !options.assetKey) {
      options.assetKey = image;
    }
    super(options);
    this.image = image; // p5.Image object or a string to be loaded
  }

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
