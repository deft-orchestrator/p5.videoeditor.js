import ClipBase from './ClipBase.js';

/**
 * @class ShapeClip
 * @extends ClipBase
 * @description A clip for drawing and animating basic p5.js shapes like rectangles and ellipses.
 *
 * @param {string} [shapeType='rect'] - The type of shape to draw ('rect' or 'ellipse').
 * @param {object} [options={}] - Configuration options for the shape clip. Inherits options from ClipBase.
 * @param {number} [options.width=100] - The width of the shape.
 * @param {number} [options.height=100] - The height of the shape.
 * @param {p5.Color|string} [options.fill='#ffffff'] - The fill color of the shape.
 * @param {p5.Color|string} [options.stroke='#000000'] - The stroke color of the shape.
 * @param {number} [options.strokeWeight=1] - The stroke weight of the shape.
 *
 * @example
 * let rectClip = editor.createShapeClip('rect', {
 *   start: 0,
 *   duration: 3000,
 *   properties: { width: 50, height: 50, fill: 'red' }
 * });
 * rectClip.addKeyframe('rotation', 0, 0);
 * rectClip.addKeyframe('rotation', 3000, Math.PI * 2);
 */
class ShapeClip extends ClipBase {
  constructor(shapeType = 'rect', options = {}) {
    super({
      ...options,
      properties: {
        width: 100,
        height: 100,
        fill: '#ffffff',
        stroke: '#000000',
        strokeWeight: 1,
        ...(options.properties || {}),
      },
    });
    this.shapeType = shapeType;
  }

  /**
   * Renders the shape to the canvas with its current properties and transformations.
   * This method is called automatically by the timeline in the draw loop.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    super.render(p, relativeTime);

    p.fill(this.properties.fill); // TODO: Handle opacity
    p.stroke(this.properties.stroke);
    p.strokeWeight(this.properties.strokeWeight);

    if (this.shapeType === 'rect') {
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.properties.width, this.properties.height);
    } else if (this.shapeType === 'ellipse') {
      p.ellipseMode(p.CENTER);
      p.ellipse(0, 0, this.properties.width, this.properties.height);
    }

    p.pop();
  }
}

export default ShapeClip;
