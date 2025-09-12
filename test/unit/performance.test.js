import { jest } from '@jest/globals';
import PerformanceManager from '../../src/core/PerformanceManager.js';

describe('PerformanceManager', () => {
  let mockP5;
  let consoleWarnSpy;

  beforeEach(() => {
    // Spy on console.warn before each test and mock its implementation
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock the p5.js instance
    mockP5 = {
      frameRate: () => 60,
    };
  });

  afterEach(() => {
    // Restore the original console.warn after each test
    consoleWarnSpy.mockRestore();
  });

  test('should be instantiated with a default frame rate threshold', () => {
    const perfManager = new PerformanceManager();
    expect(perfManager.frameRateThreshold).toBe(45);
    expect(perfManager.enabled).toBe(true);
  });

  test('should be instantiated with a custom frame rate threshold', () => {
    const perfManager = new PerformanceManager({ frameRateThreshold: 30 });
    expect(perfManager.frameRateThreshold).toBe(30);
  });

  test('should log a warning when frame rate is below the threshold', () => {
    const perfManager = new PerformanceManager({ frameRateThreshold: 50 });
    mockP5.frameRate = () => 40.5;

    perfManager.monitor(mockP5);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'PerformanceWarning: Frame rate is 40.50 FPS, which is below the threshold of 50 FPS.'
    );
  });

  test('should not log a warning when frame rate is at or above the threshold', () => {
    const perfManager = new PerformanceManager({ frameRateThreshold: 50 });

    mockP5.frameRate = () => 50;
    perfManager.monitor(mockP5);
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    mockP5.frameRate = () => 60;
    perfManager.monitor(mockP5);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('should not log a warning when the manager is disabled', () => {
    const perfManager = new PerformanceManager({ frameRateThreshold: 50 });
    mockP5.frameRate = () => 30;

    perfManager.disable();
    perfManager.monitor(mockP5);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('should not throw an error or log if the p5 instance is missing', () => {
    const perfManager = new PerformanceManager();

    expect(() => perfManager.monitor(null)).not.toThrow();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
