import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import RenderEngine from '../../src/core/RenderEngine.js';
import ClipBase from '../../src/clips/ClipBase.js';

describe('RenderEngine', () => {
  let renderEngine;
  let mockP5, mockCanvas, mockSceneBuffer;

  beforeEach(() => {
    mockSceneBuffer = {
      clear: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      shader: jest.fn(),
      rect: jest.fn(),
    };
    mockP5 = {
      createGraphics: jest.fn(() => mockSceneBuffer),
      image: jest.fn(),
    };
    mockCanvas = { width: 100, height: 100 };
    renderEngine = new RenderEngine(mockP5, mockCanvas);
  });

  test('should clear the scene buffer on render', () => {
    renderEngine.render(new Set(), [], 0);
    expect(mockSceneBuffer.clear).toHaveBeenCalledTimes(1);
  });

  test('should render standalone clips', () => {
    const clip1 = new ClipBase({ layer: 0 });
    clip1.render = jest.fn();
    clip1.effects = [];

    const clipsToRender = new Set([clip1]);
    renderEngine.render(clipsToRender, [], 100);

    expect(clip1.render).toHaveBeenCalledTimes(1);
    // The render method on the clip should be called with the scene buffer
    expect(clip1.render).toHaveBeenCalledWith(mockSceneBuffer, expect.any(Number));
  });

  test('should render active transitions', () => {
    const transition = {
      fromClip: new ClipBase(),
      toClip: new ClipBase(),
      render: jest.fn(),
    };
    const clipsToRender = new Set([transition.fromClip, transition.toClip]);
    const activeTransitions = [transition];

    renderEngine.render(clipsToRender, activeTransitions, 100);

    expect(transition.render).toHaveBeenCalledTimes(1);
    expect(transition.render).toHaveBeenCalledWith(mockSceneBuffer, 100);
  });

  test('should not render clips that are part of an active transition individually', () => {
    const fromClip = new ClipBase();
    fromClip.render = jest.fn();
    fromClip.effects = [];

    const toClip = new ClipBase();
    toClip.render = jest.fn();
    toClip.effects = [];

    const transition = { fromClip, toClip, render: jest.fn() };
    const clipsToRender = new Set([fromClip, toClip]);
    const activeTransitions = [transition];

    renderEngine.render(clipsToRender, activeTransitions, 100);

    // The transition's render method is responsible for rendering the clips
    expect(fromClip.render).not.toHaveBeenCalled();
    expect(toClip.render).not.toHaveBeenCalled();
    expect(transition.render).toHaveBeenCalledTimes(1);
  });

  test('should apply generic uniforms for post-processing effects', async () => {
    const mockShader = {
      setUniform: jest.fn(),
    };
    const effect = {
      type: 'blur',
      uniforms: {
        u_blurAmount: 5.0,
        u_blurDirection: [1, 0],
      },
    };

    renderEngine.shaders['blur'] = mockShader;
    renderEngine.postProcessingEffects.push(effect);

    await renderEngine.render(new Set(), [], 100);

    expect(mockShader.setUniform).toHaveBeenCalledWith('u_texture', mockSceneBuffer);
    expect(mockShader.setUniform).toHaveBeenCalledWith('u_blurAmount', 5.0);
    expect(mockShader.setUniform).toHaveBeenCalledWith('u_blurDirection', [1, 0]);
  });
});
