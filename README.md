# p5.videoeditor.js

**p5.videoeditor.js** is a lightweight timeline and motion graphics library for the [p5.js](https://p5js.org/) creative coding environment. It allows you to create programmatic, keyframe-based animations with a simple and intuitive API.

This library provides a timeline, clip management for shapes, text, images, and video, and a keyframe animation system.

> For the long-term project goals, feature roadmap, and future API design, please see the [**Project Vision & Roadmap**](./VISION.md).

---

## Installation

You can use this library by including the bundled file in your HTML, or by installing it via npm.

#### Browser

Download the latest release from the `dist/` folder and include it in your HTML file:

```html
<script src="https://path/to/p5.js"></script>
<script src="path/to/dist/p5.videoeditor.min.js"></script>
```

#### npm

```bash
npm install p5.videoeditor.js
```

```javascript
import { VideoEditor } from 'p5.videoeditor.js';
```

---

## Basic Usage

Here is a simple example of how to create a timeline and animate a text clip.

```javascript
// main.js
import { VideoEditor } from './src/p5.videoeditor.js';

let editor;

const sketch = (p) => {
  p.setup = () => {
    const canvas = p.createCanvas(640, 360);

    // 1. Create the main editor instance
    editor = new VideoEditor(p, {
      duration: 5000, // 5-second timeline
      canvas: canvas.elt,
    });

    // 2. Create clips and add them to the timeline using factory methods
    editor
      .createTextClip('Hello, p5.js!', {
        start: 500,
        duration: 4000,
        properties: {
          x: p.width / 2,
          y: p.height / 2,
          fontSize: 48,
          fill: '#f1faee',
        },
      })
      .addKeyframe('scale', 0, 0)
      .addKeyframe('scale', 500, 1.2)
      .addKeyframe('scale', 800, 1.0)
      .addKeyframe('rotation', 2000, 0)
      .addKeyframe('rotation', 3000, 0.1)
      .addKeyframe('rotation', 4000, -0.1);

    // 3. Start playback
    editor.play();
  };

  p.draw = () => {
    p.background(50);

    // 4. IMPORTANT: Update and render the editor on each frame
    editor.update(p);
    editor.render(); // The p5 instance is no longer needed here
  };
};

new p5(sketch);
```

---

## Examples

For more detailed examples covering different clip types, effects, and transitions, please see the `examples/` directory.

## Contributing

Contributions are welcome! Please see the [Contributing Guidelines](./CONTRIBUTING.md) for more information on how to get started.
