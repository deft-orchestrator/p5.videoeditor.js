import { VideoEditor, ImageClip } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;
  let p5Logo;

  p.preload = () => {
    p5Logo = p.loadImage('https://p5js.org/assets/img/p5js-square.svg');
  };

  p.setup = async () => {
    const canvas = p.createCanvas(640, 360);
    const uiContainer = document.getElementById('controls');
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);

    editor = new VideoEditor(p, {
      duration: 5000,
      canvas: canvas.elt,
      uiContainer: uiContainer,
    });

    // Pre-load the shader required for the effect
    await editor.timeline.renderEngine.loadShader(
      'BrightnessContrast',
      '../src/shaders/brightness-contrast.frag'
    );

    const image = new ImageClip(p5Logo, {
      start: 0,
      duration: 5000,
      properties: {
        x: p.width / 2,
        y: p.height / 2,
        width: 200,
        height: 200,
      },
    });

    // Add the GPU effect
    image.addEffect({
      type: 'brightnessContrast',
      brightness: 0.2, // Make it 20% brighter
      contrast: 0.3, // Increase contrast by 30%
    });

    // Animate the effect properties over time
    image.addKeyframe('brightness', 0, 0.2);
    image.addKeyframe('brightness', 2500, -0.2);
    image.addKeyframe('brightness', 5000, 0.2);

    image.addKeyframe('contrast', 0, 0.3);
    image.addKeyframe('contrast', 2500, 0.0);
    image.addKeyframe('contrast', 5000, 0.3);

    editor.addClip(image);
    editor.play();

    window.dispatchEvent(
      new CustomEvent('sketch-loaded', { detail: { p5: p } })
    );
  };

  p.draw = () => {
    p.background(50);
    editor.update(p);
    editor.render(p);
  };
};

new p5(sketch);
