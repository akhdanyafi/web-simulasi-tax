# Tax Simulator Features

Tax Simulator Features adalah aplikasi web untuk simulasi insentif pajak investasi dengan dua modul utama:

- Tax Holiday
- Tax Allowance

Aplikasi ini terdiri dari frontend (Vite + React), backend API (Express), dan database MySQL/MariaDB untuk data acuan KBLI 2025.

## Fitur Utama

- Simulator publik untuk estimasi kelayakan Tax Holiday dan Tax Allowance
- Portal admin untuk kelola dataset (upload dan replace file Excel)
- API backend untuk opsi filter, simulasi, autentikasi, dan manajemen dataset
- Deteksi port backend otomatis dari frontend (tidak perlu set proxy port tetap)

## Teknologi

- Frontend: Vite, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Database: MySQL / MariaDB
- Pengolahan data: xlsx

## Struktur Folder

- `src/`: kode frontend
- `server/`: API backend dan autentikasi
- `database/`: schema dan dump SQL
- `scripts/`: utilitas impor/generasi SQL dari Excel
- `assets/`: aset statis dan runtime API config

## Quick Start (Lokal)

1. Install dependency

```bash
npm install
```

2. Siapkan database cepat (disarankan)

```bash
mysql -u root -p < database/tax_simulator_features.sql
```

3. Jalankan backend

```bash
npm run server
```

4. Jalankan frontend (terminal terpisah)

```bash
npm run dev
```

5. Akses aplikasi

- Simulator: `http://127.0.0.1:5173/`
- Login admin: `http://127.0.0.1:5173/admin/login`

## Konfigurasi Environment Backend

Backend membaca konfigurasi dari environment variable berikut:

| Variable | Default | Keterangan |
| --- | --- | --- |
| `DB_HOST` | `127.0.0.1` | Host database |
| `DB_PORT` | `3306` | Port database |
| `DB_USER` | `root` | User database |
| `DB_PASSWORD` | kosong | Password database |
| `DB_NAME` | `tax_simulator_features` | Nama database |
| `DB_CONNECTION_LIMIT` | `10` | Batas koneksi pool |
| `API_PORT` | otomatis | Port backend API. Jika tidak diisi, server memilih port kosong |
| `API_HOST` | `127.0.0.1` | Host saat backend listen |
| `API_PUBLIC_HOST` | `127.0.0.1` | Host yang diumumkan ke frontend |
| `CORS_ORIGIN` | kosong | Origin yang diizinkan, pisahkan koma bila lebih dari satu |

Contoh menjalankan backend dengan env manual:

```bash
DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root DB_PASSWORD=your_password DB_NAME=tax_simulator_features npm run server
```

Jika ingin lock port tertentu:

```bash
API_PORT=5186 npm run server
```

## Setup Database Alternatif (Dari Excel)

Selain import dump SQL, Anda bisa membangun ulang database dari file Excel sumber di root project:

- `Tax_Allowance_KBLI_2025_Reconciliation.xlsx`
- `TAX_HOLIDAY_KBLI2025_REVISI.xlsx`

Jalankan:

```bash
npm run db:import
```

Script ini akan:

- recreate schema dari `database/schema.sql`
- parse data dari file Excel
- isi tabel Tax Holiday dan Tax Allowance

## Cara Kerja Port Otomatis

- Saat backend start, server menulis alamat API aktif ke `assets/runtime-api-config.json`.
- Frontend membaca file ini saat melakukan request API.
- Jika backend restart di port berbeda, frontend akan mengikuti port terbaru secara otomatis.

## Script Penting

```bash
npm run dev        # Menjalankan frontend Vite
npm run server     # Menjalankan backend Express
npm run build      # Build frontend production
npm run db:import  # Import schema + data dari file Excel
npm run db:sql     # Generate SQL dari file Excel
```

## Troubleshooting Umum

- Error `connect ECONNREFUSED 127.0.0.1:3306`:
	Database belum jalan atau kredensial DB salah.
- Error backend belum terdeteksi di frontend:
	Pastikan `npm run server` aktif dan tidak crash saat start.
- Data simulator kosong:
	Pastikan tabel `tax_holiday_kbli_2025` dan `tax_allowance_kbli_2025` sudah terisi.

## Build Production

```bash
npm run build
```

Hasil build frontend ada di folder `dist/`.
