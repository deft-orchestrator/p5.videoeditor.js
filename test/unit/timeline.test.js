import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import Timeline from '../../src/core/Timeline.js';
import ClipBase from '../../src/clips/ClipBase.js';
import ErrorHandler from '../../src/utils/ErrorHandler.js';

describe('Timeline', () => {
  let timeline;
  let mockP5;
  let mockCanvas;

  beforeEach(() => {
    mockP5 = {
      deltaTime: 16, // approx 60fps
      lerp: (start, end, t) => start * (1 - t) + end * t,
      createGraphics: jest.fn(() => ({})), // Mock createGraphics
    };
    mockCanvas = { width: 100, height: 100, toDataURL: () => '' }; // Mock canvas
    timeline = new Timeline(mockP5, mockCanvas, { duration: 5000 });
  });

  test('should be instantiated correctly', () => {
    expect(timeline).toBeInstanceOf(Timeline);
    expect(timeline.time).toBe(0);
    expect(timeline.duration).toBe(5000);
    expect(timeline.isPlaying).toBe(false);
    expect(timeline.clips).toEqual([]);
  });

  test('should add a clip', () => {
    const clip = new ClipBase();
    timeline.addClip(clip);
    expect(timeline.clips.length).toBe(1);
    expect(timeline.clips[0]).toBe(clip);
  });

  test('should sort clips by layer when adding', () => {
    const clip1 = new ClipBase({ layer: 1 });
    const clip2 = new ClipBase({ layer: 0 });
    const clip3 = new ClipBase({ layer: 2 });

    timeline.addClip(clip1);
    timeline.addClip(clip2);
    timeline.addClip(clip3);

    expect(timeline.clips.length).toBe(3);
    expect(timeline.clips[0].layer).toBe(0);
    expect(timeline.clips[1].layer).toBe(1);
    expect(timeline.clips[2].layer).toBe(2);
  });

  test('should update time when playing', () => {
    timeline.isPlaying = true;
    timeline.update(mockP5);
    expect(timeline.time).toBe(16);
    timeline.update(mockP5);
    expect(timeline.time).toBe(32);
  });

  test('should not update time when paused', () => {
    timeline.isPlaying = false;
    timeline.update(mockP5);
    expect(timeline.time).toBe(0);
  });

  test('should loop frame-accurately when time exceeds duration', () => {
    timeline.isPlaying = true;
    timeline.time = 4990;
    timeline.update(mockP5); // time becomes 5006
    expect(timeline.time).toBe(6); // 5006 % 5000 = 6
  });
});

describe('Timeline Update Logic', () => {
  let timeline;
  let mockP5;
  let mockCanvas;
  let clip1, clip2;

  beforeEach(() => {
    mockP5 = { deltaTime: 16, createGraphics: jest.fn(() => ({})) };
    mockCanvas = { width: 100, height: 100, toDataURL: () => '' };
    timeline = new Timeline(mockP5, mockCanvas, { duration: 5000 });

    clip1 = new ClipBase({ start: 0, duration: 1000 }); // Active from 0-1000
    clip2 = new ClipBase({ start: 900, duration: 1000 }); // Active from 900-1900

    // Mock the update method to track calls
    clip1.update = jest.fn();
    clip2.update = jest.fn();

    timeline.addClip(clip1);
    timeline.addClip(clip2);
  });

  test('should update clips that are part of an active transition', () => {
    // Transition from clip1 to clip2, from time 950 to 1050
    const mockTransition = {
      fromClip: clip1,
      toClip: clip2,
      start: 950,
      duration: 100,
    };
    timeline.transitions.push(mockTransition);

    // At time 1010, clip1 is technically no longer active (start:0, duration:1000)
    // But it should still be updated because it's part of the active transition.
    timeline.time = 1010;
    timeline.update(mockP5);

    // Both clips should have their update methods called
    expect(clip1.update).toHaveBeenCalledTimes(1);
    expect(clip2.update).toHaveBeenCalledTimes(1);
  });
});

