import { VideoEditor, ShapeClip } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    const uiContainer = document.getElementById('controls');
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);

    editor = new VideoEditor(p, {
      duration: 4000, // 4-second timeline
      canvas: canvas.elt,
      uiContainer: uiContainer,
    });

    const shape = new ShapeClip('rect', {
      start: 0,
      duration: 4000,
      properties: {
        x: p.width / 2,
        y: p.height / 2,
        width: 100,
        height: 100,
        fill: '#f94144',
        rotation: 0,
        scale: 1,
      }
    });

    // Animate position
    shape.addKeyframe('x', 0, 50);
    shape.addKeyframe('x', 2000, p.width - 50);
    shape.addKeyframe('x', 4000, 50);

    // Animate rotation
    shape.addKeyframe('rotation', 0, 0);
    shape.addKeyframe('rotation', 4000, p.TWO_PI * 2); // Two full rotations

    // Animate scale
    shape.addKeyframe('scale', 0, 1);
    shape.addKeyframe('scale', 1000, 1.5);
    shape.addKeyframe('scale', 2000, 1);
    shape.addKeyframe('scale', 3000, 1.5);
    shape.addKeyframe('scale', 4000, 1);

    editor.addClip(shape);
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
