import ClipBase from '../../src/clips/ClipBase.js';
import Easing from '../../src/utils/Easing.js';

describe('ClipBase', () => {
  let clip;
  let mockP5;

  beforeEach(() => {
    // Mock the p5 instance
    mockP5 = {
      lerp: (start, end, t) => start * (1 - t) + end * t,
    };
    // Initialize ClipBase with some custom initial properties
    clip = new ClipBase({ properties: { x: 100, y: 50, scale: 1 } });
  });

  test('should hold initial property values', () => {
    expect(clip.properties.x).toBe(100);
    expect(clip.properties.y).toBe(50);
  });

  test('should add a keyframe correctly', () => {
    clip.addKeyframe('x', 1000, 200);
    expect(clip.keyframes.x.length).toBe(1);
    expect(clip.keyframes.x[0].value).toBe(200);
  });

  test('should not update property if no keyframes exist', () => {
    clip.update(mockP5, 500);
    expect(clip.properties.x).toBe(100);
  });

  test('should use first keyframe value if time is before it', () => {
    clip.addKeyframe('x', 1000, 200);
    clip.update(mockP5, 500);
    expect(clip.properties.x).toBe(200);
  });

  test('should use last keyframe value if time is after it', () => {
    clip.addKeyframe('x', 1000, 200);
    clip.addKeyframe('x', 2000, 300);
    clip.update(mockP5, 2500);
    expect(clip.properties.x).toBe(300);
  });

  test('should interpolate linearly between two keyframes', () => {
    clip.addKeyframe('x', 1000, 200);
    clip.addKeyframe('x', 2000, 300);
    clip.update(mockP5, 1500); // Halfway in time
    expect(clip.properties.x).toBe(250);
  });

  test('should use easing function for interpolation', () => {
    clip.addKeyframe('scale', 0, 1, 'easeOutQuad');
    clip.addKeyframe('scale', 1000, 2);

    // For t=0.5, easeOutQuad is 0.75. lerp(1, 2, 0.75) = 1.75
    clip.update(mockP5, 500);
    expect(clip.properties.scale).toBe(1.75);
  });
});
