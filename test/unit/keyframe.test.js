import Keyframe from '../../src/core/Keyframe.js';

describe('Keyframe', () => {
  test('should be instantiated with time and value', () => {
    const kf = new Keyframe(1000, 50);
    expect(kf).toBeInstanceOf(Keyframe);
    expect(kf.time).toBe(1000);
    expect(kf.value).toBe(50);
  });

  test('should default to "linear" easing if not provided', () => {
    const kf = new Keyframe(1000, 50);
    expect(kf.easing).toBe('linear');
  });

  test('should accept an easing function name', () => {
    const kf = new Keyframe(1000, 50, 'easeInQuad');
    expect(kf.easing).toBe('easeInQuad');
  });

  test('should handle various value types', () => {
    const kfNumber = new Keyframe(0, 123);
    expect(kfNumber.value).toBe(123);

    const kfString = new Keyframe(0, '#ff0000');
    expect(kfString.value).toBe('#ff0000');

    const kfObject = new Keyframe(0, { a: 1 });
    expect(kfObject.value).toEqual({ a: 1 });
  });
});
