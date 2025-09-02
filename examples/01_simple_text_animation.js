// 01_simple_text_animation.js
// This example demonstrates how to create a simple text animation.

let timeline;

function setup() {
  createCanvas(1280, 720);

  // Create a new timeline
  timeline = new Timeline();

  // Create a text clip
  const myText = new TextClip("Hello, World!", 0, 5, {
    size: 96,
    color: 'white',
    align: CENTER,
  });

  // Add a keyframe to move the text
  myText.addKeyframe(0, { x: width / 2, y: -100 });
  myText.addKeyframe(1, { x: width / 2, y: height / 2 }, Easing.easeOutBounce);
  myText.addKeyframe(4, { x: width / 2, y: height / 2 });
  myText.addKeyframe(5, { x: width / 2, y: height + 100 }, Easing.easeInBack);

  // Add a typewriter effect to the text
  myText.addEffect(new TypewriterEffect(10));

  // Add the clip to the timeline
  timeline.add(myText);

  // Enable debug mode to see the timeline
  timeline.setDebug(true);
}

function draw() {
  background(0);

  // Update and render the timeline
  timeline.update();
}
