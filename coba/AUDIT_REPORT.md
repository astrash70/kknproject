# LAPORAN AUDIT STORAGE & FIREBASE
## Proyek: Digital Report (coba)
### Tanggal Audit: 23 Juni 2026

---

## 1. localStorage

### 1.1 File: `akun.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 875 | `getItem` | `lastLogin_{id}` | String ISO timestamp login terakhir akun |
| 882 | `setItem` | `lastLogin_{id}` | Menyimpan timestamp saat login |
| 1048 | `setItem` | `multiAkunData` | Array of objects: `[{ id, nama, usaha, email, password, telepon }]` - data semua akun terdaftar |
| 1074 | `getItem` | `usahaProfileData` | JSON: `{ namaUsaha, jenisUsaha, alamat, telepon }` - profil usaha |
| 1090 | `setItem` | `usahaProfileData` | Menyimpan data profil usaha |
| 1231 | `setItem` | `multiAkunData` | Update data akun aktif setelah sinkronisasi profil |
| 1252-1253 | `length`, `key(i)` | Iterasi semua key | Cari key berawalan `laporan_` untuk cek status aktivitas |
| 1289 | `getItem` | `multiAkunData` | Baca daftar semua akun |
| 1292 | `getItem` | `akunAktif` | String ID akun yang sedang aktif (default: `'default'`) |
| 1310-1312 | `setItem` | `multiAkunData`, `akunAktif` | Inisialisasi default akun pertama |
| 1337 | `setItem` | `akunAktif` | Ganti akun aktif |
| 1382-1383 | `setItem` | `multiAkunData`, `akunAktif` | Simpan akun baru + set sebagai aktif |
| 1413 | `getItem` | `fotoProfil_{id}` | Data URL base64 foto profil (string panjang) |
| 1467 | `setItem` | `fotoProfil_{id}` | Simpan foto profil sebagai data URL |

### 1.2 File: `input.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 2800-2803 | `setItem` | `feeTotal` | Legacy: total fee sebagai string |
| 2845-2847 | `setItem` | `laporan_{YYYY-MM-DD}` | **LAPORAN HARIAN**: `{ cashPagi, saldoData[], transaksiData[], mutasiData[], feeFormula, feeTotal }` |
| 2887-2888 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca laporan untuk dihitung ulang |
| 3007 | `getItem` | `laporan_{YYYY-MM-DD}` | Cek apakah laporan hari ini sudah ada |
| 3010-3015 | `getItem` | `cashPagi`, `saldoData`, `transaksiData`, `mutasiData`, `feeFormula`, `feeTotal` | **LEGACY**: Data lama format flat sebelum migrasi |
| 3022-3041 | `getItem` | `cashPagi`, `saldoData`, `transaksiData`, `mutasiData`, `feeFormula`, `feeTotal` | Baca legacy untuk migrasi |
| 3055 | `removeItem` | `cashPagi`, `saldoData`, `transaksiData`, `mutasiData`, `feeFormula`, `feeTotal` | Hapus legacy setelah migrasi |
| 3128 | `getItem` | `laporan_{YYYY-MM-DD}` | Cek apakah laporan ada untuk navigasi tanggal |
| 3163 | (dibahas di sessionStorage) | - | - |
| 3189 | `getItem` | `laporan_{YYYY-MM-DD}` | Cek laporan sebelumnya untuk auto-fill |
| 3229-3230 | `length`, `key(i)` | Iterasi semua key | Cari laporan terakhir yang pernah dibuat |
| 3259 | `getItem` | `laporan_{YYYY-MM-DD}` | Validasi apakah sessionStorage valid |
| 3261 | (sessionStorage removeItem) | - | - |
| 3266 | `getItem` | (cari laporan terakhir via iterasi) | - |
| 3280 | (sessionStorage setItem) | - | - |
| 3344 | `getItem` | `jenisTransaksiData` | Array master jenis transaksi |
| 3581 | `getItem` | `feeTotal` | Baca total fee |
| 3694-3704 | `setItem` | `laporan_{YYYY-MM-DD}` | Update laporan setelah edit transaksi |
| 3849 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca laporan untuk ditampilkan |
| 3921 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca laporan untuk rekap |
| 4240 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca data untuk grafik |
| 4888 | `setItem` | `laporan_{YYYY-MM-DD}` | Update data mutasi |
| 5085 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca untuk export |
| 5349 | `getItem` | `rangeData` | Array data range saldo |
| 5388 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca untuk fitur duplikasi laporan |
| 5722 | `removeItem` | `laporan_{YYYY-MM-DD}` | Hapus transaksi individual dari laporan |
| 5752-5758 | `setItem` | `laporan_{YYYY-MM-DD}` | Update setelah edit fee |
| 6130 | `getItem` | `laporan_{YYYY-MM-DD}` + `_final_{...}` | Cek laporan final |
| 6139 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca laporan sebelumnya untuk finalisasi |
| 6159-6165 | `removeItem` | `laporan_{...}`, `_final_{...}`, `dashboard_total_aset_{...}`, `dashboard_cash_akhir_{...}`, `dashboard_saldo_akhir_{...}` | Hapus semua data terkait laporan saat dihapus |

