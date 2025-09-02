/*
 * P5.VIDEOEDITOR.JS (v2.0)
 * Library canggih untuk membuat video berbasis kode di p5.js.
 * * FITUR BARU (v2.0):
 * 1. Keyframing: Animasikan properti apa pun di dalam klip.
 * 2. Easing Functions: Kumpulan fungsi untuk animasi yang lebih halus.
 * 3. AudioClip: Tambahkan dan sinkronkan audio dengan mudah (membutuhkan p5.sound).
 * 4. Effect System: Cara sederhana untuk menambahkan animasi umum.
 * 5. Event-Driven Core: Timeline kini menggunakan onStart, onUpdate, onEnd untuk
 * kontrol klip yang lebih tangguh.
 */

// =============================================================================
// BAGIAN 1: EASING FUNCTIONS
// Kumpulan fungsi untuk membuat animasi terasa lebih natural.
// Sumber: https://easings.net/
// =============================================================================
const Easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};


// =============================================================================
// BAGIAN 2: CLASS UTAMA - TIMELINE
// Menggunakan sistem event (onStart, onUpdate, onEnd) untuk kontrol yang lebih baik.
// =============================================================================
class Timeline {
  constructor(frameRate = 60) {
    this.clips = [];
    this.currentTime = 0;
    this.isPlaying = true;
    this.frameRate = frameRate;
    this.lastTime = 0;
    this.activeClips = new Set(); // Melacak klip yang aktif di frame sebelumnya
  }

  add(clip) {
    this.clips.push(clip);
    this.clips.sort((a, b) => a.startTime - b.startTime);
  }

  update() {
    if (this.isPlaying) {
      const now = millis();
      const deltaTime = (now - this.lastTime) / 1000.0;
      this.currentTime += deltaTime;
      this.lastTime = now;
    }

    const currentActiveClips = new Set();

    for (const clip of this.clips) {
      if (clip.startTime > this.currentTime) break;

      const isClipActive = this.currentTime >= clip.startTime && this.currentTime < clip.startTime + clip.duration;

      if (isClipActive) {
        currentActiveClips.add(clip);
        const localTime = this.currentTime - clip.startTime;

        if (!this.activeClips.has(clip)) {
          clip.onStart(localTime); // Panggil onStart saat klip pertama kali aktif
        }
        clip.onUpdate(localTime); // Panggil onUpdate setiap frame
      }
    }

    // Periksa klip mana yang sudah tidak aktif lagi
    for (const clip of this.activeClips) {
      if (!currentActiveClips.has(clip)) {
        clip.onEnd(); // Panggil onEnd saat klip berhenti
      }
    }

    this.activeClips = currentActiveClips;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastTime = millis();
    }
  }
  pause() { this.isPlaying = false; }
  seek(timeInSeconds) { this.currentTime = timeInSeconds; }
}


// =============================================================================
// BAGIAN 3: CLASS DASAR - BASECLIP DENGAN KEMAMPUAN KEYFRAMING
// =============================================================================
class BaseClip {
  constructor(startTime, duration) {
    this.startTime = startTime;
    this.duration = duration;
    
    // Sistem Keyframing
    this.keyframes = [];
    this.props = {}; // Properti yang dianimasikan
    this.effects = [];
  }
  
  // Metode event, di-override oleh subclass
  onStart(localTime) {}
  onUpdate(localTime) {}
  onEnd() {}

  // --- Sistem Keyframing & Efek ---
  addKeyframe(time, properties, easing = Easing.linear) {
    this.keyframes.push({ time, properties, easing });
    this.keyframes.sort((a, b) => a.time - b.time);
  }
  
  addEffect(effect) {
    this.effects.push(effect);
    effect.applyTo(this);
  }

  _updateProperties(localTime) {
    if (this.keyframes.length === 0) return;

    // Temukan keyframe awal dan akhir
    let startFrame = this.keyframes.findLast(kf => kf.time <= localTime);
    let endFrame = this.keyframes.find(kf => kf.time > localTime);

    if (!startFrame && !endFrame) return;
    if (!startFrame) startFrame = endFrame;
    if (!endFrame) endFrame = startFrame;
    
    // Interpolasi properti
    for (const key in startFrame.properties) {
      if (key in endFrame.properties) {
        const startTime = startFrame.time;
        const endTime = endFrame.time;
        const startValue = startFrame.properties[key];
        const endValue = endFrame.properties[key];
        
        let progress = map(localTime, startTime, endTime, 0, 1, true);
        progress = startFrame.easing(progress);

        if (typeof startValue === 'number') {
          this.props[key] = lerp(startValue, endValue, progress);
        } else if (startValue instanceof p5.Color) {
           this.props[key] = lerpColor(startValue, endValue, progress);
        }
      }
    }
  }
}


