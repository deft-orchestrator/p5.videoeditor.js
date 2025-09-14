# Panduan Plugin p5.videoeditor.js

Selamat datang di panduan pembuatan plugin untuk `p5.videoeditor.js`! Sistem plugin dirancang untuk memungkinkan Anda memperluas fungsionalitas editor tanpa harus mengubah kode inti. Anda dapat menambahkan efek, transisi, atau bahkan tipe klip baru dengan mudah.

## Filosofi Sistem Plugin

Sistem plugin ada untuk menjaga agar kode inti tetap ramping dan stabil sambil memberikan fleksibilitas tanpa batas. Dengan membuat fitur sebagai plugin, kita dapat:

- **Menambahkan fungsionalitas baru** tanpa risiko merusak fitur yang sudah ada.
- **Berbagi dan menggunakan kembali** fitur di berbagai proyek.
- **Menjaga kode tetap terorganisir** dan mudah dikelola.

---

## Struktur Dasar Plugin

Setiap plugin adalah objek JavaScript sederhana yang diekspor dari sebuah file. Objek ini harus memiliki tiga properti wajib:

- `name` (String): Nama unik untuk plugin Anda (misalnya, `'MyAwesomeEffect'`).
- `type` (String): Jenis plugin. Saat ini, yang didukung adalah `'effect'` dan `'transition'`.
- `onLoad` (Function): Sebuah fungsi yang dipanggil saat editor dimuat. Fungsi ini menerima instance `timeline` sebagai argumen, memungkinkan plugin Anda untuk mendaftarkan dirinya ke sistem.

**Contoh Struktur Plugin:**

```javascript
// src/plugins/MyAwesomeEffectPlugin.js

// 1. Definisikan logika inti Anda (misalnya, kelas efek)
class MyAwesomeEffect {
  // ... implementasi efek ...
}

// 2. Buat dan ekspor objek plugin
export const MyAwesomeEffectPlugin = {
  name: 'MyAwesomeEffect',
  type: 'effect',
  onLoad: (timeline) => {
    // 3. Daftarkan fitur Anda ke timeline
    timeline.registerEffectType('awesome', MyAwesomeEffect);
  },
};
```

---

## Cara Menggunakan Plugin

Untuk menggunakan plugin, cukup impor objek plugin dan daftarkan ke instance `VideoEditor` (atau `Timeline`) Anda menggunakan metode `.use()`.

```javascript
import { VideoEditor, TextClip } from '../src/p5.videoeditor.js';
import { MyAwesomeEffectPlugin } from '../src/plugins/MyAwesomeEffectPlugin.js';

// ...
const editor = new VideoEditor(p, options);

// Daftarkan plugin Anda
editor.timeline.use(MyAwesomeEffectPlugin);

// Sekarang Anda dapat menggunakan efek 'awesome' di klip Anda
const myClip = new TextClip(...);
myClip.addEffect({ type: 'awesome', ... });
```

---

## Tutorial: Membuat Plugin Efek Baru

Mari kita buat efek `Greyscale` sederhana yang mengubah klip menjadi hitam putih.

### Langkah 1: Buat Kelas Efek

Efek harus mewarisi dari `EffectBase`. Untuk efek berbasis CPU, Anda perlu mengimplementasikan metode `apply(p, clip)`. Untuk efek berbasis GPU (shader), Anda perlu menyediakan sumber shader. Mari kita fokus pada efek CPU untuk saat ini.

```javascript
// src/effects/EffectBase.js (Untuk Referensi)
class EffectBase {
  // ...
}
```

Sekarang, buat kelas efek kustom Anda:

```javascript
// src/plugins/GreyscaleEffectPlugin.js

import EffectBase from '../effects/EffectBase.js';

class GreyscaleEffect extends EffectBase {
  apply(p, clip) {
    // Efek ini adalah efek shader, jadi metode apply() tidak melakukan apa-apa di CPU.
    // Sebaliknya, kita akan mendefinisikan shader.
  }

  // Definisikan shader GLSL Anda di sini
  get shader() {
    return `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D uTexture;

      void main() {
        vec4 color = texture2D(uTexture, vTexCoord);
        float grey = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(vec3(grey), color.a);
      }
    `;
  }
}
```

### Langkah 2: Bungkus dalam Objek Plugin

Sekarang, bungkus kelas `GreyscaleEffect` Anda dalam objek plugin dan ekspor.

```javascript
// src/plugins/GreyscaleEffectPlugin.js (Lanjutan)

export const GreyscaleEffectPlugin = {
  name: 'GreyscaleEffect',
  type: 'effect',
  onLoad: (timeline) => {
    timeline.registerEffectType('greyscale', GreyscaleEffect);
  },
};
```

Selesai! Plugin Anda sekarang siap digunakan.

---

## Tutorial: Membuat Plugin Transisi Baru

Sekarang, mari kita buat transisi `SlideIn` sederhana di mana klip baru masuk dari kanan.

### Langkah 1: Buat Kelas Transisi

Transisi harus mewarisi dari `TransitionBase`. Anda perlu mengimplementasikan metode `render(p, time)`.

```javascript
// src/transitions/TransitionBase.js (Untuk Referensi)
class TransitionBase {
  // ...
  getProgress(time) {
    // ... helper untuk mendapatkan progres transisi (0.0 hingga 1.0)
  }
}
```

Buat kelas transisi kustom Anda:

```javascript
// src/plugins/SlideInTransitionPlugin.js

import TransitionBase from '../transitions/TransitionBase.js';

class SlideInTransition extends TransitionBase {
  render(p, time) {
    const progress = this.getProgress(time);

    // Render klip yang keluar seperti biasa
    this.fromClip.render(p, time - this.fromClip.start);

    // Hitung posisi x untuk klip yang masuk
    const startX = p.width;
    const endX = this.toClip.initialProperties.x;
    const currentX = p.lerp(startX, endX, progress);

    // Simpan posisi asli, terapkan posisi transisi, render, lalu kembalikan
    const originalX = this.toClip.properties.x;
    try {
      this.toClip.properties.x = currentX;
      this.toClip.render(p, time - this.toClip.start);
    } finally {
      this.toClip.properties.x = originalX;
    }
  }
}
```

### Langkah 2: Bungkus dalam Objek Plugin

Sama seperti efek, bungkus transisi Anda dalam objek plugin.

```javascript
// src/plugins/SlideInTransitionPlugin.js (Lanjutan)

export const SlideInTransitionPlugin = {
  name: 'SlideInTransition',
  type: 'transition',
  onLoad: (timeline) => {
    timeline.registerTransitionType('slideIn', SlideInTransition);
  },
};
```

Dan begitulah cara membuat transisi kustom Anda sendiri!
