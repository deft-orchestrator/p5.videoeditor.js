// 02_image_and_shapes.js
// This example demonstrates how to animate shapes and images.

let timeline;
let myImage;

// Preload your assets
function preload() {
  // NOTE: You would replace this with your own image file.
  // For this example, we'll create a dummy p5.Graphics object.
  myImage = createGraphics(100, 100);
  myImage.background(255, 0, 255); // A magenta square
  myImage.fill(255);
  myImage.textSize(12);
  myImage.textAlign(CENTER, CENTER);
  myImage.text("Image", 50, 50);
}

function setup() {
  createCanvas(1280, 720);

  timeline = new Timeline();

  // Create a red rectangle that scales up
  const redRect = new ShapeClip('rect', 0, 3, {
    w: 100,
    h: 100,
    color: 'red',
    x: width / 4,
    y: height / 2
  });
  redRect.addKeyframe(0, { scale: 0 });
  redRect.addKeyframe(1, { scale: 1.2 }, Easing.easeOutBack);
  redRect.addKeyframe(2, { scale: 1 });
  redRect.addKeyframe(3, { scale: 0 }, Easing.easeInBack);

  // Create a blue circle that moves
  const blueCircle = new ShapeClip('ellipse', 1, 4, {
    w: 80,
    h: 80,
    color: 'blue',
    y: height / 2
  });
  blueCircle.addKeyframe(0, { x: -100 });
  blueCircle.addKeyframe(1, { x: width * 0.75 }, Easing.easeInOutCubic);
  blueCircle.addKeyframe(3, { x: width * 0.75 });
  blueCircle.addKeyframe(4, { x: width + 100 }, Easing.easeInOutCubic);

  // Create an image clip that fades in and out
  const imageClip = new ImageClip(myImage, 0.5, 5, {
    x: width / 2,
    y: height / 2,
  });

  // Use pre-made effects for fading
  imageClip.addEffect(new FadeInEffect(1.0));
  imageClip.addEffect(new FadeOutEffect(1.0));

  // Set the rectangle as a parent of the image.
  // The image will now move and scale relative to the rectangle.
  imageClip.setParent(redRect);

  timeline.add(redRect);
  timeline.add(blueCircle);
  timeline.add(imageClip);

  timeline.setDebug(true);
}

function draw() {
  background(20, 40, 60);
  timeline.update();
}
