import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import Timeline from '../../src/core/Timeline.js';
import TextClip from '../../src/clips/TextClip.js';
import ShapeClip from '../../src/clips/ShapeClip.js';

describe('Integration Test: Full Scene Animation', () => {
  let timeline;
  let mockP5;
  let mockCanvas;

  beforeEach(() => {
    // Mock the p5 instance with a basic lerp for calculations
    mockP5 = {
      lerp: (start, end, t) => start * (1 - t) + end * t,
      // Mock createGraphics as it's called by the Timeline constructor
      createGraphics: jest.fn(() => ({
        clear: jest.fn(),
        push: jest.fn(),
        pop: jest.fn(),
        shader: jest.fn(),
        rect: jest.fn(),
      })),
    };
    mockCanvas = { width: 800, height: 600 };
    timeline = new Timeline(mockP5, mockCanvas, { duration: 10000 }); // 10s timeline
  });

  test('should correctly calculate interpolated properties for multiple clips at a specific time', () => {
    // Create a shape clip that scales up over 2 seconds
    const shape = new ShapeClip('rect', {
      start: 0,
      duration: 10000,
      properties: { scale: 0.5, x: 100 },
    });
    shape.addKeyframe('scale', 0, 0.5).addKeyframe('scale', 2000, 1.5);
    shape.addKeyframe('x', 0, 100).addKeyframe('x', 5000, 600);
    timeline.addClip(shape);

    // Create a text clip that fades in over the first second
    const text = new TextClip('Hello', {
      start: 500,
      duration: 5000,
      properties: { opacity: 0, y: 300 },
    });
    text.addKeyframe('opacity', 0, 0).addKeyframe('opacity', 1000, 1);
    timeline.addClip(text);

    // --- Verification ---
    // Seek the timeline to 1000ms (1 second)
    timeline.time = 1000;
    // Run the update loop to calculate all keyframed values
    timeline.update(mockP5);

    // At 1000ms (1s), the shape's scale should be halfway between 0.5 and 1.5, which is 1.0
    expect(shape.properties.scale).toBe(1.0);

    // At 1000ms (1s), the shape's x should be 1/5th of the way between 100 and 600
    // (1000ms / 5000ms = 0.2). lerp(100, 600, 0.2) = 100 + 0.2 * 500 = 200
    expect(shape.properties.x).toBe(200);

    // At 1000ms on the main timeline, this is 500ms into the text clip's own timeline.
    // The opacity keyframes are at 0ms and 1000ms (relative to the clip).
    // So at 500ms relative time, opacity should be halfway between 0 and 1, which is 0.5.
    expect(text.properties.opacity).toBe(0.5);
  });
});
