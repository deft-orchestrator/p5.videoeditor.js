/*
 * P5.VIDEOEDITOR.JS (v2.2)
 * Sebuah framework canggih untuk membuat video berbasis kode di p5.js.
 *
 * * FITUR BARU (v2.2):
 * 1. Refaktor Interpolasi: Logika interpolasi di `_updateProperties` diekstrak ke
 * fungsi helper `_interpolateValue` untuk keterbacaan dan ekstensibilitas.
 * 2. Pengecekan Dependensi: `AudioClip` kini akan memberikan error yang jelas jika
 * library p5.sound.js tidak dimuat.
 *
 * * FITUR SEBELUMNYA (v2.1):
 * - Dokumentasi API (JSDoc): Semua class dan metode didokumentasikan.
 * - Interpolasi Warna Fleksibel: Keyframe kini mendukung string warna.
 * - Validasi Properti: Memberikan peringatan jika tipe data di keyframe tidak cocok.
 */

// =============================================================================
// BAGIAN 1: EASING FUNCTIONS
// =============================================================================

/**
 * Kumpulan fungsi easing untuk membuat animasi terasa lebih natural dan profesional.
 * @namespace Easing
 * @property {function} linear - Transisi linear tanpa percepatan.
 * @property {function} easeInQuad - Mempercepat dari nol.
 * @property {function} easeOutQuad - Melambat hingga berhenti.
 * @property {function} easeInOutQuad - Percepatan di awal dan perlambatan di akhir.
 * @property {function} easeInCubic - Mempercepat dari nol (lebih tajam dari Quad).
 * @property {function} easeOutCubic - Melambat hingga berhenti (lebih tajam dari Quad).
 * @property {function} easeInOutCubic - Percepatan dan perlambatan (lebih tajam dari Quad).
 */
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
// =============================================================================

/**
 * Mengelola semua klip, waktu, dan siklus hidup (lifecycle) pemutaran video.
 * Ini adalah orkestrator utama dari library.
 * @class Timeline
 */
class Timeline {
  /**
   * @param {number} [frameRate=60] - Target frame rate untuk konsistensi.
   */
  constructor(frameRate = 60) {
    this.clips = [];
    this.currentTime = 0;
    this.isPlaying = true;
    this.frameRate = frameRate;
    this.lastTime = 0;
    this.activeClips = new Set();
  }

  /**
   * Menambahkan sebuah klip ke dalam timeline.
   * @param {BaseClip} clip - Objek klip yang akan ditambahkan.
   */
  add(clip) {
    this.clips.push(clip);
    this.clips.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Fungsi inti yang harus dipanggil di dalam loop draw() p5.js.
   * Memperbarui waktu dan merender semua klip yang aktif.
   */
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
          clip.onStart(localTime);
        }
        clip.onUpdate(localTime);
      }
    }

    for (const clip of this.activeClips) {
      if (!currentActiveClips.has(clip)) {
        clip.onEnd();
      }
    }

    this.activeClips = currentActiveClips;
  }

  /** Memulai atau melanjutkan pemutaran timeline. */
  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastTime = millis();
    }
  }
  
  /** Menjeda pemutaran timeline. */
  pause() { this.isPlaying = false; }

  /**
   * Melompat ke waktu tertentu di dalam timeline.
   * @param {number} timeInSeconds - Waktu tujuan dalam detik.
   */
  seek(timeInSeconds) { this.currentTime = timeInSeconds; }
}


// =============================================================================
// BAGIAN 3: CLASS DASAR - BASECLIP
// =============================================================================

/**
 * Class dasar abstrak untuk semua jenis klip.
 * Menyediakan fungsionalitas inti seperti waktu, event, keyframing, dan efek.
 * @class BaseClip
 */
class BaseClip {
  /**
   * @param {number} startTime - Waktu mulai klip dalam detik.
   * @param {number} duration - Durasi klip dalam detik.
   */
  constructor(startTime, duration) {
    this.startTime = startTime;
    this.duration = duration;
    this.keyframes = [];
    this.props = {};
    this.effects = [];
  }
  
  /**
   * Dipanggil sekali saat klip pertama kali menjadi aktif.
   * @param {number} localTime - Waktu lokal saat klip dimulai.
   */
  onStart(localTime) {}
  
  /**
   * Dipanggil setiap frame selama klip aktif.
   * @param {number} localTime - Waktu saat ini di dalam klip (0 s.d. durasi).
   */
  onUpdate(localTime) {}
  
  /** Dipanggil sekali saat klip berhenti menjadi aktif. */
  onEnd() {}

  /**
   * Menambahkan sebuah keyframe untuk menganimasikan properti.
   * @param {number} time - Waktu keyframe di dalam durasi klip (dalam detik).
   * @param {object} properties - Objek berisi properti dan nilainya (mis. { x: 100, opacity: 255 }).
   * @param {function} [easing=Easing.linear] - Fungsi easing yang akan digunakan.
   */
  addKeyframe(time, properties, easing = Easing.linear) {
    this.keyframes.push({ time, properties, easing });
    this.keyframes.sort((a, b) => a.time - b.time);
  }
  
  /**
   * Menerapkan efek siap pakai ke klip.
   * @param {BaseEffect} effect - Instance dari sebuah efek (mis. new FadeInEffect()).
   */
  addEffect(effect) {
    this.effects.push(effect);
    effect.applyTo(this);
  }

