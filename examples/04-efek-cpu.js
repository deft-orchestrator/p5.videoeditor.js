import { VideoEditor } from '../src/p5.videoeditor.js';
// Import the custom plugin we want to use
import { InvertColorEffectPlugin } from '../src/plugins/InvertColorEffectPlugin.js';

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

    // Register the custom effect plugin using the new high-level API
    // Note: Built-in plugins like 'wiggle' no longer need manual registration.
    editor.use(InvertColorEffectPlugin);

    // Create a text clip
    const textClip = editor.createTextClip('CPU Effects!', {
      start: 0,
      duration: 5000,
      properties: {
        x: p.width / 2,
        y: p.height / 2,
        fontSize: 64,
        fill: '#90be6d',
        textAlign: 'center',
        textBaseline: 'middle',
      },
    });

    // Use built-in effects (auto-loaded)
    textClip.addEffect({ type: 'fadeIn', duration: 1000 });
    textClip.addEffect({ type: 'wiggle', frequency: 0.5, amplitude: 15 });
    textClip.addEffect({ type: 'fadeOut', start: 4000, duration: 1000 });

    // Use our custom-loaded 'invert' effect
    textClip.addEffect({
      type: 'invert',
      start: 1500, // Invert colors from 1.5s to 3.5s
      duration: 2000,
    });

    editor.play();

    // Notify the host page that the sketch is loaded, passing both p5 and editor instances.
    window.dispatchEvent(
      new CustomEvent('sketch-loaded', { detail: { p5: p, editor: editor } })
    );
  };

  p.draw = async () => {
    p.background(50);
    editor.update(p);
    await editor.render();
  };
};

new p5(sketch);
