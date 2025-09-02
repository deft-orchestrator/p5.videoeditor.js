/*
 * P5.VIDEOEDITOR.JS (v3.5) - The Motion Design Framework
 * Sebuah framework canggih untuk membuat video berbasis kode di p5.js.
 *
 * * FITUR BARU (v3.5):
 * 1. MODE DEBUG VISUAL: Memperkenalkan `timeline.setDebug(true)` untuk menampilkan
 * lapisan visual (overlay) yang berisi bounding box, info klip, dan mini-timeline,
 * sangat membantu dalam proses debugging adegan yang kompleks.
 * 2. NAMA KLIP: Setiap klip kini dapat diberi nama (`name`) melalui opsi
 * di constructor untuk identifikasi yang lebih mudah saat debugging.
 *
 * * FITUR SEBELUMNYA:
 * - Penyempurnaan kode, perbaikan masking, buffer grafis robust, transisi,
 * efek shader, parenting, easing per-properti, dan grup klip.
 */

// =============================================================================
// BAGIAN 1: EASING FUNCTIONS (Tidak ada perubahan)
// =============================================================================
const EasingConstants = { BACK_C1: 1.70158, BACK_C2: 1.70158 * 1.525,};
const Easing = {
  linear: t => t,
  easeInQuad: t => t * t, easeOutQuad: t => t * (2 - t), easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t, easeOutCubic: t => (--t) * t * t + 1, easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10), easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t), easeInOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  easeInBack: t => { const c1 = EasingConstants.BACK_C1; const c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; }, easeOutBack: t => { const c1 = EasingConstants.BACK_C1; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }, easeInOutBack: t => { const c1 = EasingConstants.BACK_C1; const c2 = EasingConstants.BACK_C2; return t < 0.5 ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2; },
  easeInElastic: t => { const c4 = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4); }, easeOutElastic: t => { const c4 = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; }, easeInOutElastic: t => { const c5 = (2 * Math.PI) / 4.5; return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2 : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1; },
  easeOutBounce: t => { const n1 = 7.5625; const d1 = 2.75; if (t < 1 / d1) { return n1 * t * t; } else if (t < 2 / d1) { return n1 * (t -= 1.5 / d1) * t + 0.75; } else if (t < 2.5 / d1) { return n1 * (t -= 2.25 / d1) * t + 0.9375; } else { return n1 * (t -= 2.625 / d1) * t + 0.984375; } },
  easeInBounce: t => 1 - Easing.easeOutBounce(1 - t), easeInOutBounce: t => t < 0.5 ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2 : (1 + Easing.easeOutBounce(2 * t - 1)) / 2,
};


// =============================================================================
// BAGIAN 2: CLASS UTAMA - TIMELINE
// =============================================================================
class Timeline {
  constructor(frameRate = 60) {
    this.clips = [];
    this.transitions = [];
    this.currentTime = 0;
    this.isPlaying = true;
    this.frameRate = frameRate;
    this.lastTime = 0;
    this.activeClips = new Set();
    this.debug = false;
    this.debugOptions = {};
  }

  add(clip) {
    this.clips.push(clip);
    this.clips.sort((a, b) => a.startTime - b.startTime);
  }

  addTransition(transition) {
    this.transitions.push(transition);
  }

  setDebug(enabled, options = {}) {
      this.debug = enabled;
      const defaultOptions = {
          textColor: 'white',
          strokeColor: 'rgba(255,0,255,0.75)',
          timelineColor: 'rgba(255,255,255,0.5)',
          playheadColor: 'magenta',
      };
      this.debugOptions = { ...defaultOptions, ...options };
  }

