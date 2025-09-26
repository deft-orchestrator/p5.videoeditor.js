import { VideoEditor } from '../src/p5.videoeditor.js';

// This example demonstrates animating nested properties of a custom object,
// a powerful feature for generative art and complex animations.

const sketch = (p) => {
  let editor;

  // A custom object to hold our particle's properties
  const particle = {
    pos: { x: 100, y: 180 },
    style: {
      color: { r: 230, g: 57, b: 70 },
      size: 20,
    },
  };

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);
    document.getElementById('controls').innerHTML = ''; // Clear controls for this example

    // 1. Create the editor instance
    editor = new VideoEditor(p, {
      duration: 5000, // 5-second timeline
      canvas: canvas.elt,
    });

    // 2. Create a "ShapeClip" but use a custom drawing function.
    //    We pass our custom 'particle' object as one of the properties.
    editor
      .createShapeClip('custom', {
        duration: 5000,
        properties: {
          // Pass the entire particle object into the clip's properties
          particle: particle,
        },
        // Provide a custom draw function for this clip
        draw: (p, props) => {
          const { particle } = props;
          p.noStroke();
          p.fill(particle.style.color.r, particle.style.color.g, particle.style.color.b);
          p.circle(particle.pos.x, particle.pos.y, particle.style.size);
        },
      })
      // 3. Animate nested properties using dot notation strings
      .addKeyframe('particle.pos.x', 0, 100)
      .addKeyframe('particle.pos.x', 5000, 540)
      .addKeyframe('particle.style.color.g', 0, 57) // Animate only the green channel
      .addKeyframe('particle.style.color.g', 2500, 255)
      .addKeyframe('particle.style.color.g', 5000, 57)
      .addKeyframe('particle.style.size', 0, 20)
      .addKeyframe('particle.style.size', 1000, 80)
      .addKeyframe('particle.style.size', 2500, 20, 'easeOutBounce')
      .addKeyframe('particle.style.size', 4000, 80)
      .addKeyframe('particle.style.size', 5000, 20, 'easeOutBounce');

    // 4. Start playback
    editor.play();

    // Dispatch event for the example loader
    window.dispatchEvent(
      new CustomEvent('sketch-loaded', { detail: { p5: p } })
    );
  };

  p.draw = () => {
    p.background(50);
    editor.update(p);
    editor.render();
  };
};

new p5(sketch);