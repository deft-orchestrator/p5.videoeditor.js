// P5.VideoEditor.JS Comprehensive Test Suite

let timeline;
let testImage;
let testSound;

function preload() {
  // 1. Test Asset Loading (using mock objects to avoid external dependencies)
  console.log("Testing feature: Asset Preloading (Mocks)");

  // Mock for ImageClip
  testImage = createGraphics(200, 200);
  testImage.background(100, 200, 100);
  testImage.fill(255);
  testImage.textSize(24);
  testImage.textAlign(CENTER, CENTER);
  testImage.text("Test Image", 100, 100);

  // Mock for AudioClip (requires p5.sound)
  testSound = {
    duration: () => 8,
    jump: () => console.log("Mock sound jump"),
    stop: () => console.log("Mock sound stop"),
    amplitude: {
      setInput: () => {},
      getLevel: () => {
        // Simulate a pulsing beat for visual feedback
        return (sin(millis() / 1000 * PI * 2) + 1) / 2 * 0.4 + 0.1;
      }
    }
  };
  console.log("Asset Preloading (Mocks) test setup complete.");
}

function setup() {
  createCanvas(1920, 1080);
  console.log("Canvas created.");

  // 2. Test Timeline Initialization and Debug Mode
  console.log("Testing feature: Timeline Initialization and Debug Mode");
  timeline = new Timeline();
  timeline.setDebug(true);
  console.log("Timeline created and debug mode enabled.");

  // 3. Test ShapeClip and Keyframing with Easing
  console.log("Testing feature: ShapeClip, Keyframing, Easing");
  const movingRect = new ShapeClip('rect', 0, 5, {
    x: width * 0.25,
    y: height / 2,
    w: 150,
    h: 150,
    color: 'crimson'
  });
  movingRect.addKeyframe(0, { scale: 0, rotation: -PI });
  movingRect.addKeyframe(1.5, { scale: 1.2, rotation: 0 }, Easing.easeOutElastic);
  movingRect.addKeyframe(3.5, { scale: 1.2, rotation: 0 });
  movingRect.addKeyframe(5, { scale: 0, rotation: PI }, Easing.easeInQuad);
  timeline.add(movingRect);
  console.log("ShapeClip test setup complete.");

  // 4. Test TextClip and TypewriterEffect
  console.log("Testing feature: TextClip, TypewriterEffect");
  const animatedText = new TextClip("P5.VideoEditor.JS Test", 1, 6, {
    size: 72,
    color: 'white',
    align: CENTER,
  });
  animatedText.addKeyframe(1, { x: width / 2, y: -100 });
  animatedText.addKeyframe(2, { x: width / 2, y: height * 0.25 }, Easing.easeOutBounce);
  animatedText.addKeyframe(5, { x: width / 2, y: height * 0.25 });
  animatedText.addKeyframe(6, { x: width / 2, y: height + 100 }, Easing.easeInBack);
  animatedText.addEffect(new TypewriterEffect(15));
  timeline.add(animatedText);
  console.log("TextClip test setup complete.");

  // 5. Test ImageClip, Parenting, and Fade Effects
  console.log("Testing feature: ImageClip, Parenting, FadeIn/Out Effects");
  const fadingImage = new ImageClip(testImage, 0.5, 4.5, {
    x: 0, // Relative to parent
    y: -200, // Relative to parent
    w: 150,
    h: 150,
  });
  fadingImage.addEffect(new FadeInEffect(0.8));
  fadingImage.addEffect(new FadeOutEffect(0.8));
  fadingImage.setParent(movingRect); // Parenting test
  timeline.add(fadingImage);
  console.log("ImageClip and Parenting test setup complete.");

  // 6. Test AudioClip and AudioReactiveEffect
  console.log("Testing feature: AudioClip, AudioReactiveEffect");
  const audioClip = new AudioClip(testSound, 0);
  const reactiveCircle = new ShapeClip('ellipse', 0, audioClip.duration, {
    x: width * 0.75,
    y: height / 2,
    w: 200,
    h: 200,
    color: 'deepskyblue'
  });
  const audioEffect = new AudioReactiveEffect(audioClip, 'scale', 1.5); // Scale multiplier
  reactiveCircle.addEffect(audioEffect);
  timeline.add(audioClip);
  timeline.add(reactiveCircle);
  console.log("Audio features test setup complete.");

  console.log("All feature test setups are complete. Starting draw loop.");
}

function draw() {
  background(20, 30, 40);
  timeline.update();
}
