import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import VideoClip from '../../src/clips/VideoClip.js';
import ClipBase from '../../src/clips/ClipBase.js';

// Mock the global document object to control `createElement`
const mockVideoElement = {
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  // Use a jest.fn() for the setter to spy on it
  _currentTime: 0,
  set currentTime(value) {
    this._currentTime = value;
    mockVideoElement.currentTimeSetter(value);
  },
  get currentTime() {
    return this._currentTime;
  },
  currentTimeSetter: jest.fn(),
};

global.document = {
  createElement: jest.fn((tag) => {
    if (tag === 'video') {
      return mockVideoElement;
    }
    // Fallback for other elements if needed
    return {};
  }),
};

describe('VideoClip', () => {
  let videoClip;
  let mockP5;
  const videoSrc = 'test.mp4';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockVideoElement._currentTime = 0; // Reset time

    videoClip = new VideoClip(videoSrc, {
      start: 1000,
      duration: 5000,
    });

    // The update method now requires a mock p5 instance
    mockP5 = {
      lerp: (start, end, t) => start * (1 - t) + end * t,
    };
  });

  test('should extend ClipBase', () => {
    expect(videoClip).toBeInstanceOf(ClipBase);
  });

  describe('Initialization', () => {
    test('constructor should create a video element', () => {
      expect(document.createElement).toHaveBeenCalledWith('video');
    });

    test('constructor should set video element properties correctly', () => {
      expect(mockVideoElement.src).toContain(videoSrc);
      expect(mockVideoElement.preload).toBe('auto');
      expect(mockVideoElement.muted).toBe(true);
      expect(mockVideoElement.playsInline).toBe(true);
    });
  });

  describe('Playback Control', () => {
    test('should call play() when the clip becomes active', () => {
      // relativeTime of 500 is inside the clip's duration
      videoClip.update(mockP5, 500);
      expect(mockVideoElement.play).toHaveBeenCalledTimes(1);
    });

    test('should not call play() again if already playing', () => {
      videoClip.update(mockP5, 500); // First call to play
      videoClip.update(mockP5, 1000); // Second update while still active
      expect(mockVideoElement.play).toHaveBeenCalledTimes(1);
    });

    test('should call pause() when the clip becomes inactive', () => {
      // First, make it active to start playing
      videoClip.update(mockP5, 500);
      expect(videoClip.isPlaying).toBe(true);

      // Now, update with a time outside the clip's duration
      videoClip.update(mockP5, 6000);
      expect(mockVideoElement.pause).toHaveBeenCalledTimes(1);
      expect(videoClip.isPlaying).toBe(false);
    });

    test('should not call pause() again if already paused', () => {
      videoClip.update(mockP5, 500); // play()
      videoClip.update(mockP5, 6000); // pause()
      videoClip.update(mockP5, 7000); // still inactive
      expect(mockVideoElement.pause).toHaveBeenCalledTimes(1);
    });
  });

  describe('Time Synchronization', () => {
    test('should set video currentTime correctly based on timeline time', () => {
      // 1500ms into the clip
      videoClip.update(mockP5, 1500);
      expect(mockVideoElement.currentTimeSetter).toHaveBeenCalledWith(1.5);
    });

    test('should set video currentTime to 0 at the start of the clip', () => {
      // Exactly at the start
      videoClip.update(mockP5, 0);
      expect(mockVideoElement.currentTimeSetter).toHaveBeenCalledWith(0);
    });

    test('should set video currentTime correctly near the end of the clip', () => {
      // 4999ms into the clip
      videoClip.update(mockP5, 4999);
      expect(mockVideoElement.currentTimeSetter).toHaveBeenCalledWith(4.999);
    });
  });
});
