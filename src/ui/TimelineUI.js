/**
 * @class TimelineUI
 * @description Renders and manages the interactive timeline interface.
 */
class TimelineUI {
  /**
   * @constructor
   * @param {object} editor - The main p5.videoeditor instance.
   * @param {HTMLElement} container - The HTML element to mount the UI into.
   */
  constructor(editor, container) {
    this.editor = editor;
    this.timeline = editor.timeline;
    this.container = container;
    this.isDragging = false;
    this.draggedClip = null;
    this.dragStartX = 0;
    this.originalClipStart = 0;

    this.view = {
      width: this.container.clientWidth,
      height: 200, // Default height
      scale: 50, // 50 pixels per second
    };
    this.colors = {
      background: '#282828',
      ruler: '#333333',
      text: '#DDDDDD',
      clip: '#4A90E2',
      playhead: '#FF0000',
    };
    this.layout = {
      rulerHeight: 30,
      trackHeight: 25,
      trackGap: 5,
    };

    this._createDOMElements();
    this._attachEventListeners();
  }

  /**
   * @private
   * Creates the necessary DOM elements for the timeline UI.
   */
  _createDOMElements() {
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'p5ve-timeline-ui';
    this.container.appendChild(this.uiContainer);

    const sketch = (p) => {
      this.p = p;
      p.setup = () => {
        const canvas = p.createCanvas(this.view.width, this.view.height);
        canvas.parent(this.uiContainer);
      };
      p.draw = () => {
        this._drawTimeline();
      };
    };

    // Instantiate p5 in instance mode
    new p5(sketch);
  }

  /**
   * @private
   * Attaches event listeners for UI interactions.
   */
  _attachEventListeners() {
    const { p, layout } = this;

    p.mousePressed = () => {
      // Handle seeking
      if (p.mouseY < layout.rulerHeight) {
        this.isDragging = 'seek';
        this._handleSeek(p.mouseX);
        return;
      }

      // Handle seeking
      if (p.mouseY < layout.rulerHeight) {
        this.isDragging = 'seek';
        this._handleSeek(p.mouseX);
        return;
      }

      // Handle resizing and dragging
      const { clip, handle } = this._getClipHandleAt(p.mouseX, p.mouseY);
      if (clip) {
        this.isDragging = handle; // 'left', 'right', or 'clip'
        this.draggedClip = clip;
        this.dragStartX = p.mouseX;
        this.originalClipStart = clip.start;
        this.originalClipDuration = clip.duration;
      }
    };

    p.mouseDragged = () => {
      if (this.isDragging === 'seek') {
        this._handleSeek(p.mouseX);
      } else if (this.draggedClip) {
        const dx = p.mouseX - this.dragStartX;
        const dTime = this._pxToTime(dx);

        if (this.isDragging === 'clip') {
          this._handleClipDrag(dTime);
        } else if (this.isDragging === 'left') {
          this._handleResizeLeft(dTime);
        } else if (this.isDragging === 'right') {
          this._handleResizeRight(dTime);
        }
      }
    };

    p.mouseReleased = () => {
      this.isDragging = false;
      this.draggedClip = null;
    };
  }

  // --- Interaction Handlers ---

  _handleSeek(mouseX) {
    const time = this._pxToTime(mouseX);
    this.timeline.seek(time);
  }

  _handleClipDrag(dTime) {
    const newStart = this.originalClipStart + dTime;
    this.draggedClip.start = Math.max(0, newStart);
  }

  _handleResizeLeft(dTime) {
    const newStart = this.originalClipStart + dTime;
    const newDuration = this.originalClipDuration - dTime;
    if (newDuration > 100) {
      // Minimum clip duration
      this.draggedClip.start = Math.max(0, newStart);
      this.draggedClip.duration = newDuration;
    }
  }

  _handleResizeRight(dTime) {
    const newDuration = this.originalClipDuration + dTime;
    if (newDuration > 100) {
      // Minimum clip duration
      this.draggedClip.duration = newDuration;
    }
  }

  _getClipHandleAt(x, y) {
    const { timeline, layout } = this;
    const handleWidth = 8; // px

    for (const clip of timeline.clips) {
      const clipX = this._timeToPx(clip.start);
      const clipY =
        layout.rulerHeight +
        layout.trackGap +
        clip.layer * (layout.trackHeight + layout.trackGap);
      const clipW = this._timeToPx(clip.duration);
      const clipH = layout.trackHeight;

      if (y >= clipY && y <= clipY + clipH) {
        if (x >= clipX && x < clipX + handleWidth) {
          return { clip, handle: 'left' };
        }
        if (x > clipX + clipW - handleWidth && x <= clipX + clipW) {
          return { clip, handle: 'right' };
        }
        if (x >= clipX && x <= clipX + clipW) {
          return { clip, handle: 'clip' };
        }
      }
    }
    return { clip: null, handle: null };
  }

  // --- Coordinate Conversion ---

  _timeToPx(time) {
    return (time / 1000) * this.view.scale;
  }

  _pxToTime(px) {
    return (px / this.view.scale) * 1000;
  }

  // --- Drawing Logic ---

  _drawTimeline() {
    this.p.background(this.colors.background);
    this._drawRuler();
    this._drawClips();
    this._drawPlayhead();
  }

  _drawRuler() {
    const { p, view, layout, colors } = this;
    p.fill(colors.ruler);
    p.noStroke();
    p.rect(0, 0, view.width, layout.rulerHeight);

    p.fill(colors.text);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);

    const increment = 1; // Major tick every 1 second
    const numTicks = Math.floor(this._pxToTime(view.width) / 1000 / increment);

    for (let i = 0; i <= numTicks; i++) {
      const time = i * increment;
      const x = this._timeToPx(time * 1000);
      p.stroke(colors.text);
      p.line(x, layout.rulerHeight - 10, x, layout.rulerHeight);
      p.noStroke();
      p.text(`${time}s`, x, layout.rulerHeight / 2);
    }
  }

  _drawClips() {
    const { p, timeline, layout, colors } = this;
    p.noStroke();

    for (const clip of timeline.clips) {
      const x = this._timeToPx(clip.start);
      const w = this._timeToPx(clip.duration);
      const y =
        layout.rulerHeight +
        layout.trackGap +
        clip.layer * (layout.trackHeight + layout.trackGap);

      p.fill(colors.clip);
      p.rect(x, y, w, layout.trackHeight, 4); // Rounded corners

      p.fill(colors.text);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(clip.name || 'Clip', x + 5, y + layout.trackHeight / 2);
    }
  }

  _drawPlayhead() {
    const { p, timeline, view, colors, layout } = this;
    const x = this._timeToPx(timeline.time);

    if (x >= 0 && x < view.width) {
      p.stroke(colors.playhead);
      p.strokeWeight(2);
      p.line(x, layout.rulerHeight, x, view.height);
    }
  }

  /**
   * Updates and re-renders the timeline UI.
   * This should be called in the p5.js draw loop.
   */
  draw() {
    // The p5 draw loop is now handling rendering automatically.
    // This method could be used for other updates if needed.
  }

  /**
   * Cleans up the UI components, removing the p5 instance and DOM elements.
   */
  destroy() {
    if (this.p) {
      this.p.remove(); // This stops the draw loop and removes the canvas.
    }
    if (this.uiContainer) {
      this.uiContainer.remove(); // Remove the container div from the DOM.
    }
  }
}

export default TimelineUI;
