import { VideoEditor } from '../src/p5.videoeditor.js';

const sketch = (p) => {
  let editor;
  let slideshow;

  p.setup = () => {
    const canvas = p.createCanvas(800, 450);

    editor = new VideoEditor(p, { canvas: canvas.elt });

    // Create a slideshow that is active for 60 seconds on the timeline
    slideshow = editor.createSlideShowClip({
      duration: 60000,
      properties: { x: p.width / 2, y: p.height / 2 - 20 }, // Center the slideshow
    });

    // --- Slide 1 ---
    const slide1Title = editor.createTextClip('Welcome to the Presentation!', {
      duration: 99999, // Lives as long as the slide is active
      properties: { fontSize: 48, fill: '#a2d2ff' },
    });
    const slide1Subtitle = editor.createTextClip('This is the first slide.', {
      duration: 99999,
      properties: { y: 50, fontSize: 24, fill: '#bde0fe' },
    });
    slideshow.addSlide([slide1Title, slide1Subtitle]);

    // --- Slide 2 ---
    const slide2Bg = editor.createShapeClip('rect', {
      duration: 99999,
      properties: { width: 500, height: 250, fill: '#ffafcc' },
    });
    // Animate the shape within the slide. The animation will restart each time the slide is shown.
    slide2Bg.addKeyframe('rotation', 0, 0).addKeyframe('rotation', 3000, p.PI * 0.1);
    const slide2Text = editor.createTextClip('Slides can contain animated elements.', {
      duration: 99999,
      properties: { fill: '#222' },
    });
    slideshow.addSlide([slide2Bg, slide2Text]);

    // --- Slide 3 ---
    const slide3Text = editor.createTextClip('This is the final slide.', {
      duration: 99999,
      properties: { fontSize: 48, fill: '#cdb4db' },
    });
    slideshow.addSlide([slide3Text]);

    editor.play();
  };

  p.draw = () => {
    p.background(20, 22, 28);
    editor.update(p);
    editor.render();

    // Add instructions text
    p.fill(150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text('Press LEFT or RIGHT arrow keys to navigate slides', p.width / 2, p.height - 30);
  };

  p.keyPressed = () => {
    if (p.keyCode === p.RIGHT_ARROW) {
      slideshow.next();
    } else if (p.keyCode === p.LEFT_ARROW) {
      slideshow.previous();
    }
  };
};

new p5(sketch);
