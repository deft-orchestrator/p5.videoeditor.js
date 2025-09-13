import { FadeInEffect } from '../../src/plugins/FadeInEffectPlugin.js';
import { FadeOutEffect } from '../../src/plugins/FadeOutEffectPlugin.js';

describe('StaticEffects', () => {
  let mockClip;
  let mockP5;

  beforeEach(() => {
    mockClip = {
      properties: {
        opacity: 1,
      },
    };
    mockP5 = {
      lerp: (start, end, t) => start * (1 - t) + end * t,
    };
  });

  describe('FadeInEffect', () => {
    test('should fade in opacity over its duration', () => {
      const fadeIn = new FadeInEffect({ duration: 1000 });

      // At the beginning of the effect
      mockClip.properties.opacity = 1;
      fadeIn.apply(mockClip, mockP5, 0);
      expect(mockClip.properties.opacity).toBeCloseTo(0);

      // Halfway through the effect
      mockClip.properties.opacity = 1;
      fadeIn.apply(mockClip, mockP5, 500);
      expect(mockClip.properties.opacity).toBeCloseTo(0.5);

      // At the end of the effect
      mockClip.properties.opacity = 1;
      fadeIn.apply(mockClip, mockP5, 999);
      expect(mockClip.properties.opacity).toBeCloseTo(0.999);
    });

    test('should not affect opacity outside its duration', () => {
      const fadeIn = new FadeInEffect({ start: 100, duration: 500 });

      // Before the effect
      mockClip.properties.opacity = 1;
      fadeIn.apply(mockClip, mockP5, 50);
      expect(mockClip.properties.opacity).toBe(1);

      // After the effect
      mockClip.properties.opacity = 1;
      fadeIn.apply(mockClip, mockP5, 700);
      expect(mockClip.properties.opacity).toBe(1);
    });

    test('should correctly apply fade-in to a non-default initial opacity', () => {
        const fadeIn = new FadeInEffect({ duration: 1000 });
        mockClip.properties.opacity = 0.5; // Set a non-default initial opacity

        // Halfway through the effect
        fadeIn.apply(mockClip, mockP5, 500);
        // At t=0.5, the fade-in factor is lerp(0, 1, 0.5) = 0.5.
        // This factor is multiplied by the clip's current opacity.
        // Expected: 0.5 (initial opacity) * 0.5 (fade-in factor) = 0.25
        expect(mockClip.properties.opacity).toBeCloseTo(0.25);
    });
  });

  describe('FadeOutEffect', () => {
    test('should fade out opacity over its duration', () => {
      const fadeOut = new FadeOutEffect({ duration: 1000 });

      // At the beginning of the effect
      mockClip.properties.opacity = 1;
      fadeOut.apply(mockClip, mockP5, 0);
      expect(mockClip.properties.opacity).toBeCloseTo(1);

      // Halfway through the effect
      mockClip.properties.opacity = 1;
      fadeOut.apply(mockClip, mockP5, 500);
      expect(mockClip.properties.opacity).toBeCloseTo(0.5);

      // At the end of the effect
      mockClip.properties.opacity = 1;
      fadeOut.apply(mockClip, mockP5, 999);
      expect(mockClip.properties.opacity).toBeCloseTo(0.001);
    });

    test('should not affect opacity outside its duration', () => {
      const fadeOut = new FadeOutEffect({ start: 100, duration: 500 });

      // Before the effect
      mockClip.properties.opacity = 1;
      fadeOut.apply(mockClip, mockP5, 50);
      expect(mockClip.properties.opacity).toBe(1);

      // After the effect
      mockClip.properties.opacity = 1;
      fadeOut.apply(mockClip, mockP5, 700);
      expect(mockClip.properties.opacity).toBe(1);
    });
  });
});
