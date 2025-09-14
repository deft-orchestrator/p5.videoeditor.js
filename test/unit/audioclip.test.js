import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import AudioClip from '../../src/clips/AudioClip.js';
import ClipBase from '../../src/clips/ClipBase.js';

// Mock p5.SoundFile
const mockSoundFile = {
  play: jest.fn(),
  stop: jest.fn(),
  jump: jest.fn(),
  setVolume: jest.fn(),
  pan: jest.fn(),
  duration: () => 10, // 10 seconds
};

describe('AudioClip', () => {
  let audioClip;
  let mockP5;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    mockP5 = {
      lerp: (start, end, t) => start * (1 - t) + end * t,
    };

    audioClip = new AudioClip(mockSoundFile, {
      start: 1000,
      duration: 5000, // 5 seconds
      properties: { volume: 0.5 },
    });
  });

  test('should extend ClipBase', () => {
    expect(audioClip).toBeInstanceOf(ClipBase);
  });

  test('constructor should set up properties correctly', () => {
    expect(audioClip.start).toBe(1000);
    expect(audioClip.duration).toBe(5000);
    expect(audioClip.soundFile).toBe(mockSoundFile);
    expect(audioClip.properties.volume).toBe(0.5);
    expect(audioClip.properties.pan).toBe(0); // default
  });

  test('update() should not do anything if soundFile is invalid', () => {
    const clipWithNoSound = new AudioClip(null);
    expect(() => clipWithNoSound.update(mockP5, 100)).not.toThrow();
  });

  test('update() should play and jump when timeline enters the clip', () => {
    audioClip.update(mockP5, 500); // relativeTime is 500ms into the clip

    expect(mockSoundFile.play).toHaveBeenCalledTimes(1);
    expect(mockSoundFile.jump).toHaveBeenCalledTimes(1);
    expect(mockSoundFile.jump).toHaveBeenCalledWith(0.5); // 500ms = 0.5s
    expect(audioClip._isPlaying).toBe(true);
  });

  test('update() should stop when timeline leaves the clip', () => {
    // First, enter the clip to set _isPlaying = true
    audioClip.update(mockP5, 500);
    expect(audioClip._isPlaying).toBe(true);

    // Now, leave the clip
    audioClip.update(mockP5, 6000);
    expect(mockSoundFile.stop).toHaveBeenCalledTimes(1);
    expect(audioClip._isPlaying).toBe(false);
  });

  test('update() should not call play() again if already playing', () => {
    // Enter and start playing
    audioClip.update(mockP5, 500);
    // Stay inside the clip
    audioClip.update(mockP5, 1000);

    expect(mockSoundFile.play).toHaveBeenCalledTimes(1);
  });

  test('update() should apply keyframed volume and pan values', () => {
    // Add keyframes to change volume and pan over time
    audioClip.addKeyframe('volume', 0, 0.5);
    audioClip.addKeyframe('volume', 5000, 1.0); // At the end of the clip, volume is 1.0
    audioClip.addKeyframe('pan', 0, -1.0);
    audioClip.addKeyframe('pan', 5000, 1.0);

    // Update halfway through the keyframe transition (2500ms into the clip)
    audioClip.update(mockP5, 2500);

    // Halfway through, volume should be lerp(0.5, 1.0, 0.5) = 0.75
    // Halfway through, pan should be lerp(-1.0, 1.0, 0.5) = 0
    expect(mockSoundFile.setVolume).toHaveBeenCalledWith(0.75);
    expect(mockSoundFile.pan).toHaveBeenCalledWith(0);
  });

  test('render() should be a no-op', () => {
    // Render doesn't do anything, just call it to ensure no errors
    expect(() => audioClip.render(mockP5, 0)).not.toThrow();
  });

  test('update() should not call stop() again if already stopped', () => {
    // Start playing
    audioClip.update(mockP5, 500);
    expect(audioClip._isPlaying).toBe(true);

    // Stop playing
    audioClip.update(mockP5, 6000);
    expect(audioClip._isPlaying).toBe(false);
    expect(mockSoundFile.stop).toHaveBeenCalledTimes(1);

    // Update again outside the clip
    audioClip.update(mockP5, 7000);
    expect(mockSoundFile.stop).toHaveBeenCalledTimes(1); // Should not be called again
  });
});
