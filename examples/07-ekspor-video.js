import { VideoEditor, ShapeClip, TextClip } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    const uiContainer = document.getElementById('controls');
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);

    // NOTE: The UI for the PlaybackController, including the "Export" button,
    // will be appended to the `uiContainer` div.
    editor = new VideoEditor(p, {
      duration: 3000, // 3-second timeline
      canvas: canvas.elt,
      uiContainer: uiContainer,
    });

    // Create a simple scene to export
    const rect = new ShapeClip('rect', {
      start: 0,
      duration: 3000,
      properties: {
        x: 50,
        y: 180,
        width: 100,
        height: 100,
        fill: '#457b9d',
      }
    });
    rect.addKeyframe('x', 0, 50);
    rect.addKeyframe('x', 3000, p.width - 50);
    rect.addKeyframe('rotation', 0, 0);
    rect.addKeyframe('rotation', 3000, p.PI);
    editor.addClip(rect);

    const text = new TextClip('Export Me!', {
      start: 500,
      duration: 2000,
      layer: 1,
      properties: {
        x: p.width / 2,
        y: 100,
        fontSize: 48,
        fill: '#f1faee',
      }
    });
    text.addEffect({type: 'fadeIn', duration: 500});
    text.addEffect({type: 'fadeOut', duration: 500, start: 1500});
    editor.addClip(text);

    // In a real app, you might not auto-play if the goal is just to show the button.
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
