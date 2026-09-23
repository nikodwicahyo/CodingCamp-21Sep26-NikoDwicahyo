# Product Requirement Document (PRD)
## Expense & Budget Visualizer

---

## 1. Overview & Objectives

### 1.1 Overview
**Expense & Budget Visualizer** adalah aplikasi web berbasis *client-side* yang dirancang untuk membantu pengguna mencatat dan memantau pengeluaran harian secara sederhana, cepat, dan intuitif. Aplikasi ini memberikan visualisasi pengeluaran berdasarkan kategori serta menampilkan total pengeluaran secara *real-time*.

### 1.2 Purpose & Objectives
- **Tujuan Utama:** Menyediakan platform pemantau keuangan harian yang ringan, ramah pengguna di perangkat *mobile* maupun *desktop*, tanpa membutuhkan registrasi atau infrastruktur *backend*.
- **Target Pembelajaran (Coding Camp):** Mengimplementasikan dasar-dasar *software engineering* menggunakan HTML, CSS, Vanilla JavaScript, serta integrasi pemrosesan *client-side storage* (Local Storage) dan visualisasi data (*Chart.js*).

---

## 2. Target Audience & Personas

- **Target Audience:** Individu, mahasiswa, atau pengguna harian yang membutuhkan alat pencatat transaksi keuangan yang simpel dan langsung dapat digunakan tanpa penyiapan akun yang rumit.
- **Penggunaan Perangkat:** Diutamakan untuk *Mobile Browser*, namun tetap fleksibel dan responsif untuk tampilan *Desktop*.

---

## 3. Product Features & Requirements

### 3.1 Core Features (Minimum Viable Product - MVP)

| ID | Fitur | Deskripsi | Aturan Bisnis / Validasi |
| :--- | :--- | :--- | :--- |
| **F-01** | **Total Balance Display** | Menampilkan jumlah total akumulasi pengeluaran di bagian atas antarmuka. | - Otomatis bertambah saat transaksi ditambahkan.<br>- Otomatis berkurang saat transaksi dihapus. |
| **F-02** | **Input Form (Add Transaction)** | Formulir untuk memasukkan data pengeluaran baru. | - **Field:** *Item Name* (Teks), *Amount* (Angka/Desimal), *Category* (Dropdown: Food, Transport, Fun).<br>- Validasi: Semua *field* wajib diisi sebelum data dapat disimpan. |
| **F-03** | **Transaction List** | Daftar riwayat transaksi yang dapat di-*scroll*. | - Menampilkan *Item Name*, *Amount*, dan *Category* badge.<br>- Dilengkapi tombol **Delete** pada setiap baris untuk menghapus item. |
| **F-04** | **Visual Chart** | Diagram lingkaran (*Pie Chart*) untuk memvisualisasikan proporsi pengeluaran berdasarkan kategori. | - Menggunakan pustaka *Chart.js* (atau pustaka sejenis).<br>- Grafik diperbarui secara otomatis setiap ada perubahan data transaksi (*add/delete*). |

---

### 3.2 Optional Features (Pilihan Fitur Tambahan)
*(Dipilih 3 dari 5 tantangan opsional untuk meningkatkan interaktivitas)*

1. **Custom Categories:** Memungkinkan pengguna menambahkan kategori pengeluaran baru sesuai kebutuhan secara kustom.
2. **Sort Transactions:** Fitur pengurutan daftar transaksi berdasarkan *Amount* (terbesar/terkecil) atau *Category*.
3. **Dark / Light Mode Toggle:** Mode tampilan gelap dan terang yang disesuaikan dengan kenyamanan visual pengguna.

---

## 4. Technical Constraints & Architecture

### 4.1 Tech Stack (TC-1)
- **HTML5:** Struktur dokumen dan aksesibilitas elemen.
- **CSS3:** Pemformatan tata letak, gaya visual, dan desain responsif (Tanpa framework CSS berat).
- **Vanilla JavaScript (ES6+):** Logika manipulasi DOM, manajemen *state*, dan kalkulasi data (Tanpa framework React/Vue/Angular).
- **Chart Library:** *Chart.js* via CDN untuk pembuatan grafik *Pie Chart*.

### 4.2 Data Storage (TC-2)
- **Local Storage API:** Seluruh data transaksi disimpan di memori lokal peramban (*client-side only*).
- **No Backend:** Aplikasi bekerja secara fully *offline-capable* di tingkat peramban tanpa memerlukan server API/database eksternal.

### 4.3 Browser Compatibility (TC-3)
- Dukungan penuh pada peramban modern: Google Chrome, Mozilla Firefox, Microsoft Edge, dan Apple Safari.

### 4.4 Structure & Guidelines Rules
- **Aturan Struktur Folder Mandatory:**
  ```text
  ├── index.html
  ├── css/
  │   └── style.css       # Hanya 1 berkas CSS
  ├── js/
  │   └── main.js        # Hanya 1 berkas JavaScript
  └── .kiro/              # Folder konfigurasi Kiro Builder ID
  ```

---

## 5. Non-Functional Requirements (NFR)

- **NFR-1: Simplicity & Usability**
  - Antarmuka yang bersih, intuitif, dan *minimalist*.
  - Tanpa alur konfigurasi/setup yang membingungkan bagi pengguna akhir.
- **NFR-2: Performance**
  - Waktu muat (*load time*) tergolong cepat (< 1.5 detik).
  - Interaksi UI bebas dari jeda (*no lag*) saat menambahkan atau menghapus transaksi.
- **NFR-3: Visual Design & Responsiveness**
  - Mengusung pendekatan *mobile-friendly/responsive layout*.
  - Tipografi jernih dan hierarki visual yang jelas untuk pembacaan angka keuangan.

---

## 6. GitHub & Deployment Strategy

1. **Version Control:**
   - Repositori dibuat menggunakan konvensi penamaan: `CodingCamp-[batch date]-[participantname]` (Contoh: `CodingCamp-31August26-yamaroni`).
   - Manajemen perubahan kode dilakukan menggunakan **GitHub Desktop**.
2. **Deployment:**
   - Situs dipublikasikan secara daring menggunakan layanan gratis **GitHub Pages**.
3. **Pengumpulan Proyek:**
   - Memastikan keberadaan folder `.kiro` pada repositori.
   - Mengumpulkan URL Repositori GitHub, URL Live GitHub Pages, dan AWS Builder ID melalui form pengumpulan resmi (Paperform).