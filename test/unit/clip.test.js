import { jest } from '@jest/globals';
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
    clip = new ClipBase({ properties: { x: 100, y: 50, scale: 1, color: '#ff0000' } });
  });

  test('should interpolate colors using lerpColor', () => {
    // A simple class mock to make `instanceof` work
    class MockP5Color {
      constructor(val) { this.value = val; }
    }

    const red = new MockP5Color('red');
    const blue = new MockP5Color('blue');

    mockP5.Color = MockP5Color;
    mockP5.lerpColor = jest.fn().mockReturnValue('purple'); // Mock return value

    clip.properties.color = red; // Set initial property
    clip.addKeyframe('color', 1000, red);
    clip.addKeyframe('color', 2000, blue);

    // Manually trigger the update with the mocked p5 instance
    clip.update(mockP5, 1500);

    // Verify that lerpColor was called with the correct arguments
    expect(mockP5.lerpColor).toHaveBeenCalledWith(red, blue, 0.5);
    // Verify that the property was updated with the result of lerpColor
    expect(clip.properties.color).toBe('purple');
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

  describe('_calculateValue', () => {
    beforeEach(() => {
      // Reset keyframes for each test
      clip.keyframes = {};
      // Add some keyframes for 'x' property for the tests
      clip.addKeyframe('x', 1000, 200); // from t=1000, value=200
      clip.addKeyframe('x', 2000, 300); // to t=2000, value=300
    });

    test('should return the first keyframe value when time is before the first keyframe', () => {
      const value = clip._calculateValue(mockP5, 'x', 500);
      expect(value).toBe(200);
    });

    test('should return the last keyframe value when time is after the last keyframe', () => {
      const value = clip._calculateValue(mockP5, 'x', 2500);
      expect(value).toBe(300);
    });

    test('should return the exact keyframe value when time matches a keyframe', () => {
      const value = clip._calculateValue(mockP5, 'x', 1000);
      expect(value).toBe(200);
    });

    test('should interpolate linearly between two keyframes', () => {
      const value = clip._calculateValue(mockP5, 'x', 1500); // Halfway
      expect(value).toBe(250);
    });

    test('should apply easing function correctly during interpolation', () => {
      // Add keyframes with an easing function
      clip.addKeyframe('y', 0, 10, 'easeOutQuad');
      clip.addKeyframe('y', 1000, 20);

      // t = (500 - 0) / (1000 - 0) = 0.5
      // easeOutQuad(0.5) = 0.5 * (2 - 0.5) = 0.75
      // lerp(10, 20, 0.75) = 10 * (1 - 0.75) + 20 * 0.75 = 2.5 + 15 = 17.5
      const value = clip._calculateValue(mockP5, 'y', 500);
      expect(value).toBe(17.5);
    });

    test('should return initial property value if no keyframes exist for the property', () => {
        // 'scale' has no keyframes, so it should return its initial value
        const value = clip._calculateValue(mockP5, 'scale', 1500);
        expect(value).toBe(1); // Initial value of scale is 1
    });
  });
});
