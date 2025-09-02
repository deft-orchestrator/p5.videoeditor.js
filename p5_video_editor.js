/*
 * P5.VIDEOEDITOR.JS
 * Sebuah library sederhana untuk membuat video berbasis kode di p5.js.
 * Konsepnya adalah menggunakan Timeline untuk mengatur berbagai 'Clip'.
 * Setiap 'Clip' tahu kapan harus mulai dan berapa lama durasinya.
 */

// =============================================================================
// CLASS UTAMA: Timeline
// Bertugas sebagai pengatur waktu dan perender semua klip.
// =============================================================================
class Timeline {
  constructor(frameRate = 60) {
    this.clips = [];
    this.currentTime = 0;
    this.isPlaying = true;
    this.frameRate = frameRate;
  }

  /**
   * Menambahkan sebuah klip ke dalam timeline.
   * @param {BaseClip} clip - Objek klip yang akan ditambahkan.
   */
  add(clip) {
    this.clips.push(clip);
    // Urutkan klip berdasarkan waktu mulainya untuk optimasi
    this.clips.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Fungsi utama yang harus dipanggil di dalam draw() p5.js.
   * Fungsi ini memperbarui waktu dan menggambar klip yang aktif.
   */
  update() {
    if (this.isPlaying) {
      this.currentTime += 1 / this.frameRate;
    }

    background(0); // Membersihkan kanvas di setiap frame

    // Menggambar semua klip yang seharusnya aktif pada currentTime
    for (const clip of this.clips) {
      const isClipActive =
        this.currentTime >= clip.startTime &&
        this.currentTime < clip.startTime + clip.duration;

      if (isClipActive) {
        // Menghitung waktu lokal klip (dari 0 hingga durasinya)
        const localTime = this.currentTime - clip.startTime;
        
        // Memanggil fungsi gambar dari klip tersebut
        clip.display(localTime);
      }
    }
  }

  // Kontrol pemutaran
  play() { this.isPlaying = true; }
  pause() { this.isPlaying = false; }
  seek(timeInSeconds) { this.currentTime = timeInSeconds; }
}

// =============================================================================
// CLASS DASAR: BaseClip
// Template untuk semua jenis klip. Semua klip lain akan mewarisi dari sini.
// =============================================================================
class BaseClip {
  constructor(startTime, duration) {
    if (new.target === BaseClip) {
      throw new TypeError("Tidak bisa membuat instance dari BaseClip secara langsung.");
    }
    this.startTime = startTime; // Dalam detik
    this.duration = duration;   // Dalam detik
  }

  /**
   * Fungsi ini akan di-override oleh setiap jenis klip.
   * @param {number} localTime - Waktu saat ini di dalam klip (0 s.d. durasi).
   */
  display(localTime) {
    console.error("Fungsi display() harus diimplementasikan oleh subclass.");
  }
}

// =============================================================================
// CONTOH JENIS KLIP
// =============================================================================

/**
 * Klip untuk menampilkan teks dengan animasi sederhana.
 */
class TextClip extends BaseClip {
  constructor(text, startTime, duration, options = {}) {
    super(startTime, duration);
    this.text = text;
    // Opsi default
    this.options = {
      x: width / 2,
      y: height / 2,
      size: 48,
      color: 'white',
      align: CENTER,
      ...options,
    };
  }

  display(localTime) {
    // Contoh animasi: Fade in di awal dan fade out di akhir
    let opacity = 255;
    if (localTime < 1.0) { // Fade in selama 1 detik
      opacity = map(localTime, 0, 1, 0, 255);
    } else if (localTime > this.duration - 1.0) { // Fade out selama 1 detik
      opacity = map(localTime, this.duration - 1, this.duration, 255, 0);
    }

    push(); // Menyimpan pengaturan gambar saat ini
    fill(this.options.color, opacity);
    textAlign(this.options.align, CENTER);
    textSize(this.options.size);
    text(this.text, this.options.x, this.options.y);
    pop(); // Mengembalikan pengaturan gambar
  }
}

/**
 * Klip untuk menampilkan bentuk dasar p5.js (rect, ellipse).
 */
class ShapeClip extends BaseClip {
  constructor(shapeType, startTime, duration, options = {}) {
    super(startTime, duration);
    this.shapeType = shapeType; // 'rect' atau 'ellipse'
    this.options = {
      x: width / 2,
      y: height / 2,
      w: 100,
      h: 100,
      color: 'red',
      stroke: false,
      ...options,
    };
  }

  display(localTime) {
    // Contoh animasi: Bergerak dari kiri ke kanan
    const startX = -this.options.w;
    const endX = width + this.options.w;
    const currentX = map(localTime, 0, this.duration, startX, endX);

    push();
    if (this.options.stroke) {
      stroke(this.options.stroke);
    } else {
      noStroke();
    }
    fill(this.options.color);
    rectMode(CENTER);

    if (this.shapeType === 'rect') {
      rect(currentX, this.options.y, this.options.w, this.options.h);
    } else if (this.shapeType === 'ellipse') {
      ellipse(currentX, this.options.y, this.options.w, this.options.h);
    }
    pop();
  }
}


/**
 * Klip untuk menampilkan gambar.
 */
class ImageClip extends BaseClip {
    constructor(img, startTime, duration, options = {}) {
        super(startTime, duration);
        this.img = img;
        this.options = {
            x: 0,
            y: 0,
            w: width,
            h: height,
            ...options
        };
    }

    display(localTime) {
        // Contoh animasi: Zoom in perlahan
        const scaleFactor = map(localTime, 0, this.duration, 1, 1.1);
        const newW = this.options.w * scaleFactor;
        const newH = this.options.h * scaleFactor;
        const newX = this.options.x - (newW - this.options.w) / 2;
        const newY = this.options.y - (newH - this.options.h) / 2;
        
        push();
        imageMode(CORNER);
        image(this.img, newX, newY, newW, newH);
        pop();
    }
}
