import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import PlaybackController from '../../src/core/PlaybackController.js';
import Timeline from '../../src/core/Timeline.js';

describe('PlaybackController', () => {
  let timeline;
  let controller;
  let mockCanvas;
  let mockContainer;
  let mockP5;

  beforeEach(() => {
    // Mocks needed for the new constructors
    mockP5 = {
      createGraphics: jest.fn(() => ({})),
    };
    mockCanvas = {
      width: 100,
      height: 100,
      toDataURL: jest.fn(),
    };
    mockContainer = {
      appendChild: jest.fn(),
    };

    // Mock document and Worker globals for the test environment
    global.document = {
      createElement: jest.fn(() => ({
        style: {},
        appendChild: jest.fn(),
      })),
    };
    global.Worker = jest.fn(() => ({
      postMessage: jest.fn(),
      onmessage: jest.fn(),
      terminate: jest.fn(),
    }));

    // Instantiate with the new, correct signature
    timeline = new Timeline(mockP5, mockCanvas, { duration: 10000 });
    controller = new PlaybackController(timeline, mockCanvas, mockContainer);
  });

  test('play() should set timeline.isPlaying to true', () => {
    controller.play();
    expect(timeline.isPlaying).toBe(true);
  });

  test('pause() should set timeline.isPlaying to false', () => {
    timeline.isPlaying = true;
    controller.pause();
    expect(timeline.isPlaying).toBe(false);
  });

  test('seek() should set timeline.time to the given value', () => {
    controller.seek(5000);
    expect(timeline.time).toBe(5000);
  });

  test('seek() should not set time if value is out of bounds', () => {
    controller.seek(15000);
    expect(timeline.time).toBe(0);
    controller.seek(-100);
    expect(timeline.time).toBe(0);
  });
});
