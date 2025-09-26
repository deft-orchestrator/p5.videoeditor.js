import { VideoEditor } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;
  let p5Logo;

  p.preload = () => {
    // It's good practice to load assets in preload
    p5Logo = p.loadImage('https://p5js.org/assets/img/p5js-square.svg');
  };

  p.setup = () => {
    const canvas = p.createCanvas(640, 360, p.WEBGL); // Use WEBGL mode for shaders
    const uiContainer = document.getElementById('controls');
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);

    editor = new VideoEditor(p, {
      duration: 5000,
      canvas: canvas.elt,
      uiContainer: uiContainer,
    });

    // Create a clip and add it to the timeline
    const imageClip = editor.createImageClip(p5Logo, {
      start: 0,
      duration: 5000,
      properties: {
        x: 0, // Center in WEBGL mode
        y: 0,
        width: 200,
        height: 200,
        imageMode: 'center',
      },
    });

    // Add the built-in 'blur' GPU effect
    const blurEffect = imageClip.addEffect('blur', {
      radius: 0, // Start with no blur
    });

    // Animate the blur radius over time using keyframes on the effect itself
    blurEffect.addKeyframe('radius', 0, 0); // At 0s, radius is 0
    blurEffect.addKeyframe('radius', 2500, 15); // At 2.5s, radius is 15
    blurEffect.addKeyframe('radius', 5000, 0); // At 5s, radius is 0

    editor.play();

    window.dispatchEvent(
      new CustomEvent('sketch-loaded', { detail: { p5: p } })
    );
  };

  p.draw = () => {
    // The RenderEngine handles clearing the background, so we don't need p.background()
    editor.update(p);
    editor.render();
  };
};

new p5(sketch);
