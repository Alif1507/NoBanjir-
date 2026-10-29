# Sambungkan prototipe ESP32 ke Vercel

Aplikasi: `https://nobanjirtandaseru.vercel.app`

Perangkat `ESP32-NB-001` sudah terdaftar dan aktif di proyek Supabase
`cdjwcogjstcqaltfhhle`. Kalibrasi kontainer: sensor-ke-dasar 20 cm, tinggi air terpantau maksimum
18 cm, ambang Waspada/Siaga/Bahaya 5/10/15 cm. Ini konfigurasi
demonstrasi prototipe. Pengiriman fisik sudah dikonfirmasi dengan HTTP 201.

File lokal `firmware/esp32/NoBanjir/secrets.h` sudah disiapkan dengan URL
`https://nobanjirtandaseru.vercel.app/api/iot/readings`, kode dan token perangkat,
serta sertifikat publik GTS Root R1 dari CA bundle tepercaya bawaan Node.js.
Nilai Wi-Fi yang sudah diisi dipertahankan dan `kUploadEnabled` sudah `true`.
Header dan file token di `provisioned-devices/` diabaikan Git.
Jangan menjalankan provisioning ulang untuk kode perangkat yang sama.

Koneksi TLS dan HTTP ke domain deployment belum dapat diperiksa dari lingkungan
agen karena akses socket langsung ditolak. Validasi host HTTPS tetap aktif di
ESP32 dan harus dikonfirmasi melalui pengiriman fisik berikut.

Browser pengguna mengonfirmasi penerbit domain `*.vercel.app` adalah Google
Trust Services WR1. [Rantai WR1 menuju GTS Root R1](https://pki.goog/updates/march2025-alternate-chains.html).
Konfigurasi ISRG sebelumnya menghasilkan `tls_code=-9984` karena root CA tidak
sesuai. Root sekarang diperbarui tanpa mematikan verifikasi hostname/TLS.
Untuk menerapkan ulang hanya CA pada `secrets.h` lokal, jalankan dari root proyek:

```powershell
node firmware/esp32/tools/configure_vercel_ca.mjs
```

Script mencocokkan fingerprint SHA-256 root dengan
[repository resmi Google](https://pki.goog/repository/), memeriksa tanda tangan
dan masa berlaku root, serta mempertahankan Wi-Fi, token, dan URL. Upload ulang
sketch setelah perubahan; koneksi fisik baru terverifikasi bila hasilnya `201`.

1. Pastikan environment Production di Vercel berisi
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan
   `SUPABASE_SECRET_KEY` yang sesuai proyek ini. Jika mengubah environment,
   redeploy aplikasi. Server secret hanya disimpan di server Vercel.
2. Buka `firmware/esp32/NoBanjir/NoBanjir.ino` di Arduino IDE, pilih ESP32 Dev
   Module dan port COM board, lalu Verify dan Upload.
3. Buka Serial Monitor **115200 baud**, tekan EN jika perlu. Perangkat
   menyambung Wi-Fi 2,4 GHz, menyinkronkan jam UTC, lalu mengirim lewat HTTPS.
4. Cari `[wifi] connected` dan `[https] result=201`. Pembacaan sensor tetap
   dicetak meskipun jaringan belum siap.
5. Buka `https://nobanjirtandaseru.vercel.app/dashboard` tanpa `?demo=1`.
   Pilih **Prototipe Kontainer 20 cm** jika ada beberapa titik. Gerakkan
   permukaan target/air dan tunggu pengiriman berikutnya, sekitar 15 detik.

## Jika data belum tampil

| Hasil | Pemeriksaan |
| --- | --- |
| `Serial-only bench mode` | Pastikan sketch memakai `secrets.h` terbaru dan `kUploadEnabled = true`. |
| Wi-Fi timeout | Nama/password, jaringan 2,4 GHz, jangkauan dan captive portal. |
| Menunggu UTC | Akses NTP/DNS dari jaringan Wi-Fi. |
| Hasil HTTP negatif | Koneksi internet, DNS, jam dan verifikasi TLS/sertifikat. |
| `401` / `403` | Token/kode perangkat, status aktif perangkat, dan deployment protection yang menghalangi akses ESP32. |
| `404` | Deployment harus memuat route Next.js `/api/iot/readings`. |
| `503` | Periksa environment dan log server Vercel untuk koneksi Supabase. |
| `201`, tetapi UI belum berubah | Gunakan dashboard live, titik perangkat yang benar, dan tunggu pembaruan. |

`https://nobanjirtandaseru.vercel.app/api/devices` dapat dibuka dari browser untuk
memeriksa bahwa server Vercel dapat membaca perangkat aktif dari Supabase.

Prototipe tidak memakai float switch; `float_switch_critical: null` valid.
Diagnosis pelat rain tetap memakai baris `[rain]` di Serial Monitor.