  update() {
    if (this.isPlaying) {
      const now = millis();
      const deltaTime = (now - this.lastTime) / 1000.0;
      this.currentTime += deltaTime;
      this.lastTime = now;
    }

    const currentActiveClips = new Set();
    const activeVisualClips = [];
    const clipsInTransition = new Set();

    // Jalankan update transisi terlebih dahulu
    for (const transition of this.transitions) {
      if (transition.isActive(this.currentTime)) {
        transition.update(this.currentTime);
        clipsInTransition.add(transition.inClip);
        clipsInTransition.add(transition.outClip);
      }
    }

    // --- TAHAP 1: PEMBARUAN STATE & SIKLUS HIDUP ---
    for (const clip of this.clips) {
      const isOfficiallyActive = this.currentTime >= clip.startTime && this.currentTime < clip.startTime + clip.duration;
      const isKeptAlive = clipsInTransition.has(clip);
      
      if (isOfficiallyActive || isKeptAlive) {
        currentActiveClips.add(clip);
        const localTime = this.currentTime - clip.startTime;
        if (!this.activeClips.has(clip)) clip.onStart(localTime);
        clip.onUpdate(localTime);
        if ((clip instanceof VisualClip || clip instanceof ClipGroup) && !clipsInTransition.has(clip)) {
          activeVisualClips.push(clip);
        }
      }
    }
    for (const clip of this.activeClips) {
      if (!currentActiveClips.has(clip)) clip.onEnd();
    }
    this.activeClips = currentActiveClips;
    
    // --- TAHAP 2: RENDERING HIERARKI VISUAL ---
    // Render klip yang dikontrol transisi
    for (const clip of clipsInTransition) {
        if (!clip.parent) clip.render();
    }
    // Render klip visual normal
    for (const clip of activeVisualClips) {
      if (!clip.parent) clip.render();
    }

    // --- TAHAP 3: RENDER DEBUG OVERLAY (JIKA AKTIF) ---
    if (this.debug) {
      this._renderDebugOverlay();
    }
  }

  _renderDebugOverlay() {
    push();
    // --- Gambar info untuk setiap klip aktif ---
    for (const clip of this.activeClips) {
        if (clip instanceof VisualClip) {
            push();
            // Terapkan transformasi untuk menggambar info debug di tempat yang benar
            translate(clip.props.x, clip.props.y);
            translate(clip.props.originX, clip.props.originY);
            rotate(clip.props.rotation);
            scale(clip.props.scale);
            translate(-clip.props.originX, -clip.props.originY);

            // Bounding Box
            stroke(this.debugOptions.strokeColor);
            strokeWeight(2);
            noFill();
            if (clip.props.w && clip.props.h) {
                 rectMode(CENTER);
                 rect(0, 0, clip.props.w, clip.props.h);
            }

            // Info Teks
            noStroke();
            fill(this.debugOptions.textColor);
            textAlign(LEFT, BOTTOM);
            textSize(12);
            const infoText = `[${clip.name}]\nTime: ${clip.currentLocalTime.toFixed(2)}s\nPos: ${clip.props.x.toFixed(0)}, ${clip.props.y.toFixed(0)}`;
            // Gambar teks sedikit di luar bounding box
            text(infoText, (clip.props.w / 2 || 50) + 5, -(clip.props.h / 2 || 50));
            pop();
        }
    }
    
    // --- Gambar mini timeline bar di bagian bawah ---
    const timelineY = height - 20;
    const totalDuration = this.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
    
    stroke(this.debugOptions.timelineColor);
    strokeWeight(4);
    line(10, timelineY, width - 10, timelineY);
    
    // Gambar playhead
    const playheadX = map(this.currentTime, 0, totalDuration, 10, width - 10, true);
    stroke(this.debugOptions.playheadColor);
    strokeWeight(8);
    line(playheadX, timelineY - 5, playheadX, timelineY + 5);
    
    // Gambar teks waktu
    noStroke();
    fill(this.debugOptions.textColor);
    textAlign(CENTER, BOTTOM);
    textSize(14);
    text(`${this.currentTime.toFixed(2)}s / ${totalDuration.toFixed(2)}s`, playheadX, timelineY - 10);

    pop();
  }