### 1.3 File: `dashboard.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 1698 | `getItem` | `dashboard_total_aset_{YYYY-MM-DD}` | Total aset untuk hari tertentu |
| 1720-1721 | `getItem` | `dashboard_cash_akhir_{YYYY-MM-DD}`, `dashboard_saldo_akhir_{YYYY-MM-DD}` | Cash akhir dan saldo akhir |
| 1760-1765 | `length`, `key(i)`, `getItem` | Iterasi key `laporan_*` | Baca semua laporan untuk grafik |
| 1879 | `getItem` | `jenisTransaksiData` | Array master jenis transaksi |
| 1939 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca laporan untuk grafik |

### 1.4 File: `database.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 2641 | `getItem` | `rangeData` | Array data range saldo |
| 2716 | `getItem` | `rangeRemovedPerJenis` | JSON object of removed range items |
| 2774 | `setItem` | `rangeData` | Update data range |
| 2810 | `setItem` | `rangeRemovedPerJenis` | Update removed range items |
| 3826 | `getItem` | `jenisTransaksiData` | Array master jenis transaksi |
| 3993 | `setItem` | `jenisTransaksiData` | Update master jenis transaksi |
| 4055 | `getItem` | `databaseContent` | String konten database |
| 4143 | `removeItem` | (key dinamis) | Hapus data per range |
| 5024 | `setItem` | (key dinamis) | Simpan data akun bank baru |
| 5040 | `getItem` | `akunBankData` | Array data akun bank |

### 1.5 File: `datarange.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 705 | `getItem` | `rangeData` | Array data range saldo |
| 720 | `setItem` | `rangeData` | Update data range |
| 804 | `setItem` | (key dinamis) | Simpan data range |
| 817 | `getItem` | `rangeRemovedPerJenis` | JSON object removed per jenis |
| 838 | `getItem` | `databaseContent` | String konten database |
| 963 | `setItem` | (key dinamis) | Update data range |

### 1.6 File: `danakeluar.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 918-928 | `length`, `key(i)`, `getItem` | Iterasi key `laporan_*` | Baca laporan untuk menghitung total dana keluar |

### 1.7 File: `rekap.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 1425 | `getItem` | `jenisTransaksiData` | Array master jenis transaksi |
| 1488 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca laporan untuk rekap |
| 1688 | `getItem` | `rekapPendapatan_{YYYY-MM-DD}` | String pendapatan bersih per hari |
| 1693-1694 | `length`, `key(i)` | Iterasi key `rekapPendapatan_*` | Baca semua pendapatan tersimpan |
| 1789 | `setItem` | `rekapPendapatan_{YYYY-MM-DD}` | Simpan pendapatan bersih sebagai SSOT |
| 1793 | `setItem` | `rekapPendapatan_version` | String timestamp versioning |
| 1838 | `getItem` | `rekapPendapatan_{YYYY-MM-DD}` | Baca pendapatan tersimpan |
| 1853 | `setItem` | `rekapPendapatan_{YYYY-MM-DD}` | Simpan update pendapatan |
| 1860 | `getItem` | `saldoAwalBulan_{YYYY-MM}` | Integer saldo awal bulan |
| 1926 | `setItem` | `rekapPendapatan_{YYYY-MM-DD}` | Simpan pendapatan bersih |
| 1928 | `setItem` | `rekapPendapatan_version` | Update version |
| 1953-1956 | `length`, `key(i)`, `getItem` | Iterasi key `rekapPendapatan_*` | Baca semua pendapatan untuk filter |
| 1970 | `setItem` | `rekapPendapatan_{YYYY-MM-DD}` | Update pendapatan untuk halaman Trend |
| 2024 | `setItem` | `rekapPendapatan_{YYYY-MM-DD}` | Simpan pendapatan bersih |

