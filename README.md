# Timekeeper Countdown Bengkel

Aplikasi countdown timer sederhana untuk aktivitas bengkel, dibangun dengan Next.js 14+ (App Router) + TypeScript + Tailwind CSS.

## Deskripsi

Aplikasi ini membantu disiplin waktu kerja di workshop dengan countdown timer yang dapat dikonfigurasi untuk berbagai jenis aktivitas (Loading, Repair, Inspection, Ready, dll). Fitur utama termasuk:

- Countdown timer dengan state machine (idle → arming → running → paused → finished/aborted)
- Alert suara pada berbagai event (start, warning, finish, abort)
- Pencatatan sesi ke localStorage
- Persist state untuk recovery setelah refresh
- UI mobile-friendly

## Struktur Folder

```
test-timekeeper/
├── app/
│   ├── globals.css          # Global styles dengan Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Entry point (homepage)
├── components/
│   └── Timekeeper.tsx       # Komponen utama timekeeper
├── hooks/
│   └── useCountdownTimekeeper.ts  # Custom hook dengan state machine
├── utils/
│   ├── audio.ts             # Web Audio API utilities
│   └── storage.ts           # localStorage helpers
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Tech Stack

- **Next.js 14+** dengan App Router
- **TypeScript**
- **Tailwind CSS** untuk styling
- **Web Audio API** untuk alert suara
- **localStorage** untuk persist data

## Cara Menjalankan

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

### 3. Build untuk Production

```bash
npm run build
npm start
```

## State Machine

Aplikasi menggunakan state machine dengan alur berikut:

```
idle → arming → running → paused → finished
                ↓           ↓
              aborted    aborted
```

- **idle**: Belum ada sesi berjalan
- **arming**: Countdown persiapan (3..2..1) sebelum running
- **running**: Countdown utama berjalan
- **paused**: Countdown berhenti sementara
- **finished**: Countdown mencapai 0
- **aborted**: User stop manual sebelum selesai

## Fitur Utama

### 1. Konfigurasi Sesi

- Dropdown "Activity Type" (Loading, Repair, Inspection, Ready, Non-downtime, Downtime)
- Input durasi target (menit dan detik)
- Opsi "Warning Threshold" (default 2 menit)

### 2. Countdown & Kontrol

- **Arming (3 detik)**: Countdown 3..2..1 sebelum running
- **Running**: Timer utama dengan kontrol Pause, Resume, Stop
- **Warning**: Bunyi peringatan saat remaining <= threshold
- **Finished**: Bunyi alarm saat waktu habis
- **Aborted**: Bunyi tone rendah saat stop manual

### 3. Audio Alerts

- **Arming**: 1x beep saat masuk arming
- **Start Running**: 2x beep saat transisi arming → running
- **Warning**: 3x beep pendek saat remaining <= threshold
- **Finish**: 5x beep panjang saat waktu habis
- **Abort**: 1x tone rendah saat stop manual

**Catatan**: Audio memerlukan interaksi user terlebih dahulu. Klik tombol "Enable Sound" untuk mengaktifkan audio.

### 4. Pencatatan Sesi

Setiap sesi disimpan ke localStorage dengan informasi:
- ID sesi
- Jenis aktivitas
- Durasi target
- Waktu mulai dan selesai
- Status (finished/aborted)
- Durasi efektif

Riwayat 10 sesi terakhir ditampilkan di bawah timer.

### 5. Persist State

State aktif disimpan ke localStorage, sehingga:
- Timer dapat dilanjutkan setelah refresh halaman
- Data tidak hilang jika browser ditutup secara tidak sengaja

## Checklist Uji Manual

### 1. Arming (3 Detik Countdown)

- [ ] Klik "Start Session"
- [ ] Tampil countdown 3..2..1 (jika audio enabled, bunyi 1x saat mulai arming)
- [ ] Setelah 3 detik, transisi ke running (jika audio enabled, bunyi 2x)
- [ ] Timer mulai berjalan

### 2. Warning Threshold

- [ ] Set warning threshold ke 2 menit
- [ ] Set target durasi 5 menit
- [ ] Start session dan tunggu hingga tersisa 2 menit
- [ ] Badge "Warning" muncul (jika audio enabled, bunyi 3x)
- [ ] Warning hanya terjadi sekali per sesi

### 3. Finish (Waktu Habis)

- [ ] Set target durasi pendek (mis. 10 detik) untuk uji cepat
- [ ] Start session dan tunggu hingga timer mencapai 0
- [ ] State berubah ke "finished"
- [ ] Timer menampilkan 00:00 (jika audio enabled, bunyi alarm 5x)
- [ ] Sesi tersimpan di history dengan status "finished"
- [ ] Tombol "Reset" muncul

### 4. Abort (Stop Manual)

- [ ] Start session
- [ ] Klik "Stop" saat running
- [ ] State berubah ke "aborted" (jika audio enabled, bunyi tone rendah)
- [ ] Sesi tersimpan di history dengan status "aborted"
- [ ] Tombol "Reset" muncul

### 5. Pause & Resume

- [ ] Start session
- [ ] Klik "Pause" → timer berhenti, state menjadi "paused"
- [ ] Klik "Resume" → timer lanjut dari sisa waktu
- [ ] Durasi pause tidak mempengaruhi remaining time

### 6. Refresh saat Running

- [ ] Start session dengan durasi panjang (mis. 10 menit)
- [ ] Tunggu beberapa detik
- [ ] Refresh halaman (F5 atau Ctrl+R)
- [ ] Timer resume dengan remaining time yang benar
- [ ] State tetap "running"

### 7. Mute/Unmute

- [ ] Klik "Enable Sound" jika belum diaktifkan
- [ ] Klik "Sound On" untuk mute → berubah menjadi "Muted"
- [ ] Start session → tidak ada bunyi
- [ ] Klik "Muted" untuk unmute → berubah menjadi "Sound On"
- [ ] Start session baru → bunyi bekerja kembali

### 8. History Sessions

- [ ] Selesaikan beberapa sesi (finished dan aborted)
- [ ] Riwayat 10 sesi terakhir muncul di bawah timer
- [ ] Tampilkan informasi: waktu, aktivitas, target, status, durasi
- [ ] Klik "Clear History" → semua riwayat hilang

### 9. Konfigurasi

- [ ] Pilih activity type dari dropdown
- [ ] Set menit dan detik
- [ ] Set warning threshold
- [ ] Konfigurasi hanya bisa diubah saat state "idle"

### 10. Mobile Friendly

- [ ] Buka di perangkat mobile atau resize browser ke ukuran mobile
- [ ] Layout responsif dan mudah digunakan
- [ ] Tombol cukup besar untuk touch interaction
- [ ] Timer display mudah dibaca

## Catatan Penting

1. **Audio Policy**: Browser modern memblokir autoplay audio. Klik "Enable Sound" terlebih dahulu sebelum menggunakan fitur audio.

2. **localStorage**: Data disimpan di browser localStorage. Jika cache dihapus, data akan hilang.

3. **Browser Compatibility**: Aplikasi menggunakan Web Audio API yang didukung browser modern (Chrome, Firefox, Safari, Edge).

4. **Timer Accuracy**: Timer menggunakan timestamp-based calculation untuk akurasi, bukan hanya interval countdown.

## Lisensi

Project ini dibuat untuk keperluan internal/demo.

## Pengembangan Lebih Lanjut

Ide fitur tambahan (tidak termasuk dalam scope saat ini):
- Export history ke CSV/JSON
- Multi-language support
- Custom audio files
- Statistics dan analytics
- Dark mode
- Multiple timers bersamaan