/**
 * js/pelanggan.js
 * 
 * MODUL PELANGGAN - Otomatis dari Transaksi Nasabah
 * 
 * Database pelanggan dibentuk otomatis dari data transaksi
 * yang sudah tersimpan di localStorage (laporan_YYYY-MM-DD).
 * 
 * Aturan:
 * - Jika Nama sama ATAU No Rekening sama => pelanggan yang sama
 * - Jumlah transaksi = total kemunculan di semua tanggal
 * - Urut descending berdasarkan total transaksi
 * 
 * FIRESTORE:
 * Data dikompilasi dari laporan, lalu di-dual-write ke Firestore.
 * Saat load: Firestore dulu (cache cepat) → rebuild dari laporan (akurat).
 */

/* =========================
FIREBASE INIT (dipanggil dari luar)
========================= */

let _firestoreUid = null;
let _db = null;

function setPelangganFirebase(uid, dbInstance){
  _firestoreUid = uid;
  _db = dbInstance;
}

function getFirestoreUid(){
  return _firestoreUid;
}

function getDb(){
  return _db;
}

/* Ekspor fungsi untuk dipanggil dari pelanggan.html */
window.setPelangganFirebase = setPelangganFirebase;
window.loadPelangganDariFirestore = loadPelangganDariFirestore;

/* =========================
KONSTANTA
========================= */

const PELANGGAN_STORAGE_KEY = 'pelanggan_db';

/* =========================
MENGUMPULKAN SEMUA TRANSAKSI DARI SEMUA TANGGAL
========================= */

function getAllTransaksiFromAllDates() {
  const allTransaksi = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    // Cari key yang diawali laporan_ (format: laporan_YYYY-MM-DD)
    if (!key || !key.startsWith('laporan_')) continue;
    
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      
      const data = JSON.parse(raw);
      
      if (data.transaksiData && Array.isArray(data.transaksiData)) {
        // Ambil tanggal dari key (format: laporan_YYYY-MM-DD)
        const dateKey = key.replace('laporan_', '');
        
        data.transaksiData.forEach(tx => {
          allTransaksi.push({
            ...tx,
            tanggal: dateKey
          });
        });
      }
    } catch (e) {
      // Skip jika data corrupt
      continue;
    }
  }

  return allTransaksi;
}

/* =========================
CEK APAKAH NAMA KOSONG / TIDAK VALID
========================= */

function isEmptyNama(nama) {
  // Kosong, null, undefined, "-", atau hanya berisi spasi
  return !nama || nama.trim() === '' || nama.trim() === '-';
}

/* =========================
CEK APAKAH NAMA ADALAH KATEGORI "LAIN-LAIN" (fallback)
========================= */

function isLainLain(nama) {
  if (!nama) return false;
  const normalized = nama.trim().toLowerCase().replace(/[\s-]+/g, ' ');
  // Variasi: "lain-lain", "lain lain", "LAIN-LAIN", "Lain lain", dll
  return normalized === 'lain lain' || normalized === 'lain-lain';
}

/* =========================
MEMBANGUN DATABASE PELANGGAN
========================= */

