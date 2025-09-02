/*
 * P5.VIDEOEDITOR.JS (v2.5)
 * Sebuah framework canggih untuk membuat video berbasis kode di p5.js.
 *
 * * FITUR BARU (v2.5):
 * 1. Penambahan Fungsi Easing: Menambahkan fungsi easing Expo, Back, Elastic,
 * dan Bounce untuk animasi yang lebih ekspresif dan dinamis.
 * 2. Konsistensi ImageClip: ImageClip kini mendukung properti `tintColor` yang
 * dapat dianimasikan, membuatnya konsisten dengan klip visual lainnya.
 *
 * * FITUR SEBELUMNYA (v2.4):
 * - Transform Origin: Dukungan properti `originX` dan `originY`.
 * - Metode seek() yang Ditingkatkan: Pembaruan state visual instan.
 * - Penanganan Warna yang Lebih Baik: Penggunaan `color.setAlpha()`.
 */

// =============================================================================
// BAGIAN 1: EASING FUNCTIONS
// =============================================================================

/**
 * Kumpulan fungsi easing untuk membuat animasi terasa lebih natural dan profesional.
 * Berdasarkan formula dari easings.net
 * @namespace Easing
 */
const Easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  easeInBack: t => { const c1 = 1.70158; const c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  easeOutBack: t => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  easeInOutBack: t => { const c1 = 1.70158; const c2 = c1 * 1.525; return t < 0.5 ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2; },
  easeInElastic: t => { const c4 = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4); },
  easeOutElastic: t => { const c4 = (2 * Math.PI) / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; },
  easeInOutElastic: t => { const c5 = (2 * Math.PI) / 4.5; return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2 : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1; },
  easeOutBounce: t => { const n1 = 7.5625; const d1 = 2.75; if (t < 1 / d1) { return n1 * t * t; } else if (t < 2 / d1) { return n1 * (t -= 1.5 / d1) * t + 0.75; } else if (t < 2.5 / d1) { return n1 * (t -= 2.25 / d1) * t + 0.9375; } else { return n1 * (t -= 2.625 / d1) * t + 0.984375; } },
};


// =============================================================================
// BAGIAN 2: CLASS UTAMA - TIMELINE
// =============================================================================

/**
 * Mengelola semua klip, waktu, dan siklus hidup (lifecycle) pemutaran video.
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
   * Melompat ke waktu tertentu dan secara opsional memperbarui state klip dengan segera.
   * @param {number} timeInSeconds - Waktu tujuan dalam detik.
   * @param {boolean} [forceUpdate=true] - Jika true, akan segera menghitung ulang dan menerapkan properti klip.
   */
  seek(timeInSeconds, forceUpdate = true) {
    this.currentTime = timeInSeconds;
    this.lastTime = millis(); // Reset lastTime untuk mencegah lonjakan deltaTime

    if (forceUpdate) {
        // Hentikan semua audio yang mungkin sedang diputar
        for (const clip of this.activeClips) {
            if (clip instanceof AudioClip) {
                clip.sound.stop();
            }
        }
        this.activeClips.clear(); // Kosongkan klip aktif

        // Panggil update secara manual untuk mengatur ulang state
        // dengan isPlaying = false agar currentTime tidak bertambah lagi
        const wasPlaying = this.isPlaying;
        this.isPlaying = false; 
        this.update(); // Jalankan satu siklus update untuk menyinkronkan state
        this.isPlaying = wasPlaying;
    }
  }
}


// =============================================================================
// BAGIAN 3: CLASS DASAR - BASECLIP
// =============================================================================

/**
 * Class dasar abstrak untuk semua jenis klip.
 * @class BaseClip
 */
