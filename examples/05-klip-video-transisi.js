import { VideoEditor } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    const uiContainer = document.getElementById('controls');
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);

    editor = new VideoEditor(p, {
      duration: 8000, // 8-second timeline
      canvas: canvas.elt,
      uiContainer: uiContainer,
    });

    // The 'crossfade' transition is built-in and auto-loaded.

    // First shape clip (a red rectangle)
    const clip1 = editor.createShapeClip('rect', {
      start: 0,
      duration: 5000,
      properties: {
        width: 150,
        height: 150,
        x: p.width / 2 - 80,
        y: p.height / 2,
        fill: '#f94144',
      },
    });

    // Second shape clip (a green ellipse)
    const clip2 = editor.createShapeClip('ellipse', {
      start: 4000, // Starts 1 second before the first clip ends
      duration: 4000,
      properties: {
        width: 150,
        height: 150,
        x: p.width / 2 + 80,
        y: p.height / 2,
        fill: '#90be6d',
      },
    });

    // Add a transition between the two clips
    editor.timeline.addTransition({
      fromClip: clip1,
      toClip: clip2,
      duration: 2000, // 2-second cross-fade
      type: 'crossfade',
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