  /**
   * @private
   * Menginterpolasi nilai antara dua keyframe berdasarkan tipe datanya.
   * @param {*} startVal - Nilai awal.
   * @param {*} endVal - Nilai akhir.
   * @param {number} progress - Progres interpolasi (0.0 s.d. 1.0).
   * @returns {*} Nilai yang telah diinterpolasi.
   */
  _interpolateValue(startVal, endVal, progress) {
    // 1. Interpolasi Angka
    if (typeof startVal === 'number' && typeof endVal === 'number') {
        return lerp(startVal, endVal, progress);
    }

    // 2. Interpolasi Warna
    const isStartColor = startVal instanceof p5.Color || typeof startVal === 'string';
    const isEndColor = endVal instanceof p5.Color || typeof endVal === 'string';
    if (isStartColor && isEndColor) {
        try {
            const sColor = (startVal instanceof p5.Color) ? startVal : color(startVal);
            const eColor = (endVal instanceof p5.Color) ? endVal : color(endVal);
            return lerpColor(sColor, eColor, progress);
        } catch (e) {
            console.warn(`[P5.VideoEditor] Gagal menginterpolasi warna. Format tidak valid.`);
            return startVal; // Kembali ke nilai awal jika gagal
        }
    }

    // 3. Validasi Tipe Data
    if (typeof startVal !== typeof endVal) {
        console.warn(`[P5.VideoEditor] Tipe data keyframe tidak cocok. Animasi dihentikan.`);
        return startVal;
    }

    // Default: jika tidak ada interpolasi yang cocok, kembalikan nilai awal
    return startVal;
  }
  
  /**
   * @private
   * Memperbarui nilai properti (this.props) berdasarkan keyframe pada waktu tertentu.
   * @param {number} localTime - Waktu saat ini di dalam klip.
   */
  _updateProperties(localTime) {
    if (this.keyframes.length === 0) return;

    let startFrame = this.keyframes.findLast(kf => kf.time <= localTime);
    let endFrame = this.keyframes.find(kf => kf.time > localTime);

    if (!startFrame) startFrame = endFrame;
    if (!endFrame) endFrame = startFrame;
    if (!startFrame) return;

    for (const key in startFrame.properties) {
      if (key in endFrame.properties) {
        const startTime = startFrame.time;
        const endTime = endFrame.time;
        
        if (startTime >= endTime) {
            this.props[key] = endFrame.properties[key];
            continue;
        }

        let progress = map(localTime, startTime, endTime, 0, 1, true);
        progress = startFrame.easing(progress);

        // Panggil fungsi helper yang sudah direfaktor
        this.props[key] = this._interpolateValue(
            startFrame.properties[key],
            endFrame.properties[key],
            progress
        );
      } else {
        this.props[key] = startFrame.properties[key];
      }
    }
  }
}


// =============================================================================
// BAGIAN 4: JENIS-JENIS KLIP
// =============================================================================

/** @class VisualClip Class dasar untuk semua klip yang dapat digambar. Menangani update properti dan rendering. */
class VisualClip extends BaseClip {
  constructor(startTime, duration, options) {
    super(startTime, duration);
    this.props = { opacity: 255, ...options };
  }
  onUpdate(localTime) {
    this._updateProperties(localTime);
    push();
    this.display(localTime);
    pop();
  }
  display(localTime) {}
}

/** @class TextClip Klip untuk menampilkan teks. */
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

/** @class ShapeClip Klip untuk menampilkan bentuk dasar p5.js (rect, ellipse). */
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
    } else { noStroke(); }
    rectMode(CENTER);
    if (this.shapeType === 'rect') {
      rect(this.props.x, this.props.y, this.props.w, this.props.h);
    } else if (this.shapeType === 'ellipse') {
      ellipse(this.props.x, this.props.y, this.props.w, this.props.h);
    }
  }
}

/** @class ImageClip Klip untuk menampilkan gambar. */
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
 * Klip untuk memutar file audio. Membutuhkan library p5.sound.
 * @class AudioClip
 */
class AudioClip extends BaseClip {
  constructor(soundFile, startTime, duration) {
    if (typeof p5.SoundFile === 'undefined') {
        throw new Error('[P5.VideoEditor] AudioClip membutuhkan library p5.sound. Harap muat p5.sound.js terlebih dahulu.');
    }
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
// BAGIAN 5: SISTEM EFEK
// =============================================================================

/** @class BaseEffect Class dasar abstrak untuk semua efek. */
class BaseEffect {
  constructor(duration) { this.duration = duration; }
  applyTo(clip) { console.error("Metode applyTo() harus diimplementasikan."); }
}

/** @class FadeInEffect Efek untuk membuat klip memudar masuk (fade in). */
class FadeInEffect extends BaseEffect {
  constructor(duration = 1.0) { super(duration); }
  applyTo(clip) {
    clip.addKeyframe(0, { opacity: 0 });
    clip.addKeyframe(this.duration, { opacity: 255 });
  }
}

/** @class FadeOutEffect Efek untuk membuat klip memudar keluar (fade out). */
class FadeOutEffect extends BaseEffect {
  constructor(duration = 1.0) { super(duration); }
  applyTo(clip) {
    const startTime = clip.duration - this.duration;
    clip.addKeyframe(startTime, { opacity: 255 });
    clip.addKeyframe(clip.duration, { opacity: 0 });
  }
}

/** @class MoveEffect Efek untuk menggerakkan klip dari satu titik ke titik lain. */
class MoveEffect extends BaseEffect {
  constructor(startX, startY, endX, endY, duration, easing = Easing.easeInOutQuad) {
    super(duration);
    this.startX = startX; this.startY = startY;
    this.endX = endX; this.endY = endY;
    this.easing = easing;
  }
  applyTo(clip) {
      clip.addKeyframe(0, { x: this.startX, y: this.startY });
      clip.addKeyframe(this.duration, { x: this.endX, y: this.endY }, this.easing);
  }
}

