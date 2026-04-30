// Mock data for Tax Holiday
export const mockTaxHolidayData = [
  {
    provinsi: 'Jawa Barat',
    kawasanIndustri: ['Kawasan Industri Karawang', 'Kawasan Industri Bekasi'],
    cakupan: 'Industri Pionir',
    jangkaWaktu: '5 Tahun',
    nilaiInvestasiMin: 50000000000,
    nilaiInvestasiMax: 500000000000,
    jenisTaxHoliday: 'Tax Holiday PPh Badan',
    summary: 'Pembebasan PPh Badan selama 5 tahun untuk investasi di sektor industri pionir',
    detailInsentif: [
      'Pembebasan 100% PPh Badan tahun 1-5',
      'Pengurangan 50% PPh Badan tahun 6-7'
    ],
    insentifTambahan: [
      'Pembebasan PPN impor barang modal',
      'Kemudahan perizinan'
    ],
    syarat: [
      'Investasi minimal Rp 50 miliar',
      'Penyerapan tenaga kerja minimal 300 orang',
      'Berlokasi di kawasan industri yang ditunjuk'
    ]
  },
  {
    provinsi: 'Jawa Timur',
    kawasanIndustri: ['SIER Surabaya', 'Kawasan Industri Pasuruan'],
    cakupan: 'Industri Pionir',
    jangkaWaktu: '10 Tahun',
    nilaiInvestasiMin: 100000000000,
    nilaiInvestasiMax: 1000000000000,
    jenisTaxHoliday: 'Tax Holiday PPh Badan Extended',
    summary: 'Pembebasan PPh Badan selama 10 tahun untuk investasi besar di sektor industri pionir',
    detailInsentif: [
      'Pembebasan 100% PPh Badan tahun 1-10',
      'Pengurangan 50% PPh Badan tahun 11-15'
    ],
    insentifTambahan: [
      'Pembebasan PPN impor barang modal',
      'Pembebasan bea masuk mesin produksi',
      'Kemudahan perizinan'
    ],
    syarat: [
      'Investasi minimal Rp 100 miliar',
      'Penyerapan tenaga kerja minimal 500 orang',
      'Berlokasi di kawasan industri yang ditunjuk',
      'Menggunakan teknologi ramah lingkungan'
    ]
  },
  {
    provinsi: 'Banten',
    kawasanIndustri: ['Kawasan Industri Modern Cikande', 'Kawasan Berikat Nusantara'],
    cakupan: 'KEK (Kawasan Ekonomi Khusus)',
    jangkaWaktu: '5 Tahun',
    nilaiInvestasiMin: 30000000000,
    nilaiInvestasiMax: 300000000000,
    jenisTaxHoliday: 'Tax Holiday KEK',
    summary: 'Pembebasan PPh Badan untuk investasi di Kawasan Ekonomi Khusus',
    detailInsentif: [
      'Pembebasan 100% PPh Badan tahun 1-5',
      'Pengurangan 25% PPh Badan tahun 6-8'
    ],
    insentifTambahan: [
      'Pembebasan PPN untuk kegiatan di KEK',
      'Fasilitas kepabeanan'
    ],
    syarat: [
      'Investasi minimal Rp 30 miliar',
      'Berlokasi di KEK yang ditunjuk',
      'Penyerapan tenaga kerja minimal 200 orang'
    ]
  },
  {
    provinsi: 'Kalimantan Timur',
    kawasanIndustri: ['Kawasan Industri Kariangau', 'KEK Maloy Batuta Trans Kalimantan'],
    cakupan: 'Industri Pionir',
    jangkaWaktu: '10 Tahun',
    nilaiInvestasiMin: 150000000000,
    nilaiInvestasiMax: 2000000000000,
    jenisTaxHoliday: 'Tax Holiday PPh Badan Extended',
    summary: 'Pembebasan PPh Badan untuk industri strategis di luar Jawa',
    detailInsentif: [
      'Pembebasan 100% PPh Badan tahun 1-10',
      'Pengurangan 50% PPh Badan tahun 11-20'
    ],
    insentifTambahan: [
      'Pembebasan PPN impor barang modal',
      'Subsidi infrastruktur',
      'Kemudahan perizinan'
    ],
    syarat: [
      'Investasi minimal Rp 150 miliar',
      'Penyerapan tenaga kerja lokal minimal 60%',
      'Program CSR untuk masyarakat sekitar'
    ]
  }
];