  play() { if (!this.isPlaying) { this.isPlaying = true; this.lastTime = millis(); } }
  pause() { this.isPlaying = false; }
  seek(timeInSeconds, forceUpdate = true) {
    this.currentTime = timeInSeconds;
    this.lastTime = millis();
    if (forceUpdate) {
      for (const clip of this.activeClips) if (clip instanceof AudioClip) clip.sound.stop();
      this.activeClips.clear();
      const wasPlaying = this.isPlaying;
      this.isPlaying = false;
      this.update();
      this.isPlaying = wasPlaying;
    }
  }
}


// =============================================================================
// BAGIAN 3: CLASS DASAR - BASECLIP & VISUALCLIP
// =============================================================================
class BaseClip {
  constructor(startTime, duration, options = {}) {
    this.startTime = startTime;
    this.duration = duration;
    this.keyframes = [];
    this.props = {};
    this.effects = [];
    this.resetOnEnd = options.resetOnEnd || false;
    this.initialProps = {};
    this.currentLocalTime = 0;
    // Beri nama default berdasarkan nama class, atau gunakan nama dari opsi
    this.name = options.name || this.constructor.name;
  }
  
  onStart(localTime) {}
  onUpdate(localTime) { this.currentLocalTime = localTime; }
  onEnd() { if (this.resetOnEnd) this.props = { ...this.initialProps }; }

  addKeyframe(time, properties, fallbackEasing = Easing.linear) {
    this.keyframes.push({ time, properties, fallbackEasing });
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  addEffect(effect) { effect.applyTo(this); }
  _getPropDetails(prop) { if (typeof prop === 'object' && prop !== null && prop.value !== undefined) { return { value: prop.value, easing: prop.easing || Easing.linear }; } return { value: prop, easing: null }; }
  _interpolateValue(startVal, endVal, progress) { if (typeof startVal === 'number' && typeof endVal === 'number') return lerp(startVal, endVal, progress); const isStartColor = startVal instanceof p5.Color || typeof startVal === 'string'; const isEndColor = endVal instanceof p5.Color || typeof endVal === 'string'; if (isStartColor && isEndColor) { try { const s = color(startVal); const e = color(endVal); return lerpColor(s, e, progress); } catch (e) { return startVal; } } if (startVal instanceof p5.Vector && endVal instanceof p5.Vector) return p5.Vector.lerp(startVal, endVal, progress); if (typeof startVal !== typeof endVal) return startVal; return startVal; }
  
  _updateProperties(localTime) {
    if (this.keyframes.length === 0) return;
    let startFrame = this.keyframes.findLast(kf => kf.time <= localTime) || this.keyframes[0];
    let endFrame = this.keyframes.find(kf => kf.time > localTime) || startFrame;

    for (const key in startFrame.properties) {
      if (key in endFrame.properties) {
        const startProp = this._getPropDetails(startFrame.properties[key]);
        const endProp = this._getPropDetails(endFrame.properties[key]);
        const easing = endProp.easing || startFrame.fallbackEasing;
        let progress = map(localTime, startFrame.time, endFrame.time, 0, 1, true);
        if (progress > 0 && progress < 1) progress = easing(progress);
        this.props[key] = this._interpolateValue(startProp.value, endProp.value, progress);
      } else {
        this.props[key] = this._getPropDetails(startFrame.properties[key]).value;
      }
    }
  }
}

class VisualClip extends BaseClip {
  constructor(startTime, duration, options) {
    super(startTime, duration, options);
    this.props = { opacity: 255, rotation: 0, scale: 1, originX: 0, originY: 0, ...options };
    this.initialProps = { ...this.props };
    this.parent = null;
    this.children = [];
    this.mask = null;
    this._maskGfx = null;
    this._contentGfx = null;
  }

  onUpdate(localTime) {
    super.onUpdate(localTime);
    this._updateProperties(localTime);
    if (this.mask) {
      this.mask.onUpdate(localTime);
    }
  }
  