describe('Timeline Batch Operations', () => {
  let timeline;
  let clip;
  let mockP5;
  let mockCanvas;

  beforeEach(() => {
    mockP5 = { deltaTime: 16, createGraphics: jest.fn(() => ({})) };
    mockCanvas = { width: 100, height: 100, toDataURL: () => '' };
    timeline = new Timeline(mockP5, mockCanvas);
    clip = new ClipBase({ properties: { x: 0 } });
    timeline.addClip(clip);
  });

  test('should defer keyframe sorting until batch is finalized', () => {
    timeline.batch(() => {
      // Add keyframes out of order
      clip.addKeyframe('x', 2000, 200);
      clip.addKeyframe('x', 1000, 100);

      // Immediately after adding, they should be in insertion order, not time order
      expect(clip.keyframes.x[0].time).toBe(2000);
      expect(clip.keyframes.x[1].time).toBe(1000);
    });

    // After batch is finalized, they should be sorted by time
    expect(clip.keyframes.x[0].time).toBe(1000);
    expect(clip.keyframes.x[1].time).toBe(2000);
  });

  test('should defer clip layer sorting until batch is finalized', () => {
    timeline.batch(() => {
      const clip1 = new ClipBase({ layer: 2 });
      const clip2 = new ClipBase({ layer: 1 });
      timeline.addClip(clip1);
      timeline.addClip(clip2);

      // Clips are added in order, not sorted by layer yet
      // Existing clip is at index 0
      expect(timeline.clips[1].layer).toBe(2);
      expect(timeline.clips[2].layer).toBe(1);
    });

    // After batch, clips should be sorted by layer
    expect(timeline.clips[0].layer).toBe(0); // The original clip
    expect(timeline.clips[1].layer).toBe(1);
    expect(timeline.clips[2].layer).toBe(2);
  });

  test('should set isBatching flag correctly', () => {
    expect(timeline.isBatching).toBe(false);
    timeline.batch(() => {
      expect(timeline.isBatching).toBe(true);
    });
    expect(timeline.isBatching).toBe(false);
  });

  test('should finalize batch even if callback throws an error', () => {
    expect(timeline.isBatching).toBe(false);

    // The try/catch is to prevent the test from failing due to the thrown error
    try {
      timeline.batch(() => {
        expect(timeline.isBatching).toBe(true);
        throw new Error('test error');
      });
    } catch {
      // ignore
    }

    // The finally block in batch() should have reset the flag
    expect(timeline.isBatching).toBe(false);
  });
});

describe('Timeline addTransition', () => {
  let timeline;
  let mockP5;
  let mockCanvas;
  let warningSpy;

  beforeEach(() => {
    mockP5 = { createGraphics: jest.fn(() => ({})) };
    mockCanvas = { width: 100, height: 100 };
    timeline = new Timeline(mockP5, mockCanvas);
    // Spy on the warning method and provide a mock implementation
    warningSpy = jest
      .spyOn(ErrorHandler, 'warning')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore the original implementation after each test
    warningSpy.mockRestore();
  });

  test('should return null and call ErrorHandler.warning for unknown transition type', () => {
    const options = { type: 'nonexistent-transition' };
    const result = timeline.addTransition(options);

    expect(result).toBeNull();
    expect(ErrorHandler.warning).toHaveBeenCalledTimes(1);
    expect(ErrorHandler.warning).toHaveBeenCalledWith(
      'Unknown transition type: nonexistent-transition'
    );
    expect(timeline.transitions.length).toBe(0);
  });

  test('should add a transition successfully if type is registered', () => {
    // Mock a simple transition class
    class MockTransition {}
    timeline.registerTransitionType('fade', MockTransition);

    const options = { type: 'fade' };
    const result = timeline.addTransition(options);

    expect(result).toBeInstanceOf(MockTransition);
    expect(ErrorHandler.warning).not.toHaveBeenCalled();
    expect(timeline.transitions.length).toBe(1);
    expect(timeline.transitions[0]).toBe(result);
  });
});

describe('Timeline Edge Cases', () => {
  let timeline;
  let mockP5;
  let mockCanvas;

  beforeEach(() => {
    mockP5 = { deltaTime: 16, createGraphics: jest.fn(() => ({})) };
    mockCanvas = { width: 100, height: 100 };
    timeline = new Timeline(mockP5, mockCanvas, { duration: 5000 });
  });

  test('seek should not change time if value is negative', () => {
    timeline.seek(-100);
    expect(timeline.time).toBe(0);
  });

  test('seek should not change time if value is greater than duration', () => {
    timeline.seek(6000);
    expect(timeline.time).toBe(0);
  });

  test('update should not crash with a zero-duration clip', () => {
    const clip = new ClipBase({ start: 100, duration: 0 });
    clip.update = jest.fn();
    timeline.addClip(clip);

    timeline.time = 100;
    expect(() => timeline.update(mockP5)).not.toThrow();
    // The clip should not be updated as the active check is `time < start + duration`
    expect(clip.update).not.toHaveBeenCalled();
  });
});