// Mock data for Tax Allowance
export const mockTaxAllowanceData = [
  {
    provinsi: 'Jawa Barat',
    kawasanIndustri: ['Kawasan Industri Karawang', 'Kawasan Industri Bekasi'],
    bidangUsaha: 'Industri Logam Dasar',
    cakupanBidangUsaha: 'Industri Besi dan Baja',
    nilaiMinInvestasiBaru: 100000000000,
    nilaiMinPerluasan: 50000000000,
    syarat: [
      'Menggunakan teknologi tinggi',
      'Penyerapan tenaga kerja minimal 300 orang',
      'Berlokasi di kawasan industri'
    ],
    taxAllowance: 'Pengurangan penghasilan neto 30% dari nilai investasi selama 6 tahun (masing-masing 5% per tahun)',
    insentifTambahan: [
      'Penyusutan dan amortisasi dipercepat',
      'Kompensasi kerugian lebih lama (10 tahun)'
    ]
  },
  {
    provinsi: 'Jawa Timur',
    kawasanIndustri: ['SIER Surabaya', 'Kawasan Industri Gresik'],
    bidangUsaha: 'Industri Kimia Dasar',
    cakupanBidangUsaha: 'Industri Petrokimia',
    nilaiMinInvestasiBaru: 200000000000,
    nilaiMinPerluasan: 100000000000,
    syarat: [
      'Menggunakan teknologi ramah lingkungan',
      'Penyerapan tenaga kerja minimal 500 orang',
      'Memiliki sertifikasi ISO 14001'
    ],
    taxAllowance: 'Pengurangan penghasilan neto 30% dari nilai investasi selama 6 tahun (masing-masing 5% per tahun)',
    insentifTambahan: [
      'Penyusutan dan amortisasi dipercepat',
      'Kompensasi kerugian 10 tahun',
      'Dividen ke luar negeri dikenakan PPh 10%'
    ]
  },
  {
    provinsi: 'Banten',
    kawasanIndustri: ['Kawasan Industri Modern Cikande', 'Kawasan Industri Krakatau'],
    bidangUsaha: 'Industri Elektronik',
    cakupanBidangUsaha: 'Industri Komponen Elektronik dan Semikonduktor',
    nilaiMinInvestasiBaru: 150000000000,
    nilaiMinPerluasan: 75000000000,
    syarat: [
      'Menggunakan teknologi 4.0',
      'R&D minimal 2% dari revenue',
      'Penyerapan tenaga kerja minimal 400 orang'
    ],
    taxAllowance: 'Pengurangan penghasilan neto 30% dari nilai investasi selama 6 tahun (masing-masing 5% per tahun)',
    insentifTambahan: [
      'Penyusutan dan amortisasi dipercepat',
      'Kompensasi kerugian 10 tahun',
      'Insentif tambahan untuk R&D'
    ]
  },
  {
    provinsi: 'Jawa Tengah',
    kawasanIndustri: ['Kawasan Industri Kendal', 'Kawasan Industri Batang'],
    bidangUsaha: 'Industri Mesin dan Alat Berat',
    cakupanBidangUsaha: 'Industri Manufaktur Mesin',
    nilaiMinInvestasiBaru: 120000000000,
    nilaiMinPerluasan: 60000000000,
    syarat: [
      'TKDN minimal 40%',
      'Penyerapan tenaga kerja minimal 350 orang',
      'Berlokasi di kawasan industri'
    ],
    taxAllowance: 'Pengurangan penghasilan neto 30% dari nilai investasi selama 6 tahun (masing-masing 5% per tahun)',
    insentifTambahan: [
      'Penyusutan dan amortisasi dipercepat',
      'Kompensasi kerugian 10 tahun'
    ]
  },
  {
    provinsi: 'Sulawesi Selatan',
    kawasanIndustri: ['Kawasan Industri Makassar', 'KIMA (Kawasan Industri Makassar)'],
    bidangUsaha: 'Industri Pengolahan',
    cakupanBidangUsaha: 'Industri Pengolahan Hasil Pertanian dan Perikanan',
    nilaiMinInvestasiBaru: 80000000000,
    nilaiMinPerluasan: 40000000000,
    syarat: [
      'Menggunakan bahan baku lokal minimal 70%',
      'Penyerapan tenaga kerja lokal minimal 80%',
      'Program kemitraan dengan UMKM lokal'
    ],
    taxAllowance: 'Pengurangan penghasilan neto 30% dari nilai investasi selama 6 tahun (masing-masing 5% per tahun)',
    insentifTambahan: [
      'Penyusutan dan amortisasi dipercepat',
      'Kompensasi kerugian 10 tahun',
      'Insentif tambahan pengembangan daerah'
    ]
  }
];
