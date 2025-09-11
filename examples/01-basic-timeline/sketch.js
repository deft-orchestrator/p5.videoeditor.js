// Import the necessary classes from the main library file
import {
  VideoEditor,
  TextClip,
  ShapeClip,
  FadeInEffect,
  FadeOutEffect
} from '../../../src/p5.videoeditor.js';

let editor;

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(400, 400);
    p.textFont('sans-serif');

    // 1. Create the main editor instance
    editor = new VideoEditor({ duration: 3000 }); // 3-second timeline

    // 2. Create clips and add them to the editor

    // A red rectangle that moves from left to right
    const rectClip = new ShapeClip('rect', {
      start: 0,
      duration: 3000,
      layer: 0, // Lower layers are drawn first
      // Initial properties
      width: 50,
      height: 50,
      fill: '#e63946',
      x: 50,
      y: 200,
    });
    // Animate its position using keyframes
    rectClip.addKeyframe('x', 0, 50);
    rectClip.addKeyframe('x', 3000, 350);
    editor.addClip(rectClip);

    // A text clip that fades in and out
    const textClip = new TextClip('Hello, World!', {
      start: 500,     // Starts at 0.5s
      duration: 2000, // Lasts for 2s (ends at 2.5s)
      layer: 1,       // Drawn on top of the rectangle
      // Initial properties
      x: 200,
      y: 100,
      fontSize: 32,
      fill: '#f1faee',
    });
    // Add effects for fade in and fade out
    // Fade in for the first 500ms of the clip's duration
    textClip.addEffect(new FadeInEffect({ duration: 500 }));
    // Fade out for the last 500ms of the clip's duration
    textClip.addEffect(new FadeOutEffect({ start: 1500, duration: 500 }));
    editor.addClip(textClip);

    // 3. Start playback
    editor.play();
  };

  p.draw = () => {
    p.background(50);

    // 4. IMPORTANT: Update and render the editor on each frame
    editor.update(p);
    editor.render(p);

    // Optional: Draw a progress bar to visualize the timeline
    p.fill(255, 100);
    p.noStroke();
    const progress = editor.timeline.time / editor.timeline.duration;
    p.rect(0, p.height - 5, p.width * progress, 5);
  };
};

// Create the p5.js sketch instance
new p5(sketch, document.querySelector('main'));
