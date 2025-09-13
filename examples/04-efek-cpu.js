import { VideoEditor, TextClip } from '../src/p5.videoeditor.js';
import { WiggleEffectPlugin } from '../src/plugins/WiggleEffectPlugin.js';

const sketch = (p) => {
  let editor;

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    const uiContainer = document.getElementById('controls');
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);

    editor = new VideoEditor(p, {
      duration: 5000,
      canvas: canvas.elt,
      uiContainer: uiContainer,
    });

    // Register the custom effect plugin
    editor.timeline.use(WiggleEffectPlugin);

    // Create a text clip
    const textClip = new TextClip("CPU Effects!", {
      start: 0,
      duration: 5000,
      properties: {
        x: p.width / 2,
        y: p.height / 2,
        fontSize: 64,
        fill: '#90be6d',
      }
    });

    // Use the addEffect factory to add effects by type
    textClip.addEffect({
      type: 'fadeIn',
      duration: 1000, // Fades in over the first second
    });

    textClip.addEffect({
      type: 'wiggle',
      frequency: 0.5,  // Slow wiggle
      amplitude: 15,   // Moves 15 pixels
    });

    textClip.addEffect({
      type: 'fadeOut',
      start: 4000,     // Starts fading out at 4s
      duration: 1000,  // Fades out over the last second
    });

    editor.addClip(textClip);
    editor.play();

    window.dispatchEvent(new CustomEvent('sketch-loaded', { detail: { p5: p } }));
  };

  p.draw = () => {
    p.background(50);
    editor.update(p);
    editor.render(p);
  };
};

new p5(sketch);