  setParent(parentClip) { if (this.parent) this.parent._removeChild(this); this.parent = parentClip; if (parentClip) parentClip._addChild(this); }
  _addChild(childClip) { this.children.push(childClip); }
  _removeChild(childClip) { this.children = this.children.filter(c => c !== childClip); }
  
  setMask(maskClip) { this.mask = maskClip; }

  render() {
    if (this.mask) {
      this._renderWithMask();
    } else {
      this._renderWithoutMask();
    }
  }

  _renderWithoutMask() {
    push();
    translate(this.props.x, this.props.y);
    translate(this.props.originX, this.props.originY);
    rotate(this.props.rotation);
    scale(this.props.scale);
    translate(-this.props.originX, -this.props.originY);
    this.display();
    for (const child of this.children) if (child.render) child.render();
    pop();
  }

  _renderWithMask() {
    if (!this._contentGfx || this._contentGfx.width !== width || this._contentGfx.height !== height) {
        this._contentGfx = createGraphics(width, height);
        this._maskGfx = createGraphics(width, height);
    }
    
    this._contentGfx.clear();
    this._contentGfx.push();
    this._contentGfx.translate(this.props.x, this.props.y);
    this.display();
    this._contentGfx.pop();

    this._maskGfx.clear();
    this.mask.render();

    let maskedContent = this._contentGfx.get();
    maskedContent.mask(this._maskGfx.get());
    
    image(maskedContent, 0, 0);
  }

