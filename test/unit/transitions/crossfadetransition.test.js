import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import CrossFadeTransition from '../../../src/transitions/CrossFadeTransition.js';

describe('CrossFadeTransition', () => {
  let fromClip, toClip, transition, mockP5;
  let fromClipRenderedOpacity, toClipRenderedOpacity;

  beforeEach(() => {
    // Reset sentinel values
    fromClipRenderedOpacity = -1;
    toClipRenderedOpacity = -1;

    // Create mock clips that capture their opacity when rendered
    fromClip = {
      start: 0,
      properties: { opacity: 1.0 },
      effects: [], // Add effects array to mock
      render: jest.fn(() => {
        fromClipRenderedOpacity = fromClip.properties.opacity;
      }),
    };
    toClip = {
      start: 1000,
      properties: { opacity: 1.0 },
      effects: [], // Add effects array to mock
      render: jest.fn(() => {
        toClipRenderedOpacity = toClip.properties.opacity;
      }),
    };

    mockP5 = {};

    transition = new CrossFadeTransition({
      fromClip: fromClip,
      toClip: toClip,
      duration: 1000,
    });
  });

  test('should set opacities correctly at the start of the transition (progress 0%)', () => {
    jest.spyOn(transition, 'getProgress').mockReturnValue(0);
    transition.render(mockP5, 1000);

    // fromClip is rendered with full opacity, toClip is rendered with zero opacity
    expect(fromClipRenderedOpacity).toBeCloseTo(1.0);
    expect(toClipRenderedOpacity).toBeCloseTo(0.0);
  });

  test('should set opacities correctly at the midpoint of the transition (progress 50%)', () => {
    jest.spyOn(transition, 'getProgress').mockReturnValue(0.5);
    transition.render(mockP5, 1500);

    // Both clips are rendered at half opacity
    expect(fromClipRenderedOpacity).toBeCloseTo(0.5);
    expect(toClipRenderedOpacity).toBeCloseTo(0.5);
  });

  test('should set opacities correctly at the end of the transition (progress 100%)', () => {
    jest.spyOn(transition, 'getProgress').mockReturnValue(1.0);
    transition.render(mockP5, 2000);

    // fromClip is rendered with zero opacity, toClip is rendered with full opacity
    expect(fromClipRenderedOpacity).toBeCloseTo(0.0);
    expect(toClipRenderedOpacity).toBeCloseTo(1.0);
  });

  test('should be non-destructive and restore original opacities after render', () => {
    // Set non-default starting opacities
    fromClip.properties.opacity = 0.8;
    toClip.properties.opacity = 0.7;

    jest.spyOn(transition, 'getProgress').mockReturnValue(0.5);

    // This call should temporarily change opacities but restore them in the `finally` block
    transition.render(mockP5, 1500);

    // Verify that the properties are back to their original values after the call
    expect(fromClip.properties.opacity).toBe(0.8);
    expect(toClip.properties.opacity).toBe(0.7);
  });

  test('should call the render method on both clips during transition', () => {
    jest.spyOn(transition, 'getProgress').mockReturnValue(0.5);
    transition.render(mockP5, 1500);

    expect(fromClip.render).toHaveBeenCalledTimes(1);
    expect(toClip.render).toHaveBeenCalledTimes(1);
  });
});