// =============================================================================
// BAGIAN 4: JENIS-JENIS KLIP
// =============================================================================

class VisualClip extends BaseClip {
  constructor(startTime, duration, options) {
    super(startTime, duration);
    // Inisialisasi properti dari options
    this.props = { opacity: 255, ...options };
  }

  onUpdate(localTime) {
    this._updateProperties(localTime);
    push();
    this.display(localTime);
    pop();
  }
  
  // Akan di-override
  display(localTime) {}
}

class TextClip extends VisualClip {
  constructor(text, startTime, duration, options = {}) {
    const defaultOptions = { x: width / 2, y: height / 2, size: 48, color: color('white'), align: CENTER };
    super(startTime, duration, { ...defaultOptions, ...options });
    this.text = text;
  }

  display() {
    const c = this.props.color;
    fill(red(c), green(c), blue(c), this.props.opacity);
    textAlign(this.props.align, CENTER);
    textSize(this.props.size);
    text(this.text, this.props.x, this.props.y);
  }
}

class ShapeClip extends VisualClip {
  constructor(shapeType, startTime, duration, options = {}) {
    const defaultOptions = { x: width / 2, y: height / 2, w: 100, h: 100, color: color('red'), stroke: false };
    super(startTime, duration, { ...defaultOptions, ...options });
    this.shapeType = shapeType;
  }

  display() {
    const c = this.props.color;
    fill(red(c), green(c), blue(c), this.props.opacity);
    if (this.props.stroke) {
      stroke(this.props.stroke);
    } else {
      noStroke();
    }
    rectMode(CENTER);
    if (this.shapeType === 'rect') {
      rect(this.props.x, this.props.y, this.props.w, this.props.h);
    } else if (this.shapeType === 'ellipse') {
      ellipse(this.props.x, this.props.y, this.props.w, this.props.h);
    }
  }
}

class ImageClip extends VisualClip {
    constructor(img, startTime, duration, options = {}) {
        const defaultOptions = { x: 0, y: 0, w: width, h: height };
        super(startTime, duration, { ...defaultOptions, ...options });
        this.img = img;
    }

    display() {
        push();
        tint(255, this.props.opacity);
        imageMode(CORNER);
        image(this.img, this.props.x, this.props.y, this.props.w, this.props.h);
        pop();
    }
}

/**
 * PENTING: Untuk menggunakan AudioClip, tambahkan library p5.sound.js ke file index.html Anda!
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/addons/p5.sound.min.js"></script>
 */
class AudioClip extends BaseClip {
  constructor(soundFile, startTime, duration) {
    super(startTime, duration || soundFile.duration());
    this.sound = soundFile;
  }

  onStart(localTime) {
    this.sound.jump(localTime, this.duration - localTime);
  }

  onEnd() {
    this.sound.stop();
  }
}


// =============================================================================
// BAGIAN 5: SISTEM EFEK SEDERHANA
// Cara mudah untuk menambahkan keyframe umum ke klip.
// =============================================================================
class BaseEffect {
  constructor(duration) {
    this.duration = duration;
  }
  applyTo(clip) {
    console.error("Metode applyTo() harus diimplementasikan oleh subclass efek.");
  }
}

class FadeInEffect extends BaseEffect {
  constructor(duration = 1.0) {
    super(duration);
  }
  applyTo(clip) {
    clip.addKeyframe(0, { opacity: 0 });
    clip.addKeyframe(this.duration, { opacity: 255 });
  }
}

class FadeOutEffect extends BaseEffect {
  constructor(duration = 1.0) {
    super(duration);
  }
  applyTo(clip) {
    const startTime = clip.duration - this.duration;
    clip.addKeyframe(startTime, { opacity: 255 });
    clip.addKeyframe(clip.duration, { opacity: 0 });
  }
}

class MoveEffect extends BaseEffect {
  constructor(startX, startY, endX, endY, duration, easing = Easing.easeInOutQuad) {
    super(duration);
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.easing = easing;
  }
  applyTo(clip) {
      clip.addKeyframe(0, { x: this.startX, y: this.startY });
      clip.addKeyframe(this.duration, { x: this.endX, y: this.endY }, this.easing);
  }
}

