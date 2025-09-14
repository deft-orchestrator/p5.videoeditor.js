import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import ImageClip from '../../src/clips/ImageClip.js';
import ClipBase from '../../src/clips/ClipBase.js';

describe('ImageClip', () => {
  let mockP5;
  let mockImage;

  beforeEach(() => {
    mockP5 = {
      push: jest.fn(),
      pop: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      image: jest.fn(),
      imageMode: jest.fn(),
    };
    mockImage = { isP5Image: true }; // Simple mock for a p5.Image object
  });

  test('should extend ClipBase', () => {
    const clip = new ImageClip(mockImage, {});
    expect(clip).toBeInstanceOf(ClipBase);
  });

  test('should call p5.image with the correct parameters', () => {
    const clip = new ImageClip(mockImage, {
      properties: { width: 100, height: 80 },
    });
    clip.render(mockP5, 0);

    expect(mockP5.imageMode).toHaveBeenCalledWith(undefined); // Since p5 instance is a mock, CENTER is undefined
    expect(mockP5.image).toHaveBeenCalledWith(mockImage, 0, 0, 100, 80);
  });

  test('should not render if image is not ready', () => {
    const clip = new ImageClip(null, {
      properties: { width: 100, height: 80 },
    });
    clip.render(mockP5, 0);
    expect(mockP5.image).not.toHaveBeenCalled();
  });
});
