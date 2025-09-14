// This script runs in a Web Worker, handling the heavy video encoding process.
import { FFmpeg } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/ffmpeg.js';
import { fetchFile } from 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js';

let ffmpeg = null;

/**
 * Loads the FFmpeg instance. This is a time-consuming process and should only be done once.
 */
const load = async () => {
  if (ffmpeg && ffmpeg.loaded) {
    return;
  }
  ffmpeg = new FFmpeg();

  // Listen for log messages from FFmpeg and forward them to the main thread.
  ffmpeg.on('log', ({ message }) => {
    self.postMessage({ type: 'log', data: message });
  });

  // Listen for progress updates and forward them to the main thread.
  ffmpeg.on('progress', ({ progress }) => {
    self.postMessage({ type: 'progress', data: Math.round(progress * 100) });
  });

  // Load the core FFmpeg files from a CDN.
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: `${baseURL}/ffmpeg-core.js`,
    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
  });
  self.postMessage({ type: 'log', data: 'FFmpeg core loaded.' });
};

/**
 * Handles incoming messages from the main thread.
 * The message should contain an array of frames as Data URLs.
 */
self.onmessage = async ({ data: { frames, frameRate } }) => {
  try {
    self.postMessage({
      type: 'log',
      data: 'Worker received job. Loading FFmpeg...',
    });
    await load();

    self.postMessage({
      type: 'log',
      data: 'Writing frames to virtual file system...',
    });
    // Write each frame to FFmpeg's virtual file system.
    for (let i = 0; i < frames.length; i++) {
      const frameNumber = String(i).padStart(4, '0');
      const fileName = `frame-${frameNumber}.webp`;
      const frameData = await fetchFile(frames[i]);
      await ffmpeg.writeFile(fileName, frameData);
    }

    self.postMessage({ type: 'log', data: 'Starting video encoding...' });
    // Run the FFmpeg command to create the video.
    await ffmpeg.exec([
      '-framerate',
      String(frameRate),
      '-i',
      'frame-%04d.webp',
      '-c:v',
      'libx264', // A widely compatible video codec
      '-pix_fmt',
      'yuv420p', // Ensures compatibility across most players
      '-preset',
      'ultrafast', // Prioritize speed over quality for a better UX
      'output.mp4',
    ]);

    self.postMessage({
      type: 'log',
      data: 'Encoding complete. Reading output file...',
    });
    // Read the resulting video file.
    const resultData = await ffmpeg.readFile('output.mp4');

    // Send the final video data back to the main thread.
    self.postMessage({ type: 'done', data: resultData }, [resultData.buffer]);
  } catch (error) {
    self.postMessage({ type: 'error', data: error.message });
  }
};
