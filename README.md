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
git clone https://github.com/alanmaulana-starvoid/A-S_Bot_WA.git && cd A-S_Bot_WA && npm install && npm start
```
Kamu bisa mengecek semua command dengan /A-S Guide di suatu chat.
## Cara Mematikan & Menjalankan Kembali jika sudah berhasil

CTRL + C Jika anda ingin mematikan bot

Lalu Copy paste kode di bawah untuk menyalakan kembali

```bash
npm start
```

Jika anda keluar dari Termux atau terminal dan kembali ke tampilan awal masuk ke folder A-S-WA-BOT terlebih dahulu dengan cara Copy paste kode bash di bawah.

```bash
cd A-S_Bot_WA
```
