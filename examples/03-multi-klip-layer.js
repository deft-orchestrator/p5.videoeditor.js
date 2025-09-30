import { VideoEditor } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;

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

    // Create a background graphic to act as our "image"
    const bgGraphic = p.createGraphics(150, 150);
    bgGraphic.background('#577590');
    bgGraphic.fill('#f9c74f');
    bgGraphic.noStroke();
    bgGraphic.rectMode(p.CENTER);
    bgGraphic.rect(75, 75, 50, 50);

    // An image clip on the bottom layer (layer 0), created with the factory method and chaining
    editor
      .createImageClip(bgGraphic, {
        start: 0,
        duration: 6000,
        layer: 0,
        properties: {
          x: p.width / 2,
          y: p.height / 2,
          width: 150,
          height: 150,
          opacity: 0.5,
        },
      })
      .addKeyframe('rotation', 0, -0.2)
      .addKeyframe('rotation', 6000, 0.2);

    // A text clip on a higher layer (layer 1)
    editor.createTextClip('Layer 1: On Top', {
      start: 500,
      duration: 2000,
      layer: 1,
      properties: {
        x: p.width / 2,
        y: 100,
        fontSize: 32,
        fill: '#f1faee',
      },
    });

    // Another text clip that appears later, also on layer 1
    editor.createTextClip('Appears Later', {
      start: 3000,
      duration: 2500,
      layer: 1,
      properties: {
        x: p.width / 2,
        y: 260,
        fontSize: 32,
        fill: '#a8dadc',
      },
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
    await editor.render(); // p is no longer needed here after RenderEngine refactor
  };
};

new p5(sketch);
