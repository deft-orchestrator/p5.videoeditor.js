/**
 * Example 13: Interactive Timeline UI
 *
 * This example demonstrates how to enable and use the interactive timeline UI.
 * A container element is passed to the VideoEditor constructor, which then
 * mounts the UI into it.
 */
import p5 from 'p5';
import { VideoEditor } from '../src/p5.videoeditor.js';

new p5((p) => {
  let editor;

  p.setup = () => {
    const canvas = p.createCanvas(1280, 720);
    const uiContainer = document.getElementById('timeline-ui-container');

    // Instantiate the editor, passing the container for the UI
    editor = new VideoEditor(p, {
      canvas: canvas.elt,
      timelineUiContainer: uiContainer,
    });

    // Add some clips to visualize on the timeline
    editor.createTextClip('Layer 1', {
      start: 0,
      duration: 5000,
      layer: 1,
      properties: { y: 100, fontSize: 48 },
    });

    editor.createShapeClip('rect', {
      start: 1000,
      duration: 7000,
      layer: 2,
      properties: { x: 200, y: 200, width: 150, height: 150, fill: 'blue' },
    });

    editor.createImageClip(
      p.loadImage('https://p5js.org/assets/img/p5js.svg'),
      {
        start: 3000,
        duration: 4000,
        layer: 0,
        properties: { y: 400, width: 100, height: 100 },
      }
    );

    editor.play();
  };

  p.draw = async () => {
    p.background(0);
    editor.update(p);
    await editor.render();
  };
});
