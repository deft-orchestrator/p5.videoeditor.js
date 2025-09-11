import ClipBase from './ClipBase.js';

class ShapeClip extends ClipBase {
  constructor(shapeType = 'rect', options = {}) {
    super(options);
    this.shapeType = shapeType;

    // Shape-specific properties
    this.properties.width = options.width || 100;
    this.properties.height = options.height || 100;
    this.properties.fill = options.fill || '#ffffff';
    this.properties.stroke = options.stroke || '#000000';
    this.properties.strokeWeight = options.strokeWeight || 1;
  }

  render(p, relativeTime) {
    super.render(p, relativeTime);

    p.fill(this.properties.fill); // TODO: Handle opacity
    p.stroke(this.properties.stroke);
    p.strokeWeight(this.properties.strokeWeight);

    if (this.shapeType === 'rect') {
      p.rectMode(p.CENTER); // draw from center to align with x,y
      p.rect(0, 0, this.properties.width, this.properties.height);
    } else if (this.shapeType === 'ellipse') {
      p.ellipseMode(p.CENTER);
      p.ellipse(0, 0, this.properties.width, this.properties.height);
    }
    // can add more shapes later

    p.pop();
  }
}

export default ShapeClip;
