import { VideoEditor } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;
  let popupTextClip;
  let isPausedByHotspot = false;
  // A public domain test video
  const VIDEO_URL =
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4';

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    editor = new VideoEditor(p, { canvas: canvas.elt });

    const videoClip = editor.createVideoClip(VIDEO_URL, {
      start: 0,
      duration: 10000,
      properties: {
        x: p.width / 2,
        y: p.height / 2,
        width: p.width,
        height: p.height,
      },
    });

    // Create a text clip that will serve as our popup message.
    // We'll place it far in the future on the timeline so it's initially hidden.
    popupTextClip = editor.createTextClip('', {
      start: 999999, // Initially hidden
      duration: 999999,
      properties: {
        x: p.width / 2,
        y: p.height / 2,
        fontSize: 32,
        fill: 'white',
        stroke: 'black',
        strokeWeight: 4,
      },
    });

    // Hotspot 1: Appears over the bunny from 2s to 5s.
    videoClip.addHotspot({
      x: -150,
      y: -50,
      width: 100,
      height: 80,
      start: 2000,
      duration: 3000,
      onClick: () => {
        isPausedByHotspot = true;
        editor.pause();
        popupTextClip.properties.text = 'You found the bunny!';
        // Make the popup appear now by moving its start time to the current time.
        popupTextClip.start = editor.timeline.time;
        console.log('Hotspot 1 clicked! Video paused.');
      },
    });

    // Hotspot 2: Appears on the right side from 6s to 8s.
    videoClip.addHotspot({
      x: 100,
      y: 100,
      width: 120,
      height: 60,
      start: 6000,
      duration: 2000,
      onClick: () => {
        isPausedByHotspot = true;
        editor.pause();
        popupTextClip.properties.text = 'Click again to restart video.';
        popupTextClip.start = editor.timeline.time;
        console.log('Hotspot 2 clicked! Video paused.');
      },
    });

    editor.play();
  };

  p.draw = () => {
    p.background(0);
    editor.update(p);
    editor.render();
  };

  p.mousePressed = () => {
    // If paused by a hotspot, the next click should hide the message and resume playback.
    if (isPausedByHotspot) {
      isPausedByHotspot = false;
      // Hide the popup by moving it back to the future.
      popupTextClip.start = 999999;
      editor.play();
    } else {
      // Otherwise, let the editor check for hotspot clicks.
      editor.handleMousePressed(p);
    }
  };
};

new p5(sketch);
