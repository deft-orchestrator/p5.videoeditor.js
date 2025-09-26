/**
 * Example 12: Export to MP4
 *
 * This example demonstrates how to export an animation as an MP4 video file
 * using FFmpeg.wasm. This is an intensive process that may take a while
 * depending on the duration and resolution.
 * Note: The export process happens in the user's browser and requires no server upload.
 */
import p5 from 'p5';
import { VideoEditor } from '../src/p5.videoeditor.js';

new p5((p) => {
  let editor;
  let exportButton;
  let isExporting = false;
  let progress = 0;
  let logMessages = [];

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    editor = new VideoEditor(p, {
      canvas: canvas.elt,
    });

    editor
      .createShapeClip('rect', {
        start: 0,
        duration: 4000,
        properties: {
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          fill: 'red',
        },
      })
      .addKeyframe('x', 0, 50)
      .addKeyframe('x', 4000, 490);

    editor
      .createTextClip('Ekspor MP4!', {
        start: 1000,
        duration: 3000,
        properties: {
          y: 250,
          fontSize: 48,
          fill: 'white',
        },
      })
      .addKeyframe('x', 1000, -300)
      .addKeyframe('x', 4000, 640);

    editor.timeline.duration = 4000;

    exportButton = p.createButton('Ekspor ke MP4');
    exportButton.position(10, 10);
    exportButton.mousePressed(startExport);
  };

  p.draw = async () => {
    p.background(220);
    editor.update(p);
    await editor.render();

    if (isExporting) {
      p.fill(0, 150);
      p.rect(0, 0, p.width, p.height);

      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.text('Mengekspor MP4, harap tunggu...', p.width / 2, p.height / 2 - 40);

      p.rectMode(p.CORNER);
      p.fill(100);
      p.rect(p.width / 2 - 150, p.height / 2, 300, 20);
      p.fill(0, 255, 0);
      p.rect(p.width / 2 - 150, p.height / 2, 300 * (progress / 100), 20);

      p.textSize(12);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.text(logMessages.slice(-5).join('\n'), 10, p.height - 10);
    }
  };

  function startExport() {
    if (isExporting) return;
    isExporting = true;
    progress = 0;
    logMessages = ['Memulai ekspor...'];
    exportButton.attribute('disabled', true);

    editor
      .exportMP4({
        frameRate: 30,
        filename: 'animasi-keren.mp4',
        onProgress: (prog) => {
          progress = prog;
        },
        onLog: (message) => {
          console.log(message);
          logMessages.push(message);
        },
      })
      .then(() => {
        console.log('Ekspor selesai!');
        logMessages.push('Ekspor Selesai!');
      })
      .catch((err) => {
        console.error('Ekspor gagal:', err);
        logMessages.push('ERROR: ' + err.message);
      })
      .finally(() => {
        isExporting = false;
        exportButton.removeAttribute('disabled');
      });
  }
});