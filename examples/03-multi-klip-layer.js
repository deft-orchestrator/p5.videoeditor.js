import { VideoEditor, TextClip, ImageClip } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;
  let p5Logo;

  p.preload = () => {
    // Using a placeholder image URL. In a real scenario, this would be a local asset.
    p5Logo = p.loadImage('https://p5js.org/assets/img/p5js-square.svg');
  }

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    const uiContainer = document.getElementById('controls');
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);

    editor = new VideoEditor(p, {
      duration: 6000,
      canvas: canvas.elt,
      uiContainer: uiContainer,
    });

    // An image clip on the bottom layer (layer 0)
    const image = new ImageClip(p5Logo, {
      start: 0,
      duration: 6000,
      layer: 0,
      properties: {
        x: p.width / 2,
        y: p.height / 2,
        width: 150,
        height: 150,
        opacity: 0.2,
      }
    });
    image.addKeyframe('rotation', 0, -0.2);
    image.addKeyframe('rotation', 6000, 0.2);
    editor.addClip(image);

    // A text clip on a higher layer (layer 1)
    const text1 = new TextClip("Layer 1: On Top", {
      start: 500,
      duration: 2000,
      layer: 1,
      properties: {
        x: p.width / 2,
        y: 100,
        fontSize: 32,
        fill: '#f1faee',
      }
    });
    editor.addClip(text1);

    // Another text clip that appears later, also on layer 1
    const text2 = new TextClip("Appears Later", {
      start: 3000,
      duration: 2500,
      layer: 1,
      properties: {
        x: p.width / 2,
        y: 260,
        fontSize: 32,
        fill: '#a8dadc',
      }
    });
    editor.addClip(text2);

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
