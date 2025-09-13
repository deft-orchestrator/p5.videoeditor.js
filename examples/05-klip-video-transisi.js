import { VideoEditor, VideoClip } from '../src/p5.videoeditor.js';
import { CrossFadeTransitionPlugin } from '../src/plugins/CrossFadeTransitionPlugin.js';

const sketch = (p) => {
  let editor;

  // NOTE: Provide your own video files here.
  // For best results, use small, muted mp4 videos.
  const videoSrc1 = 'https://p5js.org/assets/examples/videos/tree.mp4';
  const videoSrc2 = 'https://p5js.org/assets/examples/videos/sea.mp4';

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

    // Register the plugin with the timeline
    editor.timeline.use(CrossFadeTransitionPlugin);

    // First video clip
    const clip1 = new VideoClip(videoSrc1, {
      start: 0,
      duration: 5000,
      properties: {
        width: p.width,
        height: p.height,
        x: p.width / 2,
        y: p.height / 2,
      }
    });
    editor.addClip(clip1);

    // Second video clip
    const clip2 = new VideoClip(videoSrc2, {
      start: 4000, // Starts 1 second before the first clip ends
      duration: 4000,
      properties: {
        width: p.width,
        height: p.height,
        x: p.width / 2,
        y: p.height / 2,
      }
    });
    editor.addClip(clip2);

    // Add a transition between the two clips
    editor.timeline.addTransition({
      fromClip: clip1,
      toClip: clip2,
      duration: 2000, // 2-second cross-fade
      type: 'crossfade',
    });

    editor.play();
    window.dispatchEvent(new CustomEvent('sketch-loaded', { detail: { p5: p } }));
  };

  p.draw = () => {
    p.background(0); // Black background for video
    editor.update(p);
    editor.render(p);
  };
};

new p5(sketch);
