import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import RenderEngine from '../../src/core/RenderEngine.js';
import ClipBase from '../../src/clips/ClipBase.js';

describe('RenderEngine', () => {
  let renderEngine;
  let mockP5, mockCanvas, mockSceneBuffer, mockEffectBuffer;

  beforeEach(() => {
    mockSceneBuffer = {
      name: 'sceneBuffer', // for debugging
      clear: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      shader: jest.fn(),
      rect: jest.fn(),
    };
    mockEffectBuffer = {
      name: 'effectBuffer', // for debugging
      clear: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      shader: jest.fn(),
      rect: jest.fn(),
    };
    mockP5 = {
      createGraphics: jest
        .fn()
        .mockImplementationOnce(() => mockSceneBuffer)
        .mockImplementationOnce(() => mockEffectBuffer),
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
    expect(clip1.render).toHaveBeenCalledWith(mockSceneBuffer);
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

    expect(mockShader.setUniform).toHaveBeenCalledWith(
      'u_texture',
      mockSceneBuffer
    );
    expect(mockShader.setUniform).toHaveBeenCalledWith('u_blurAmount', 5.0);
    expect(mockShader.setUniform).toHaveBeenCalledWith(
      'u_blurDirection',
      [1, 0]
    );
  });

  test('should apply multiple post-processing effects sequentially (ping-pong)', async () => {
    const mockShader1 = { setUniform: jest.fn() };
    const mockShader2 = { setUniform: jest.fn() };

    const effect1 = { type: 'blur' };
    const effect2 = { type: 'sharpen' };

    renderEngine.shaders['blur'] = mockShader1;
    renderEngine.shaders['sharpen'] = mockShader2;
    renderEngine.postProcessingEffects.push(effect1, effect2);

    await renderEngine.render(new Set(), [], 100);

    // Pass 1: blur effect
    // -> Reads from sceneBuffer, writes to effectBuffer
    expect(mockEffectBuffer.shader).toHaveBeenCalledWith(mockShader1);
    expect(mockShader1.setUniform).toHaveBeenCalledWith(
      'u_texture',
      mockSceneBuffer
    );

    // Pass 2: sharpen effect
    // -> Reads from effectBuffer, writes to sceneBuffer (due to swap)
    expect(mockSceneBuffer.shader).toHaveBeenCalledWith(mockShader2);
    expect(mockShader2.setUniform).toHaveBeenCalledWith(
      'u_texture',
      mockEffectBuffer
    );

    // Final image drawn to canvas should be the result of the last pass, which is in sceneBuffer
    expect(mockP5.image).toHaveBeenCalledWith(mockSceneBuffer, 0, 0);
  });
});