  display() {}
}


// =============================================================================
// BAGIAN 4: JENIS-JENIS KLIP
// =============================================================================
class ClipGroup extends VisualClip { /* Implementasi sama seperti v3.1 */ constructor(startTime, duration, options = {}) { super(startTime, duration, options); this.internalTimeline = new Timeline(); this.internalTimeline.isPlaying = false; } add(clip) { this.internalTimeline.add(clip); } onUpdate(localTime) { super.onUpdate(localTime); } display() { this.internalTimeline.seek(this.currentLocalTime, true); } }
class TextClip extends VisualClip { /* Implementasi sama seperti v3.1 */ constructor(text, startTime, duration, options = {}) { const d = { x: width / 2, y: height / 2, size: 48, color: color('white'), align: CENTER }; super(startTime, duration, { ...d, ...options }); this.text = text; } display() { const c = color(this.props.color); c.setAlpha(this.props.opacity); fill(c); textAlign(this.props.align, CENTER); textSize(this.props.size); text(this.text, 0, 0); } }
class ShapeClip extends VisualClip { /* Implementasi sama seperti v3.1 */ constructor(shapeType, startTime, duration, options = {}) { const d = { x: width / 2, y: height / 2, w: 100, h: 100, color: color('red'), stroke: false }; super(startTime, duration, { ...d, ...options }); this.shapeType = shapeType; } display() { const c = color(this.props.color); c.setAlpha(this.props.opacity); fill(c); if (this.props.stroke) { stroke(this.props.stroke); } else { noStroke(); } rectMode(CENTER); if (this.shapeType === 'rect') { rect(0, 0, this.props.w, this.props.h); } else if (this.shapeType === 'ellipse') { ellipse(0, 0, this.props.w, this.props.h); } } }
class ImageClip extends VisualClip { /* Implementasi sama seperti v3.1 */ constructor(img, startTime, duration, options = {}) { const d = { x: width/2, y: height/2, w: img.width, h: img.height, tintColor: color(255) }; super(startTime, duration, { ...d, ...options }); this.img = img; } display() { const t = color(this.props.tintColor); t.setAlpha(this.props.opacity); tint(t); imageMode(CENTER); image(this.img, 0, 0, this.props.w, this.props.h); } }
class AudioClip extends BaseClip { /* Implementasi sama seperti v3.1 */ constructor(soundFile, startTime, duration, options) { if (typeof p5.SoundFile === 'undefined') throw new Error('[P5.VideoEditor] AudioClip needs p5.sound library.'); super(startTime, duration || soundFile.duration(), options); this.sound = soundFile; } onStart(localTime) { this.sound.jump(localTime, this.duration - localTime); } onEnd() { this.sound.stop(); } }
class FunctionClip extends BaseClip { /* Implementasi sama seperti v3.1 */ constructor(callback, startTime, duration) { super(startTime, duration); if (typeof callback !== 'function') throw new Error('[P5.VideoEditor] Callback must be a function.'); this.callback = callback; } onUpdate(localTime) { this.callback({ localTime, progress: localTime / this.duration, clip: this }); } }

/** @class ShaderEffectClip Klip untuk menerapkan shader GLSL sebagai lapisan penyesuaian. */
class ShaderEffectClip extends VisualClip {
  constructor(shader, startTime, duration) {
    super(startTime, duration, { x: width / 2, y: height / 2 });
    this.shader = shader;
  }
  display() {
    shader(this.shader);
    this.shader.setUniform('u_resolution', [width, height]);
    this.shader.setUniform('u_time', this.currentLocalTime);
    for(const key in this.props) {
        if(key.startsWith('u_')) {
            this.shader.setUniform(key, this.props[key]);
        }
    }
    rect(0, 0, width, height);
    resetShader();
  }
}


// =============================================================================
// BAGIAN 5: SISTEM EFEK & TRANSISI
// =============================================================================
class BaseEffect { constructor(duration) { this.duration = duration; } applyTo(clip) {} }
class FadeInEffect extends BaseEffect { constructor(duration = 1.0) { super(duration); } applyTo(clip) { clip.addKeyframe(0, { opacity: 0 }); clip.addKeyframe(this.duration, { opacity: 255 }); } }
class FadeOutEffect extends BaseEffect { constructor(duration = 1.0) { super(duration); } applyTo(clip) { const s = clip.duration - this.duration; clip.addKeyframe(s, { opacity: 255 }); clip.addKeyframe(clip.duration, { opacity: 0 }); } }
class MoveEffect extends BaseEffect { constructor(sX, sY, eX, eY, duration, easing = Easing.easeInOutQuad) { super(duration); this.sX=sX; this.sY=sY; this.eX=eX; this.eY=eY; this.easing=easing; } applyTo(clip) { clip.addKeyframe(0, { x: this.sX, y: this.sY }); clip.addKeyframe(this.duration, { x: this.eX, y: this.eY }, this.easing); } }
class ScaleEffect extends BaseEffect { constructor(sS, eS, duration, easing = Easing.easeInOutQuad) { super(duration); this.sS=sS; this.eS=eS; this.easing=easing; } applyTo(clip) { clip.addKeyframe(0, { scale: this.sS }); clip.addKeyframe(this.duration, { scale: this.eS }, this.easing); } }
class RotateEffect extends BaseEffect { constructor(sA, eA, duration, easing = Easing.easeInOutQuad) { super(duration); this.sA=sA; this.eA=eA; this.easing=easing; } applyTo(clip) { clip.addKeyframe(0, { rotation: this.sA }); clip.addKeyframe(this.duration, { rotation: this.eA }, this.easing); } }

/** @class BaseTransition Dasar untuk semua transisi. */
class BaseTransition {
  constructor(outClip, inClip, duration) {
    this.outClip = outClip;
    this.inClip = inClip;
    this.duration = duration;
    this.startTime = inClip.startTime;
    this.endTime = this.startTime + duration;
  }
  isActive(currentTime) { return currentTime >= this.startTime && currentTime < this.endTime; }
  update(currentTime) { console.error("Metode update() harus diimplementasikan."); }
}

/** @class CrossFadeTransition Transisi yang memudarkan satu klip keluar sambil memudarkan klip lain masuk. */
class CrossFadeTransition extends BaseTransition {
  update(currentTime) {
    const progress = map(currentTime, this.startTime, this.endTime, 0, 1, true);
    this.outClip.props.opacity = lerp(255, 0, progress);
    this.inClip.props.opacity = lerp(0, 255, progress);
  }
}

