# 🤖 A-S Bot WA

![Version](https://img.shields.io/badge/version-1.2.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Library](https://img.shields.io/badge/Baileys-WhatsApp%20Web%20API-brightgreen)

**A-S Bot WA** adalah bot WhatsApp utilitas dan otomasi privat berbasis Node.js menggunakan `@whiskeysockets/baileys`. Dirancang ringan dalam satu file (`index.js`) dengan penyimpanan data lokal JSON, autentikasi menggunakan *Pairing Code*, serta berbagai alat bantu harian tanpa bergantung pada banyak library eksternal.

---

## ✨ Fitur Utama

- **Privat & Aman (Owner-Only):** Hanya merespons perintah dari nomor pemilik yang terdaftar.
- **Login via Pairing Code:** Masuk ke akun WhatsApp langsung dari terminal menggunakan kode pairing 8 digit tanpa perlu memindai QR Code.
- **Auto Responder Persisten:** Tambah, ubah, hapus, dan simpan daftar balasan otomatis secara permanen ke dalam `auto_response.json`.
- **Pintasan Perintah Angka (`Number Command`):** Jalankan perintah cukup dengan mengetik nomor urutnya (`/1` hingga `/19`) beserta argumen tambahan.
- **Kalkulator Angka & Kata:** Mendukung operasi matematika standar (`+`, `-`, `*`, `:`) maupun penulisan angka dalam Bahasa Indonesia (contoh: `satu tambah satu`).
- **Konverter Satuan & Mata Uang:** Mendukung konversi panjang, berat, suhu, waktu, volume, luas, ukuran data, kecepatan, serta kurs mata uang *real-time*.
- **Peringkas & Penerjemah Teks:** Meringkas pesan panjang (minimal 5 baris) secara ekstraktif dan menerjemahkan berbagai bahasa ke Bahasa Indonesia.

## 🚀 Instalasi & Jalankan

Salin dan tempel perintah berikut ke Termux atau Terminal:

```bash
git clone https://github.com/alanmaulana-starvoid/A-S-WA-BOT.git && cd A-S-WA-BOT && npm install && npm start
```