function buildPelangganDatabase() {
  const allTransaksi = getAllTransaksiFromAllDates();
  const pelangganMap = new Map(); // key: id pelanggan, value: { nama, rekening, transactions: Set, transaksiList: [] }
  
  // Akumulator untuk transaksi tanpa nama (Lain-lain)
  let lainLainCount = 0;
  const lainLainTransaksiList = [];

  allTransaksi.forEach(tx => {
    const rawNama = tx.keterangan || '';
    const rekening = (tx.rekening || '').trim();
    const tanggal = tx.tanggal || '';

    // Jika nama tidak valid (kosong, null, undefined, "-", atau hanya spasi)
    // maka masukkan ke kategori Lain-lain
    if (isEmptyNama(rawNama)) {
      lainLainCount++;
      lainLainTransaksiList.push({ tanggal, jenis: tx.jenis, nominal: tx.nominal, rekening });
      return;
    }

    const nama = rawNama.trim();

    // Jika nama adalah kategori "Lain-lain" (berbagai variasi), masukkan ke Lain-lain
    if (isLainLain(nama)) {
      lainLainCount++;
      lainLainTransaksiList.push({ tanggal, jenis: tx.jenis, nominal: tx.nominal, rekening });
      return;
    }

    // Skip jika tidak memiliki nama dan rekening (seharusnya tidak terjadi karena nama valid)
    if (!nama && !rekening) return;

    // Cari pelanggan yang sudah ada berdasarkan nama ATAU rekening
    let foundId = null;
    
    for (const [id, pel] of pelangganMap.entries()) {
      // Jangan cocokkan dengan Lain-lain
      if (pel.nama === 'Lain-lain') continue;
      
      const namaMatch = nama && pel.nama && pel.nama.toLowerCase() === nama.toLowerCase();
      const rekeningMatch = rekening && pel.rekening && pel.rekening === rekening;
      
      if (namaMatch || rekeningMatch) {
        foundId = id;
        break;
      }
    }

    if (foundId !== null) {
      // Update pelanggan yang sudah ada
      const pel = pelangganMap.get(foundId);
      
      // Update nama jika kosong atau rekening cocok tapi nama beda
      if (nama && !pel.nama) {
        pel.nama = nama;
      }
      
      // Update rekening jika kosong atau nama cocok tapi rekening beda
      if (rekening && !pel.rekening) {
        pel.rekening = rekening;
      }

      // Update rekening jika ada data baru yang lebih lengkap
      if (rekening && pel.rekening && pel.rekening !== rekening) {
        // Jika nama cocok tapi rekening berbeda, simpan rekening baru jika pelanggan belum punya
        // Jika sudah punya rekening, tetap pakai yang lama
        // Tapi jika rekening baru muncul lebih sering? kita simpan yang pertama ditemui
      }

      // Tambahkan transaksi ke set (gunakan tanggal+jenis+nominal sebagai unique key)
      const txKey = `${tanggal}_${tx.jenis}_${tx.nominal}_${rekening}`;
      pel.transactions.add(txKey);
      pel.transaksiList.push({ tanggal, jenis: tx.jenis, nominal: tx.nominal });

    } else {
      // Buat pelanggan baru
      const id = `pel_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const txKey = `${tanggal}_${tx.jenis}_${tx.nominal}_${rekening}`;
      
      pelangganMap.set(id, {
        nama: nama,
        rekening: rekening || '-',
        transactions: new Set([txKey]),
        transaksiList: [{ tanggal, jenis: tx.jenis, nominal: tx.nominal }]
      });
    }
  });

  // Tambahkan kategori Lain-lain jika ada transaksi tanpa nama
  if (lainLainCount > 0) {
    const lainLainId = `pel_lain_lain`;
    // Gunakan Set untuk menghindari duplikasi transaksi (sama seperti logika pelanggan biasa)
    const lainLainSet = new Set();
    lainLainTransaksiList.forEach(tx => {
      const txKey = `${tx.tanggal}_${tx.jenis}_${tx.nominal}_${tx.rekening}`;
      lainLainSet.add(txKey);
    });
    
    pelangganMap.set(lainLainId, {
      nama: 'Lain-lain',
      rekening: '-',
      transactions: lainLainSet,
      transaksiList: lainLainTransaksiList
    });
  }

  // Konversi ke array dan hitung total transaksi
  const pelangganArray = [];
  
  for (const [id, pel] of pelangganMap.entries()) {
    pelangganArray.push({
      id,
      nama: pel.nama,
      rekening: pel.rekening,
      totalTransaksi: pel.transactions.size,
      transaksiList: pel.transaksiList
    });
  }

  // Simpan ke localStorage untuk caching
  try {
    localStorage.setItem(PELANGGAN_STORAGE_KEY, JSON.stringify(pelangganArray));
    console.log("SAVE PELANGGAN TO LOCALSTORAGE");
  } catch (e) {
    // Ignore storage error
  }

  /* DUAL-WRITE: Simpan ke Firestore */
  const uid = getFirestoreUid();
  const db = getDb();
  if(uid && db){
    try {
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
        .then(({ doc, setDoc }) => {
          const pelangganRef = doc(db, "pelanggan", uid);
          return setDoc(pelangganRef, {
            daftar: pelangganArray,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        })
        .then(() => {
          console.log("SAVE PELANGGAN FIRESTORE");
          console.log("TOTAL PELANGGAN:", pelangganArray.length);
        })
        .catch(err => {
          console.warn("FIRESTORE PELANGGAN SAVE FAILED, LOCALSTORAGE OK", err);
        });
    } catch(e){
      console.warn("FIRESTORE PELANGGAN DYNAMIC IMPORT FAILED", e);
    }
  }

  return pelangganArray;
}

/* =========================
LOAD PELANGGAN DARI FIRESTORE (cache cepat)
========================= */

async function loadPelangganDariFirestore(){
  const uid = getFirestoreUid();
  const db = getDb();
  if(!uid || !db) return null;
  
  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const pelangganRef = doc(db, "pelanggan", uid);
    const snap = await getDoc(pelangganRef);
    if(snap.exists() && snap.data().daftar){
      const data = snap.data().daftar;
      console.log("LOAD PELANGGAN FIRESTORE");
      console.log("TOTAL PELANGGAN:", data.length);
      /* Update localStorage sebagai cache */
      localStorage.setItem(PELANGGAN_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch(e){
    console.warn("FIRESTORE PELANGGAN LOAD FAILED, FALLBACK TO LOCALSTORAGE", e);
  }
  return null;
}

/* =========================
MENDAPATKAN DATA PELANGGAN
========================= */

function getPelangganData() {
  // Selalu bangun ulang database dari data transaksi terkini
  // untuk memastikan data akurat setelah penghapusan transaksi.
  return buildPelangganDatabase();
}

/* =========================
TOP PELANGGAN (untuk Dashboard) - Maksimal 4
========================= */

function getTop10Pelanggan() {
  const data = getPelangganData();
  
  // Pisahkan Lain-lain dari pelanggan normal (gunakan isLainLain untuk deteksi variasi nama)
  const lainLainItems = data.filter(p => isLainLain(p.nama));
  const normalItems = data.filter(p => !isLainLain(p.nama));
  
  // Urutkan pelanggan normal descending berdasarkan total transaksi
  normalItems.sort((a, b) => b.totalTransaksi - a.totalTransaksi);
  
  // Ambil maksimal 4 data: pelanggan normal teratas + Lain-lain di akhir
  const topNormal = normalItems.slice(0, 3); // Maks 3 pelanggan normal
  const result = [...topNormal, ...lainLainItems];
  
  // Jika total data masih < 4 dan masih ada sisa pelanggan normal, tambahkan
  let currentCount = result.length - lainLainItems.length; // jumlah normal yg sudah diambil
  if (result.length < 4 && normalItems.length > currentCount) {
    const remaining = normalItems.slice(currentCount, currentCount + (4 - result.length));
    // Sisipkan sebelum Lain-lain (di akhir)
    result.splice(result.length - (lainLainItems.length || 0), 0, ...remaining);
  }
  
  return result;
}

/* =========================
FILTER PELANGGAN (untuk halaman pelanggan.html)
========================= */

/**
 * Filter pelanggan berdasarkan:
 * @param {Array} data - Array pelanggan
 * @param {string} search - Kata kunci pencarian (nama / rekening)
 * @param {string} filterMode - 'all' | 'specific' | 'range'
 * @param {string} dateStart - Tanggal awal (YYYY-MM-DD) untuk mode specific atau range
 * @param {string} dateEnd - Tanggal akhir (YYYY-MM-DD) untuk mode range
 * @returns {Array} Array pelanggan yang sudah difilter
 */
function filterPelanggan(data, search = '', filterMode = 'all', dateStart = '', dateEnd = '') {
  let result = [...data];

  // Filter berdasarkan search
  if (search.trim()) {
    const keyword = search.trim().toLowerCase();
    result = result.filter(p => 
      p.nama.toLowerCase().includes(keyword) ||
      p.rekening.toLowerCase().includes(keyword)
    );
  }

  // Filter berdasarkan tanggal
  if (filterMode === 'specific' && dateStart) {
    result = result.map(p => {
      const filteredList = p.transaksiList.filter(tx => tx.tanggal === dateStart);
      return {
        ...p,
        transaksiList: filteredList,
        totalTransaksi: filteredList.length
      };
    }).filter(p => p.totalTransaksi > 0);
  }

  if (filterMode === 'range' && dateStart && dateEnd) {
    result = result.map(p => {
      const filteredList = p.transaksiList.filter(tx => 
        tx.tanggal >= dateStart && tx.tanggal <= dateEnd
      );
      return {
        ...p,
        transaksiList: filteredList,
        totalTransaksi: filteredList.length
      };
    }).filter(p => p.totalTransaksi > 0);
  }

  // Urutkan descending (tidak termasuk Lain-lain)
  const lainLainItems = result.filter(p => isLainLain(p.nama));
  const otherItems = result.filter(p => !isLainLain(p.nama));
  
  otherItems.sort((a, b) => b.totalTransaksi - a.totalTransaksi);
  
  // Gabungkan: pelanggan normal di atas, Lain-lain selalu di paling bawah
  result = [...otherItems, ...lainLainItems];

  return result;
}

/* =========================
REFRESH DATABASE (panggil setelah input transaksi baru)
========================= */

function refreshPelangganDatabase() {
  return buildPelangganDatabase();
}

/* =========================
RENDER TOP PELANGGAN DI DASHBOARD
========================= */

function renderTop10Dashboard() {
  const container = document.getElementById('topCustomerContainer');
  if (!container) return;

  const topData = getTop10Pelanggan();
  
  if (topData.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px;color:#94a3b8;font-size:14px;">
        Belum ada data pelanggan
      </div>
    `;
    return;
  }

  // Hitung total transaksi untuk persentase
  const totalSemuaTransaksi = topData.reduce((sum, p) => sum + p.totalTransaksi, 0);

  container.innerHTML = '';

  let rankingCounter = 0;

  topData.forEach((pelanggan) => {
    const persen = totalSemuaTransaksi > 0 
      ? ((pelanggan.totalTransaksi / totalSemuaTransaksi) * 100).toFixed(1)
      : 0;

    // Cek apakah ini Lain-lain
    const isLain = isLainLain(pelanggan.nama);

    const row = document.createElement('div');
    row.className = 'customer-row';
    
    if (isLain) {
      // Lain-lain: tampilkan tanpa nomor ranking, dengan style berbeda (abu-abu)
      row.innerHTML = `
        <div class="rank" style="background:linear-gradient(135deg,#6c757d,#adb5bd);font-size:11px;">—</div>
        <div>
          <div class="customer-name" style="font-weight:400;color:#6c757d;">${pelanggan.nama}</div>
          <div style="font-size:12px;color:#94a3b8;">${pelanggan.rekening}</div>
        </div>
        <div class="customer-trans">${pelanggan.totalTransaksi} transaksi</div>
        <div class="customer-percent" style="color:#6c757d;">${persen}%</div>
      `;
    } else {
      // Pelanggan normal dengan ranking
      rankingCounter++;
      row.innerHTML = `
        <div class="rank">${rankingCounter}</div>
        <div>
          <div class="customer-name">${pelanggan.nama}</div>
          <div style="font-size:12px;color:#94a3b8;">${pelanggan.rekening}</div>
        </div>
        <div class="customer-trans">${pelanggan.totalTransaksi} transaksi</div>
        <div class="customer-percent">${persen}%</div>
      `;
    }
    
    container.appendChild(row);
  });
}

/* =========================
EVENT: TANDAI AGAR DIPANGGIL SAAT HALAMAN DIMUAT
========================= */

// Auto-render jika di halaman dashboard
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('topCustomerContainer')) {
    renderTop10Dashboard();
  }
});