class BaseClip {
  /**
   * @param {number} startTime - Waktu mulai klip dalam detik.
   * @param {number} duration - Durasi klip dalam detik.
   * @param {object} [options={}] - Opsi tambahan untuk klip.
   * @param {boolean} [options.resetOnEnd=false] - Jika true, properti akan direset ke nilai awal setelah klip selesai.
   */
  constructor(startTime, duration, options = {}) {
    this.startTime = startTime;
    this.duration = duration;
    this.keyframes = [];
    this.props = {};
    this.effects = [];
    this.resetOnEnd = options.resetOnEnd || false;
    this.initialProps = {}; // Akan diisi oleh subclass
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
  
  /** * Dipanggil sekali saat klip berhenti menjadi aktif.
   * Mereset properti jika `resetOnEnd` bernilai true.
   */
  onEnd() {
    if (this.resetOnEnd) {
      this.props = { ...this.initialProps };
    }
  }

  /**
   * Menambahkan sebuah keyframe untuk menganimasikan properti.
   * @param {number} time - Waktu keyframe di dalam durasi klip (dalam detik).
   * @param {object} properties - Objek berisi properti dan nilainya.
   * @param {function} [easing=Easing.linear] - Fungsi easing yang akan digunakan.
   */
  addKeyframe(time, properties, easing = Easing.linear) {
    this.keyframes.push({ time, properties, easing });
    this.keyframes.sort((a, b) => a.time - b.time);
  }
  
  /**
   * Menerapkan efek siap pakai ke klip.
   * @param {BaseEffect} effect - Instance dari sebuah efek.
   */
  addEffect(effect) {
    this.effects.push(effect);
    effect.applyTo(this);
  }

  /**
   * @private
   * Menginterpolasi nilai antara dua keyframe berdasarkan tipe datanya.
   */
  _interpolateValue(startVal, endVal, progress) {
    // 1. Interpolasi Angka
    if (typeof startVal === 'number' && typeof endVal === 'number') {
        return lerp(startVal, endVal, progress);
    }

    // 2. Interpolasi Warna (Fleksibel: p5.Color dan string)
    const isStartColor = startVal instanceof p5.Color || typeof startVal === 'string';
    const isEndColor = endVal instanceof p5.Color || typeof endVal === 'string';
    if (isStartColor && isEndColor) {
        try {
            const sColor = (startVal instanceof p5.Color) ? startVal : color(startVal);
            const eColor = (endVal instanceof p5.Color) ? endVal : color(endVal);
            return lerpColor(sColor, eColor, progress);
        } catch (e) {
            console.warn(`[P5.VideoEditor] Gagal menginterpolasi warna. Format tidak valid.`);
            return startVal;
        }
    }
      
    // 3. Interpolasi p5.Vector
    if (startVal instanceof p5.Vector && endVal instanceof p5.Vector) {
        return p5.Vector.lerp(startVal, endVal, progress);
    }

    // 4. Validasi Tipe Data
    if (typeof startVal !== typeof endVal) {
        console.warn(`[P5.VideoEditor] Tipe data keyframe tidak cocok. Animasi dihentikan.`);
        return startVal;
    }

    // Default
    return startVal;
  }
  
  /**
   * @private
   * Memperbarui nilai properti (this.props) berdasarkan keyframe.
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

/** @class VisualClip Class dasar untuk semua klip yang dapat digambar. Menangani transformasi dan rendering. */
class VisualClip extends BaseClip {
  constructor(startTime, duration, options) {
    super(startTime, duration, options);
    this.props = { opacity: 255, rotation: 0, scale: 1, originX: 0, originY: 0, ...options };
    this.initialProps = { ...this.props }; // Simpan state awal untuk reset
  }
  onUpdate(localTime) {
    this._updateProperties(localTime);
    push();
    translate(this.props.x, this.props.y);
    
    // Terapkan transformasi dengan titik pusat (origin)
    translate(this.props.originX, this.props.originY);
    rotate(this.props.rotation);
    scale(this.props.scale);
    translate(-this.props.originX, -this.props.originY);

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
    const finalColor = color(this.props.color);
    finalColor.setAlpha(this.props.opacity);
    
    fill(finalColor);
    textAlign(this.props.align, CENTER);
    textSize(this.props.size);
    text(this.text, 0, 0); // Gambar di (0,0) karena translasi ditangani oleh VisualClip
  }
}

/** @class ShapeClip Klip untuk menampilkan bentuk dasar p5.js. */
class ShapeClip extends VisualClip {
  constructor(shapeType, startTime, duration, options = {}) {
    const defaultOptions = { x: width / 2, y: height / 2, w: 100, h: 100, color: color('red'), stroke: false };
    super(startTime, duration, { ...defaultOptions, ...options });
    this.shapeType = shapeType;
  }
  display() {
    const finalColor = color(this.props.color);
    finalColor.setAlpha(this.props.opacity);
    fill(finalColor);

    if (this.props.stroke) { stroke(this.props.stroke); } else { noStroke(); }
    rectMode(CENTER);
    if (this.shapeType === 'rect') {
      rect(0, 0, this.props.w, this.props.h);
    } else if (this.shapeType === 'ellipse') {
      ellipse(0, 0, this.props.w, this.props.h);
    }
  }
}

/** @class ImageClip Klip untuk menampilkan gambar. */
class ImageClip extends VisualClip {
    constructor(img, startTime, duration, options = {}) {
        const defaultOptions = { x: width / 2, y: height / 2, w: img.width, h: img.height, tintColor: color(255) };
        super(startTime, duration, { ...defaultOptions, ...options });
        this.img = img;
    }
    display() {
        const finalTint = color(this.props.tintColor);
        finalTint.setAlpha(this.props.opacity);
        
        tint(finalTint);
        imageMode(CENTER);
        image(this.img, 0, 0, this.props.w, this.props.h);
    }
}

/** @class AudioClip Klip untuk memutar file audio. Membutuhkan p5.sound. */
class AudioClip extends BaseClip {
  constructor(soundFile, startTime, duration, options) {
    if (typeof p5.SoundFile === 'undefined') {
        throw new Error('[P5.VideoEditor] AudioClip membutuhkan library p5.sound. Harap muat p5.sound.js terlebih dahulu.');
    }
    super(startTime, duration || soundFile.duration(), options);
    this.sound = soundFile;
  }
  onStart(localTime) { this.sound.jump(localTime, this.duration - localTime); }
  onEnd() { this.sound.stop(); }
}


// =============================================================================
// BAGIAN 5: SISTEM EFEK
// =============================================================================

/** @class BaseEffect Class dasar abstrak untuk semua efek. */
class BaseEffect {
  constructor(duration) { this.duration = duration; }
  applyTo(clip) { console.error("Metode applyTo() harus diimplementasikan."); }
}

/** @class FadeInEffect Efek untuk membuat klip memudar masuk. */
class FadeInEffect extends BaseEffect {
  constructor(duration = 1.0) { super(duration); }
  applyTo(clip) {
    clip.addKeyframe(0, { opacity: 0 });
    clip.addKeyframe(this.duration, { opacity: 255 });
  }
}

/** @class FadeOutEffect Efek untuk membuat klip memudar keluar. */
class FadeOutEffect extends BaseEffect {
  constructor(duration = 1.0) { super(duration); }
  applyTo(clip) {
    const startTime = clip.duration - this.duration;
    clip.addKeyframe(startTime, { opacity: 255 });
    clip.addKeyframe(clip.duration, { opacity: 0 });
  }
}

/** @class MoveEffect Efek untuk menggerakkan klip. */
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

/** @class ScaleEffect Efek untuk mengubah skala klip. */
class ScaleEffect extends BaseEffect {
  constructor(startScale, endScale, duration, easing = Easing.easeInOutQuad) {
    super(duration);
    this.startScale = startScale;
    this.endScale = endScale;
    this.easing = easing;
  }
  applyTo(clip) {
      clip.addKeyframe(0, { scale: this.startScale });
      clip.addKeyframe(this.duration, { scale: this.endScale }, this.easing);
  }
}

/** @class RotateEffect Efek untuk memutar klip. */
class RotateEffect extends BaseEffect {
  constructor(startAngle, endAngle, duration, easing = Easing.easeInOutQuad) {
    super(duration);
    this.startAngle = startAngle; // dalam radian
    this.endAngle = endAngle; // dalam radian
    this.easing = easing;
  }
  applyTo(clip) {
      clip.addKeyframe(0, { rotation: this.startAngle });
      clip.addKeyframe(this.duration, { rotation: this.endAngle }, this.easing);
  }
}

