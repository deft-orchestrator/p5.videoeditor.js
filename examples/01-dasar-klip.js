import { VideoEditor, ShapeClip, TextClip } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    const uiContainer = document.getElementById('controls');
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);

    editor = new VideoEditor(p, {
      duration: 5000, // 5-second timeline
      canvas: canvas.elt,
      uiContainer: uiContainer,
    });

    // Create a blue rectangle that stays for the whole duration
    editor.addClip(new ShapeClip('rect', {
      start: 0,
      duration: 5000,
      properties: {
        x: 150,
        y: 180,
        width: 100,
        height: 100,
        fill: '#007bff',
      }
    }));

    // Create a text clip that appears for 3 seconds
    editor.addClip(new TextClip('Hello, Editor!', {
      start: 1000,
      duration: 3000,
      properties: {
        x: 320,
        y: 100,
        fontSize: 48,
        fill: '#ffffff',
      }
    }));

    editor.play();

    // Notify the host page that the sketch is loaded
    window.dispatchEvent(new CustomEvent('sketch-loaded', { detail: { p5: p } }));
  };

  p.draw = () => {
    p.background(50);
    editor.update(p);
    editor.render(p);
  };
};

new p5(sketch);
