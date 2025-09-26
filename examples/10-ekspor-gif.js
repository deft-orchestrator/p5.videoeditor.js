import { VideoEditor } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;

  p.setup = () => {
    const canvas = p.createCanvas(640, 360);
    const controlsContainer = document.getElementById('controls');
    const canvasContainer = document.getElementById('canvas-container');
    canvas.parent(canvasContainer);

    // 1. Create the editor instance
    editor = new VideoEditor(p, {
      duration: 4000, // 4-second timeline
      canvas: canvas.elt,
      // The worker script is automatically copied to the 'dist' folder during build.
      // In this example, we assume it's served relative to the HTML file.
      gifWorkerPath: '../dist/gif.worker.js',
    });

    // 2. Create a simple animation
    editor
      .createShapeClip('rect', {
        duration: 4000,
        properties: {
          x: p.width / 2,
          y: p.height / 2,
          width: 100,
          height: 100,
          fill: '#e63946',
          rectMode: 'center',
        },
      })
      .addKeyframe('rotation', 0, 0)
      .addKeyframe('rotation', 2000, p.PI)
      .addKeyframe('rotation', 4000, p.PI * 2)
      .addKeyframe('scale', 0, 1)
      .addKeyframe('scale', 1000, 1.5)
      .addKeyframe('scale', 2000, 1)
      .addKeyframe('scale', 3000, 1.5)
      .addKeyframe('scale', 4000, 1);

    // 3. Create the export button and progress bar
    controlsContainer.innerHTML = `
      <div style="padding: 10px; display: flex; align-items: center; gap: 10px;">
        <button id="export-btn">Export to GIF</button>
        <progress id="export-progress" value="0" max="100" style="width: 200px;"></progress>
        <span id="progress-label"></span>
      </div>
    `;

    const exportBtn = document.getElementById('export-btn');
    const progressBar = document.getElementById('export-progress');
    const progressLabel = document.getElementById('progress-label');

    exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      progressLabel.textContent = 'Exporting...';
      progressBar.value = 0;

      await editor.exportGIF({
        frameRate: 20,
        quality: 10,
        filename: 'p5-videoeditor-gif-export.gif',
        onProgress: (progress) => {
          progressBar.value = progress * 100;
        },
      });

      progressLabel.textContent = 'Done!';
      exportBtn.disabled = false;
    });

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
