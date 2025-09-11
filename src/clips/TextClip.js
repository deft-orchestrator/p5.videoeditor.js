import ClipBase from './ClipBase.js';

class TextClip extends ClipBase {
  constructor(text, options = {}) {
    super(options);
    this.text = text;
    // Add text-specific properties to the animatable properties object
    this.properties.fontSize = options.fontSize || 24;
    this.properties.fill = options.fill || '#ffffff';
    this.properties.align = options.align || 'center';
  }

  render(p, relativeTime) {
    super.render(p, relativeTime); // Apply base transformations

    p.fill(this.properties.fill); // TODO: Handle opacity
    p.textSize(this.properties.fontSize);
    p.textAlign(this.properties.align, p.CENTER);
    p.text(this.text, 0, 0); // (0,0) because of p.translate in base class

    p.pop();
  }
}

export default TextClip;