### 1.8 File: `report.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 1532 | `getItem` | `laporan_{YYYY-MM-DD}` | Baca laporan untuk report detail |
| 1559 | `getItem` | `jenisTransaksiData` | Array master jenis transaksi |
| 1616-1617 | `length`, `key(i)` | Iterasi key `laporan_*` | Baca semua laporan untuk grafik |
| 1660 | `getItem` | `rekapPendapatan_{YYYY-MM-DD}` | Baca pendapatan untuk report |
| 1676-1680 | `Object.keys(localStorage)`, `getItem` | Iterasi key `laporan_*` | Filter laporan per range tanggal |
| 1754-1764 | `length`, `key(i)`, `getItem` | Iterasi key `laporan_*` | Baca semua laporan untuk total |
| 1844 | `getItem` | `lastReportUpdate` | String timestamp update terakhir |
| 1911 | `getItem` | `jenisTransaksiData` | Array master jenis transaksi |
| 2248 | `getItem` | `lastReportUpdate` | Cek update terakhir |

### 1.9 File: `Sumber Saldo.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 600 | `getItem` | `akunBankData` | Array data akun bank/sumber saldo |
| 622 | `setItem` | (key dinamis) | Simpan/update data akun bank |

### 1.10 File: `js/pelanggan.js`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 19 | (deklarasi konstanta) | `PELANGGAN_STORAGE_KEY = 'pelanggan_db'` | Key untuk data pelanggan |
| 28-35 | `length`, `key(i)`, `getItem` | Iterasi key `laporan_*` | Baca semua laporan untuk kalkulasi data pelanggan |
| 206 | `setItem` | `pelanggan_db` | Array: `[{ id, nama, rekening, totalTransaksi, transaksiList[] }]` - data pelanggan terkompilasi |

### 1.11 File: `index.html`

Tidak ada penggunaan localStorage.

### 1.12 File: `signup.html`

Tidak ada penggunaan localStorage.

### 1.13 File: `pelanggan.html`

Tidak ada penggunaan localStorage (hanya HTML statis yang menggunakan `js/pelanggan.js`).

---

## 2. sessionStorage

### 2.1 File: `akun.html`

| Baris | Operasi | Keterangan |
|-------|---------|------------|
| 1487 | `clear()` | Hapus semua sessionStorage saat logout |

### 2.2 File: `input.html`

| Baris | Operasi | Key | Data yang Disimpan |
|-------|---------|-----|-------------------|
| 3163 | `setItem` | (key tidak disebut eksplisit di komentar) | Simpan data laporan ke sessionStorage sebagai cache sesi |
| 3252 | `getItem` | `inputSelectedDate` | String tanggal terakhir yang dipilih user di sesi ini (YYYY-MM-DD) |
| 3261 | `removeItem` | `inputSelectedDate` | Hapus jika tanggal di sessionStorage tidak valid (laporan tidak ada di localStorage) |
| 3280 | `setItem` | `inputSelectedDate` | Simpan tanggal yang dipilih user ke sessionStorage |

---

## 3. Firebase / Firestore

### 3.1 File: `index.html`

| Baris | Kode | Fungsi |
|-------|------|--------|
| 732 | `import { initializeApp } from "firebase-app.js"` | Inisialisasi Firebase |
| 737 | `import { signInWithEmailAndPassword } from "firebase-auth.js"` | Import Auth |
| 741-752 | `firebaseConfig` | Konfigurasi Firebase |
| 752 | `const app = initializeApp(firebaseConfig)` | Inisialisasi app |
| 767 | `await signInWithEmailAndPassword(auth, email, password)` | **Login dengan email & password via Firebase Auth** |

**Firebase Config (index.html):**
- apiKey: "AIzaSyCSdFHXLLcDKGzYBgqUN4OQIL2kXrj5bXQ"
- authDomain: "digital-report-3567d.firebaseapp.com"
- projectId: "digital-report-3567d"
- storageBucket: "digital-report-3567d.firebasestorage.app"
- messagingSenderId: "459361649958"
- appId: "1:459361649958:web:0bac2e7e9d2a5fd0076fb8"

### 3.2 File: `signup.html`

| Baris | Kode | Fungsi |
|-------|------|--------|
| 129 | `import { initializeApp } from "firebase-app.js"` | Inisialisasi Firebase |
| 134 | `import { createUserWithEmailAndPassword } from "firebase-auth.js"` | Import Auth |
| 137-140 | `import { getFirestore, setDoc, doc } from "firebase-firestore.js"` | Import Firestore |
| 144-155 | `firebaseConfig` | Konfigurasi Firebase (sama dengan index.html) |
| 155 | `const app = initializeApp(firebaseConfig)` | Inisialisasi app |
| 159 | `const db = getFirestore(app)` | **Inisialisasi Firestore database** |
| 175 | `await createUserWithEmailAndPassword(auth, email, password)` | **Registrasi user baru via Firebase Auth** |
| 183 | `await setDoc(doc(db, "users", user.uid), { ... })` | **Simpan data user ke Firestore collection "users"** |

