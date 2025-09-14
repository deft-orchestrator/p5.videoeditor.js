import ClipBase from './ClipBase.js';

/**
 * @class SlideShowClip
 * @extends ClipBase
 * @description A special clip type that acts as a container for a sequence of slides.
 * Each slide can contain its own set of clips. Navigation between slides is controlled
 * by `next()` and `previous()` methods, making it suitable for presentations.
 */
class SlideShowClip extends ClipBase {
  /**
   * @constructor
   * @param {object} [options={}] - The configuration object for the clip.
   */
  constructor(options = {}) {
    super(options);
    this.slides = [];
    this.currentSlideIndex = 0;
    this.slideActivationTime = 0;
  }

  /**
   * Adds a new slide to the slideshow. A slide is an array of clips.
   * @param {ClipBase[]} [clips=[]] - An array of clips that make up this slide.
   * @returns {this} The current SlideShowClip instance for chaining.
   * @example
   * const slideShow = editor.createSlideShowClip({ duration: 30 });
   * const slide1Clips = [
   *   editor.createTextClip('Slide 1', { properties: { x: 100, y: 100 } }),
   * ];
   * slideShow.addSlide(slide1Clips);
   */
  addSlide(clips = []) {
    this.slides.push(clips);
    if (this.timeline) {
      clips.forEach((clip) => {
        clip.timeline = this.timeline;
      });
    }
    return this;
  }

  /**
   * Activates a slide at a specific index and resets its internal animation clock.
   * @private
   * @param {number} index - The index of the slide to activate.
   */
  _activateSlide(index) {
    this.currentSlideIndex = index;
    if (this.timeline) {
      // Record the time (relative to the slideshow's start) that this slide became active.
      // This allows animations within the slide to play relative to this moment.
      this.slideActivationTime = this.timeline.time - this.start;
    }
  }

  /**
   * Navigates to the next slide.
   */
  next() {
    if (this.currentSlideIndex < this.slides.length - 1) {
      this._activateSlide(this.currentSlideIndex + 1);
    }
  }

  /**
   * Navigates to the previous slide.
   */
  previous() {
    if (this.currentSlideIndex > 0) {
      this._activateSlide(this.currentSlideIndex - 1);
    }
  }

  /**
   * Updates the properties of the slideshow container and the clips of the active slide.
   * @internal
   * @param {p5} p - The p5.js instance.
   * @param {number} relativeTime - The current time within the slideshow's duration.
   */
  update(p, relativeTime) {
    super.update(p, relativeTime); // Update container properties (e.g., position, scale)

    const activeSlide = this.slides[this.currentSlideIndex];
    if (activeSlide) {
      const timeSinceSlideActivation = relativeTime - this.slideActivationTime;
      activeSlide.forEach((clip) => {
        // Update each clip on the current slide with a time relative to when the slide was shown.
        clip.update(p, timeSinceSlideActivation);
      });
    }
  }

  /**
   * Renders the currently active slide and its clips.
   * This method is called by the RenderEngine.
   * @internal
   * @param {p5} p - The p5.js instance or a p5.Graphics object.
   */
  render(p) {
    // First, apply the transformations of the slideshow container itself.
    // super.render() handles the p.push() and transform operations.
    super.render(p);

    const activeSlide = this.slides[this.currentSlideIndex];
    if (activeSlide) {
      // Sort clips by layer, just like the main render engine.
      const sortedClips = [...activeSlide].sort((a, b) => a.layer - b.layer);

      // Render each clip within the current slide.
      // The RenderEngine normally handles the push/pop for each clip. Since we are
      // rendering these "sub-clips" manually, we must do it here.
      sortedClips.forEach((clip) => {
        clip.render(p); // This will do its own p.push() and transformations.
        p.pop(); // We must provide the matching pop.
      });
    }
  }
}

export default SlideShowClip;
