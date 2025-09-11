import ClipBase from './ClipBase.js';

class ImageClip extends ClipBase {
  constructor(image, options = {}) {
    super(options);
    this.image = image; // p5.Image object
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
