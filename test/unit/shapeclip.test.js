import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import ShapeClip from '../../src/clips/ShapeClip.js';
import ClipBase from '../../src/clips/ClipBase.js';

describe('ShapeClip', () => {
  let mockP5;

  beforeEach(() => {
    mockP5 = {
      push: jest.fn(),
      pop: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      rect: jest.fn(),
      circle: jest.fn(),
      ellipse: jest.fn(),
      fill: jest.fn(),
      rectMode: jest.fn(),
      ellipseMode: jest.fn(),
      stroke: jest.fn(),
      strokeWeight: jest.fn(),
    };
  });

  test('should extend ClipBase', () => {
    const clip = new ShapeClip('rect', {});
    expect(clip).toBeInstanceOf(ClipBase);
  });

  test('should call p5.rect for "rect" shapeType', () => {
    const clip = new ShapeClip('rect', {
      properties: { width: 50, height: 30 },
    });
    clip.render(mockP5, 0);
    expect(mockP5.rect).toHaveBeenCalledWith(0, 0, 50, 30);
  });

  test('should call p5.ellipse for "ellipse" shapeType', () => {
    const clip = new ShapeClip('ellipse', {
      properties: { width: 50, height: 30 },
    });
    clip.render(mockP5, 0);
    expect(mockP5.ellipse).toHaveBeenCalledWith(0, 0, 50, 30);
  });

  test('should apply fill and stroke properties', () => {
    const clip = new ShapeClip('rect', {
      properties: {
        fill: '#ff0000',
        stroke: '#00ff00',
        strokeWeight: 2,
      },
    });
    clip.render(mockP5, 0);
    expect(mockP5.fill).toHaveBeenCalledWith('#ff0000');
    expect(mockP5.stroke).toHaveBeenCalledWith('#00ff00');
    expect(mockP5.strokeWeight).toHaveBeenCalledWith(2);
  });

  test('should not draw anything for an unknown shapeType', () => {
    const clip = new ShapeClip('triangle', {});
    clip.render(mockP5, 0);
    expect(mockP5.rect).not.toHaveBeenCalled();
    expect(mockP5.ellipse).not.toHaveBeenCalled();
  });
});
