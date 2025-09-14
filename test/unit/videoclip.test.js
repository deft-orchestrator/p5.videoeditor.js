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
  // Use a full URL to be compatible with the new URL validation
  const videoSrc = 'http://example.com/test.mp4';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockVideoElement._currentTime = 0; // Reset time

    videoClip = new VideoClip(videoSrc, {
      start: 1000,
      duration: 5000,
    });

    // A more complete p5 mock is needed now that render() is called in tests
    mockP5 = {
      lerp: (start, end, t) => start * (1 - t) + end * t,
      push: jest.fn(),
      pop: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      imageMode: jest.fn(),
      image: jest.fn(),
      CENTER: 'center', // Mock p5 constants
    };
  });

  test('should extend ClipBase', () => {
    expect(videoClip).toBeInstanceOf(ClipBase);
  });

  describe('Lazy Initialization', () => {
    test('constructor should NOT create a video element immediately', () => {
      expect(document.createElement).not.toHaveBeenCalled();
    });

    test('should create the video element on first update', () => {
      videoClip.update(mockP5, 1500); // Call update to trigger initialization
      expect(document.createElement).toHaveBeenCalledWith('video');
    });

    test('should create the video element on first render', () => {
      videoClip.render(mockP5, 1500); // Call render to trigger initialization
      expect(document.createElement).toHaveBeenCalledWith('video');
    });

    test('should only create the video element once', () => {
      videoClip.update(mockP5, 1500);
      videoClip.render(mockP5, 1600);
      videoClip.update(mockP5, 1700);
      expect(document.createElement).toHaveBeenCalledTimes(1);
    });

    test('should set video element properties correctly after initialization', () => {
      videoClip.update(mockP5, 1500); // Trigger initialization
      expect(mockVideoElement.src).toContain(videoSrc);
      expect(mockVideoElement.preload).toBe('auto');
      expect(mockVideoElement.muted).toBe(true);
      expect(mockVideoElement.playsInline).toBe(true);
    });
  });

  describe('URL Validation', () => {
    test('constructor should throw an error for unsafe protocols', () => {
      const maliciousSrc = 'javascript:alert("XSS")';
      expect(() => {
        new VideoClip(maliciousSrc, {});
      }).toThrow(/Unsafe video protocol: javascript:/);
    });

    test('constructor should throw an error for invalid URLs', () => {
      const invalidSrc = 'not a valid url';
      expect(() => {
        new VideoClip(invalidSrc, {});
      }).toThrow(/Invalid video source URL/);
    });
  });

  describe('Playback Control', () => {
    test('should call play() when the clip becomes active', () => {
      videoClip.update(mockP5, 500);
      expect(mockVideoElement.play).toHaveBeenCalledTimes(1);
    });

    test('should not call play() again if already playing', () => {
      videoClip.update(mockP5, 500);
      videoClip.update(mockP5, 1000);
      expect(mockVideoElement.play).toHaveBeenCalledTimes(1);
    });

    test('should call pause() when the clip becomes inactive', () => {
      videoClip.update(mockP5, 500);
      expect(videoClip.isPlaying).toBe(true);
      videoClip.update(mockP5, 6000);
      expect(mockVideoElement.pause).toHaveBeenCalledTimes(1);
      expect(videoClip.isPlaying).toBe(false);
    });

    test('should not call pause() again if already paused', () => {
      videoClip.update(mockP5, 500);
      videoClip.update(mockP5, 6000);
      videoClip.update(mockP5, 7000);
      expect(mockVideoElement.pause).toHaveBeenCalledTimes(1);
    });
  });

  describe('Time Synchronization', () => {
    test('should set video currentTime when seeking (large time difference)', () => {
      videoClip.update(mockP5, 1500);
      expect(mockVideoElement.currentTimeSetter).toHaveBeenCalledWith(1.5);
    });

    test('should set video currentTime when playing from a paused state', () => {
      mockVideoElement.paused = true;
      videoClip.update(mockP5, 500);
      expect(mockVideoElement.currentTimeSetter).toHaveBeenCalledWith(0.5);
      mockVideoElement.paused = false;
    });

    test('should NOT set video currentTime during smooth playback (small time difference)', () => {
      videoClip.update(mockP5, 1500);
      expect(mockVideoElement.currentTimeSetter).toHaveBeenCalledTimes(1);
      videoClip.update(mockP5, 1516);
      expect(mockVideoElement.currentTimeSetter).toHaveBeenCalledTimes(1);
    });
  });
});
