import ClipBase from './ClipBase.js';

/**
 * @class TextClip
 * @extends ClipBase
 * @description A clip for rendering and animating text on the canvas.
 *
 * @param {string} text - The text content to display.
 * @param {object} [options={}] - Configuration options for the text clip. Inherits options from ClipBase.
 * @param {number} [options.fontSize=24] - The font size of the text.
 * @param {p5.Color|string} [options.fill='#ffffff'] - The fill color of the text.
 * @param {string} [options.align='center'] - The horizontal alignment of the text ('left', 'center', 'right').
 *
 * @example
 * let textClip = editor.createTextClip("Hello, p5.js!", {
 *   start: 0,
 *   duration: 5000,
 *   properties: { x: 200, y: 200, fontSize: 32, fill: 'yellow' }
 * });
 * textClip.addKeyframe('opacity', 0, 0);
 * textClip.addKeyframe('opacity', 1000, 1);
 */
class TextClip extends ClipBase {
  constructor(text, options = {}) {
    super(options);
    this.text = text;
    this.properties.fontSize = options.fontSize || 24;
    this.properties.fill = options.fill || '#ffffff';
    this.properties.align = options.align || 'center';
  }

  /**
   * Renders the text to the canvas with its current properties and transformations.
   * This method is called automatically by the timeline in the draw loop.
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the clip's duration.
   */
  render(p, relativeTime) {
    super.render(p, relativeTime);

    p.fill(this.properties.fill); // TODO: Handle opacity
    p.textSize(this.properties.fontSize);
    p.textAlign(this.properties.align, p.CENTER);
    p.text(this.text, 0, 0);

    p.pop();
  }
}

export default TextClip;
