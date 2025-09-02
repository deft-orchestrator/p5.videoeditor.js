// 03_audio_reactive_effect.js
// This example shows how to make a shape react to the volume of an audio clip.
// NOTE: This example requires the p5.sound library to be included in your project.

let timeline;
let mySound;

// Preload your audio file
function preload() {
  // NOTE: You would replace 'path/to/your/sound.mp3' with a real audio file.
  // We'll create a dummy sound file object for this example to run without errors.
  // In a real project, you would use: mySound = loadSound('path/to/your/sound.mp3');
  mySound = {
    duration: () => 10,
    jump: () => {},
    stop: () => {},
    // Mock p5.sound's analyzer functionality
    amplitude: {
      setInput: () => {},
      getLevel: () => {
        // Simulate a beat
        return (sin(timeline.currentTime * PI * 2) + 1) / 2 * 0.5 + 0.1;
      }
    }
  };
  // In a real scenario with p5.sound, the AudioClip class handles the analyzer internally.
  // The 'amplitude' mock above is just to prevent errors in this standalone example.
}

function setup() {
  createCanvas(1280, 720);

  timeline = new Timeline();

  // Create an AudioClip. It will automatically use the duration of the sound file.
  const audioClip = new AudioClip(mySound, 0);

  // Create a shape that will react to the audio
  const reactiveCircle = new ShapeClip('ellipse', 0, audioClip.duration, {
    x: width / 2,
    y: height / 2,
    w: 200,
    h: 200,
    color: 'cyan'
  });

  // Create an AudioReactiveEffect.
  // It links an audio clip to a property of another clip.
  // Here, the 'scale' of the circle will change based on the audio's volume.
  const audioEffect = new AudioReactiveEffect(audioClip, 'scale', 2.0);

  // Add the effect to the circle
  reactiveCircle.addEffect(audioEffect);

  // Add the clips to the timeline
  timeline.add(audioClip);
  timeline.add(reactiveCircle);

  timeline.setDebug(true);
}

function draw() {
  background(50);
  timeline.update();
}
