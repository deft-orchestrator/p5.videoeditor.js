# p5.videoeditor.js

**p5.videoeditor.js** is a lightweight timeline and motion graphics library for the [p5.js](https://p5js.org/) creative coding environment. It allows you to create programmatic, keyframe-based animations with a simple and intuitive API.

This library provides a timeline, clip management for shapes, text, images, and video, and a keyframe animation system.

> For the long-term project goals, feature roadmap, and future API design, please see the [**Project Vision & Roadmap**](./VISION.md).

---

## 🚀 Getting Started: Your First Animation

The easiest way to start is with a simple HTML file. Create an `index.html` file, download `p5.videoeditor.min.js` from the [dist/](dist/) folder, and place it in the same directory.

Then, copy and paste the code below into your `index.html` file and open it in your browser.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>p5.videoeditor.js - Getting Started</title>
    <!-- 1. Include p5.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
    <!-- 2. Include p5.videoeditor.js -->
    <script src="p5.videoeditor.min.js"></script>
    <style>
      body {
        margin: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #1a1a1a;
      }
    </style>
  </head>
  <body>
    <script>
      // sketch.js
      let editor;

      function setup() {
        const canvas = createCanvas(640, 360);

        // 3. Create the main editor instance
        //    The 'p5' instance is automatically detected in the global scope.
        editor = new p5.VideoEditor({
          duration: 5000, // 5-second timeline
          canvas: canvas.elt,
        });

        // 4. Create a text clip and add it to the timeline
        editor
          .createTextClip('Hello, World!', {
            start: 500, // Start at 0.5 seconds
            duration: 4000, // Last for 4 seconds
            properties: {
              x: width / 2,
              y: height / 2,
              fontSize: 48,
              fill: '#f1faee',
              textAlign: 'center',
              textBaseline: 'middle',
            },
          })
          // Add some animations to the text clip
          .addKeyframe('scale', 0, 0) // At clip time 0ms, scale is 0
          .addKeyframe('scale', 500, 1.2) // At 500ms, scale is 1.2
          .addKeyframe('scale', 800, 1.0); // At 800ms, scale is 1.0

        // 5. Start playback
        editor.play();
      }

      function draw() {
        background(50);

        // 6. IMPORTANT: Update and render the editor on each frame
        editor.update();
        editor.render();
      }
    </script>
  </body>
</html>
```

This example creates a simple animation of the text "Hello, World!" fading in and scaling up.

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

## Advanced Usage: ES Module Import

For more complex projects or when using a bundler like Vite or Webpack, you can import the library as an ES module.

```javascript
// main.js
import { VideoEditor } from 'p5.videoeditor.js';

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