**Data yang disimpan ke Firestore (signup.html baris 183):**
- Collection: `users`
- Document ID: `user.uid` (UID dari Firebase Auth)
- Fields: (perlu dicek detailnya, dari kode yang terlihat: `{ nama, usaha, email }` atau sejenisnya)

---

## 4. RINGKASAN

### 4.1 Data yang Disimpan di localStorage (Grouped by Logical Data)

| Kelompok Data | Key Pattern | File Sumber | Dibaca Oleh |
|---------------|-------------|-------------|-------------|
| **Manajemen Akun** | `multiAkunData`, `akunAktif`, `fotoProfil_{id}`, `lastLogin_{id}` | akun.html | akun.html |
| **Profil Usaha** | `usahaProfileData` | akun.html | akun.html |
| **Laporan Harian** | `laporan_{YYYY-MM-DD}` | input.html | input.html, dashboard.html, rekap.html, report.html, danakeluar.html, js/pelanggan.js |
| **Legacy (sudah migrasi)** | `cashPagi`, `saldoData`, `transaksiData`, `mutasiData`, `feeFormula`, `feeTotal` | input.html (dibaca & dihapus saat migrasi) | input.html |
| **Master Jenis Transaksi** | `jenisTransaksiData` | database.html | input.html, dashboard.html, rekap.html, report.html |
| **Master Range/Saldo** | `rangeData`, `rangeRemovedPerJenis`, `akunBankData` | database.html, datarange.html | database.html, datarange.html, Sumber Saldo.html, input.html |
| **Database Content** | `databaseContent` | database.html | database.html, datarange.html |
| **Dashboard Cache** | `dashboard_total_aset_{YYYY-MM-DD}`, `dashboard_cash_akhir_{YYYY-MM-DD}`, `dashboard_saldo_akhir_{YYYY-MM-DD}` | (disimpan di finalisasi laporan) | dashboard.html |
| **Rekap Pendapatan** | `rekapPendapatan_{YYYY-MM-DD}`, `rekapPendapatan_version`, `saldoAwalBulan_{YYYY-MM}` | rekap.html | rekap.html, report.html |
| **Last Report Update** | `lastReportUpdate` | report.html | report.html |
| **Pelanggan** | `pelanggan_db` | js/pelanggan.js | js/pelanggan.js, pelanggan.html |

### 4.2 Data yang Disimpan di sessionStorage (Grouped)

| Key | Data | File Sumber | Fungsi |
|-----|------|-------------|--------|
| `inputSelectedDate` | String tanggal YYYY-MM-DD | input.html | Menyimpan tanggal yang dipilih user selama sesi berlangsung |

### 4.3 Firebase / Firestore

| Layanan | File | Fungsi |
|---------|------|--------|
| **Firebase Auth** | `index.html`, `signup.html` | Login (signInWithEmailAndPassword) & Registrasi (createUserWithEmailAndPassword) |
| **Firestore** | `signup.html` | Simpan data user ke collection `users` (setDoc + doc) setelah registrasi |
| **Catatan** | - | **Tidak ada data laporan, transaksi, atau data bisnis lain yang disimpan di Firestore.** Hanya data user (nama, email, usaha) yang dikirim ke Firestore saat registrasi. Login hanya memverifikasi email & password via Firebase Auth, lalu redirect ke dashboard. Semua data bisnis (laporan harian, transaksi, pelanggan, rekap, dll.) **hanya disimpan di localStorage sisi klien (browser).** |

### 4.4 Statistik Total

| Storage | Jumlah File Terlibat | Total Operasi (approx) |
|---------|---------------------|----------------------|
| localStorage | 11 file (9 HTML + 1 JS + 1 JS via HTML) | ~110+ operasi |
| sessionStorage | 2 file (akun.html, input.html) | 5 operasi |
| Firebase Auth | 2 file (index.html, signup.html) | 2 fungsi (login, register) |
| Firestore | 1 file (signup.html) | 1 operasi (setDoc) |

---

## 5. KESIMPULAN

- **100% data bisnis** (laporan harian, transaksi, mutasi, fee, pelanggan, rekap, range saldo, akun bank) disimpan di **localStorage browser**.
- **Firebase/Firestore hanya digunakan untuk autentikasi** (login & register) dan **menyimpan data user** (nama, email, usaha) saat pendaftaran.
- Tidak ada data transaksi atau laporan yang dikirim ke server Firebase/Firestore.
- Risiko: Semua data bisa hilang jika user menghapus cache browser atau berganti perangkat.
- Tidak ada backup atau sinkronisasi data ke cloud/server.