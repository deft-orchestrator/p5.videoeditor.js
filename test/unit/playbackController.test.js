import PlaybackController from '../../src/core/PlaybackController.js';
import Timeline from '../../src/core/Timeline.js';

describe('PlaybackController', () => {
  let timeline;
  let controller;

  beforeEach(() => {
    timeline = new Timeline({ duration: 10000 });
    controller = new PlaybackController(timeline);
  });

  test('play() should set timeline.isPlaying to true', () => {
    controller.play();
    expect(timeline.isPlaying).toBe(true);
  });

  test('pause() should set timeline.isPlaying to false', () => {
    timeline.isPlaying = true;
    controller.pause();
    expect(timeline.isPlaying).toBe(false);
  });

  test('seek() should set timeline.time to the given value', () => {
    controller.seek(5000);
    expect(timeline.time).toBe(5000);
  });

  test('seek() should not set time if value is out of bounds', () => {
    controller.seek(15000);
    expect(timeline.time).toBe(0);
    controller.seek(-100);
    expect(timeline.time).toBe(0);
  });
});
