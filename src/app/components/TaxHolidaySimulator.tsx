import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCcw, CheckCircle2, XCircle, MapPin, Clock, Banknote, AlertTriangle, Layers, Building, Sparkles, FileText, Search } from 'lucide-react';
import { IslamicGeometricArt } from './IslamicPattern';
import { apiFetch } from '../lib/api';

interface SimulationResult {
  status: 'success' | 'error' | 'out_of_range';
  provinsi: string;
  kawasanIndustri: string[];
  cakupan: string;
  jangkaWaktu: string;
  nilaiInvestasiMin: number;
  nilaiInvestasiMax: number | null;
  jenisTaxHoliday: string;
  summary: string;
  catatanRegulasi: string;
  detailInsentif: string[];
  insentifTambahan: string[];
  syarat: string[];
}

interface InvestmentRange {
  min: number;
  max: number | null;
}

function formatInvestmentRange(min: number, max: number | null) {
  if (max === null || max === undefined) return `Mulai ${formatRupiah(min)}`;
  return `${formatRupiah(min)} — ${formatRupiah(max)}`;
}

function formatRupiah(val: string | number) {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '';
  if (num >= 1e12) return `Rp ${(num / 1e12).toFixed(1)} Triliun`;
  if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(0)} Miliar`;
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(0)} Juta`;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

export default function TaxHolidaySimulator() {
  const [provinsi, setProvinsi] = useState('');
  const [cakupan, setCakupan] = useState('');
  const [jangkaWaktu, setJangkaWaktu] = useState('');
  const [nilaiInvestasi, setNilaiInvestasi] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [availableCakupan, setAvailableCakupan] = useState<string[]>([]);
  const [availableJangkaWaktu, setAvailableJangkaWaktu] = useState<string[]>([]);
  const [investmentRange, setInvestmentRange] = useState<InvestmentRange | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    if (provinsi) params.set('provinsi', provinsi);
    if (cakupan) params.set('cakupan', cakupan);
    if (jangkaWaktu) params.set('jangkaWaktu', jangkaWaktu);

    if (!provinsi) {
      setAvailableCakupan([]);
      setAvailableJangkaWaktu([]);
      setInvestmentRange(null);
    } else if (!cakupan) {
      setAvailableJangkaWaktu([]);
      setInvestmentRange(null);
    } else if (!jangkaWaktu) {
      setInvestmentRange(null);
    }

    apiFetch<{ provinces: string[]; cakupan: string[]; jangkaWaktu: string[]; investmentRange: InvestmentRange | null }>(
      `/api/tax-holiday/options?${params.toString()}`,
      { auth: false }
    )
      .then(data => {
        if (ignore) return;
        setProvinces(data.provinces);
        setAvailableCakupan(data.cakupan);
        setAvailableJangkaWaktu(data.jangkaWaktu);
        setInvestmentRange(data.investmentRange);
        setLoadError('');
      })
      .catch(error => {
        if (ignore) return;
        setInvestmentRange(null);
        setLoadError(error.message);
      });

    return () => {
      ignore = true;
    };
  }, [provinsi, cakupan, jangkaWaktu]);

  const handleSimulate = async () => {
    if (!provinsi || !cakupan || !jangkaWaktu || !nilaiInvestasi) return;
    const investmentValue = parseFloat(nilaiInvestasi);
    if (isNaN(investmentValue)) return;

    setIsCalculating(true);
    setResult(null);
    try {
      const data = await apiFetch<SimulationResult>('/api/tax-holiday/simulate', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ provinsi, cakupan, jangkaWaktu, nilaiInvestasi: investmentValue }),
      });
      setResult(data);
    } catch {
      setResult({ status: 'error', provinsi, kawasanIndustri: [], cakupan, jangkaWaktu, nilaiInvestasiMin: 0, nilaiInvestasiMax: null, jenisTaxHoliday: '', summary: '', catatanRegulasi: '', detailInsentif: [], insentifTambahan: [], syarat: [] });
    }
    setIsCalculating(false);
  };

  const handleReset = () => {
    setProvinsi(''); setCakupan(''); setJangkaWaktu(''); setNilaiInvestasi(''); setResult(null); setInvestmentRange(null);
  };

  const handleDownload = () => {
    if (!result) return;
    const regulasiSection = result.catatanRegulasi
      ? `\nCATATAN REGULASI:\n${result.catatanRegulasi}\n`
      : '\n';
    const content = `HASIL SIMULASI TAX HOLIDAY\n\nStatus: ${result.status === 'success' ? 'SESUAI PERSYARATAN' : 'TIDAK SESUAI'}\nProvinsi: ${result.provinsi}\nCakupan: ${result.cakupan}\nJangka Waktu: ${result.jangkaWaktu}\nNilai Investasi: Rp ${parseFloat(nilaiInvestasi).toLocaleString('id-ID')}\nRange Investasi Acuan: ${formatInvestmentRange(result.nilaiInvestasiMin, result.nilaiInvestasiMax)}\n\nJENIS: ${result.jenisTaxHoliday}\nRINGKASAN SIMULASI: ${result.summary}${regulasiSection}\nDETAIL INSENTIF:\n${result.detailInsentif.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nINSENTIF TAMBAHAN:\n${result.insentifTambahan.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nSYARAT:\n${result.syarat.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n---\nBerbasis Prinsip Ekonomi Syariah. Simulasi bersifat indikatif.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `simulasi-tax-holiday-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      {/* Form Left Side */}
      <div className="lg:col-span-5 space-y-10">
        <div>
           <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Parameter Estimasi</h2>
           <p className="text-gray-500 text-sm">Lengkapi data untuk memperoleh proyeksi kelayakan Tax Holiday (Pembebasan PPh Badan).</p>
        </div>

        <div className="space-y-8">
          {/* Provinsi */}
          <div className="group">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block font-semibold transition-colors group-focus-within:text-green-600">Wilayah / Provinsi</label>
            {loadError && <p className="text-xs text-red-500 mb-2">{loadError}</p>}
            <div className="relative">
              <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600/70" />
              <select
                value={provinsi}
                onChange={(e) => { setProvinsi(e.target.value); setCakupan(''); setJangkaWaktu(''); setAvailableCakupan([]); setAvailableJangkaWaktu([]); setInvestmentRange(null); setResult(null); }}
                className="w-full bg-transparent border-b border-gray-200 py-3 pl-10 pr-4 text-gray-900 text-lg font-medium appearance-none outline-none focus:border-green-600 transition-colors cursor-pointer"
              >
                <option value="" className="bg-white text-gray-400">Pilih Provinsi...</option>
                {provinces.map(p => <option key={p} value={p} className="bg-white">{p}</option>)}
              </select>
            </div>
          </div>

          {/* Cakupan */}
          <div className="group">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block font-semibold transition-colors group-focus-within:text-green-600">Cakupan / Jenis Industri</label>
            <div className="relative">
              <Layers className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600/70" />
              <select
                value={cakupan}
                onChange={(e) => { setCakupan(e.target.value); setJangkaWaktu(''); setAvailableJangkaWaktu([]); setInvestmentRange(null); setResult(null); }}
                disabled={!provinsi}
                className="w-full bg-transparent border-b border-gray-200 py-3 pl-10 pr-4 text-gray-900 text-lg font-medium appearance-none outline-none focus:border-green-600 transition-colors cursor-pointer disabled:opacity-40"
              >
                <option value="" className="bg-white text-gray-400">Pilih Cakupan...</option>
                {availableCakupan.map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
              </select>
            </div>
          </div>

          {/* Jangka Waktu */}
          <div className="group">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-3 block font-semibold transition-colors group-focus-within:text-green-600">Jangka Waktu Holiday</label>
            <div className="flex gap-3 flex-wrap">
              {availableJangkaWaktu.length > 0 ? availableJangkaWaktu.map(j => (
                <button
                  key={j}
                  onClick={() => { setJangkaWaktu(j); setInvestmentRange(null); setResult(null); }}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                    jangkaWaktu === j 
                      ? 'bg-green-50 border-green-600 text-green-700' 
                      : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {j}
                  </span>
                </button>
              )) : (
                <div className="text-sm text-gray-400 italic">Pilih wilayah dan cakupan terlebih dahulu</div>
              )}
            </div>
          </div>

          {/* Nilai Investasi */}
          <div className="group">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block font-semibold transition-colors group-focus-within:text-green-600">Nilai Investasi Direncanakan</label>
            {investmentRange && (
              <p className="mb-3 text-xs font-medium text-green-700">
                Range investasi acuan: {formatInvestmentRange(investmentRange.min, investmentRange.max)}
              </p>
            )}
            <div className="relative">
              <Banknote className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600/70" />
              <span className="absolute left-8 top-1/2 -translate-y-1/2 font-medium text-gray-400">Rp</span>
              <input
                type="text"
                value={nilaiInvestasi ? parseInt(nilaiInvestasi).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setNilaiInvestasi(raw); setResult(null);
                }}
                placeholder="0"
                className="w-full bg-transparent border-b border-gray-200 py-3 pl-16 pr-4 text-gray-900 text-lg font-medium outline-none focus:border-green-600 transition-colors placeholder:text-gray-300"
              />
              {nilaiInvestasi && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-green-700 font-medium">
                  {formatRupiah(nilaiInvestasi)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center gap-4">
          <button
            onClick={handleSimulate}
            disabled={isCalculating || !provinsi || !cakupan || !jangkaWaktu || !nilaiInvestasi}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-green-500/20 transition-all disabled:opacity-50 disabled:grayscale tracking-wide flex items-center justify-center gap-2"
          >
            {isCalculating ? (
               <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            ) : 'Simulasikan Investasi'}
          </button>
          <button
            onClick={handleReset}
            className="p-4 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            title="Reset Form"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Result Right Side */}
      <div className="lg:col-span-7">
          <div className="relative h-full min-h-[500px] rounded-[2rem] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm p-8 md:p-10 flex flex-col">
          <div className="absolute -right-32 -top-32 opacity-[0.03] pointer-events-none">
            <IslamicGeometricArt size={500} />
          </div>

          <AnimatePresence mode="wait">
            {!result && !isCalculating && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
                <Search className="w-12 h-12 text-green-500/40 mb-6" />
                <h3 className="text-2xl font-display text-gray-900 mb-2">Siap Menganalisis</h3>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                  Lengkapi parameter di sebelah kiri untuk melihat rekapitulasi kelayakan fasilitas pembebasan PPh Badan.
                </p>
              </motion.div>
            )}

            {isCalculating && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center relative z-10">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 border-2 border-gray-200 border-t-green-600 rounded-full mb-6" />
                <p className="text-green-700 font-medium tracking-widest text-sm uppercase">Memproses Data...</p>
              </motion.div>
            )}

            {result?.status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 relative z-10">
                <div className="rounded-2xl bg-red-50 border border-red-200 p-6 flex gap-4">
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-700 font-semibold mb-1">Data Tidak Ditemukan</h4>
                    <p className="text-red-600 text-sm">Kombinasi parameter yang Anda pilih tidak tersedia dalam regulasi basis data kami. Silakan sesuaikan kembali kriteria.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {result?.status === 'out_of_range' && (
              <motion.div key="oor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col relative z-10">
                <div className="rounded-2xl bg-green-50 border border-green-200 p-5 flex gap-4 mb-8">
                  <AlertTriangle className="w-6 h-6 text-green-700 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-green-800 font-semibold mb-1">Nilai Investasi Belum Sesuai</h4>
                    <p className="text-green-700/80 text-sm leading-relaxed mb-3">
                      Berdasarkan parameter yang dipilih, nilai investasi harus berada pada rentang:
                    </p>
                    <div className="px-4 py-2 bg-green-100 rounded-lg text-green-800 font-medium inline-block text-sm">
                      {formatInvestmentRange(result.nilaiInvestasiMin, result.nilaiInvestasiMax)}
                    </div>
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  <InfoCard label="Range Investasi" value={formatInvestmentRange(result.nilaiInvestasiMin, result.nilaiInvestasiMax)} icon={<Banknote className="w-5 h-5" />} />
                  <InfoCard label="Jenis Tax Holiday" value={result.jenisTaxHoliday} icon={<Banknote className="w-5 h-5" />} />
                  <InfoCard label="Ringkasan Simulasi" value={result.summary} icon={<FileText className="w-5 h-5" />} />
                  {result.catatanRegulasi && <InfoCard label="Informasi Tambahan" value={result.catatanRegulasi} icon={<Sparkles className="w-5 h-5" />} />}
                </div>
              </motion.div>
            )}

            {result?.status === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-full relative z-10">
                
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-300">
                       <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                     </div>
                     <div>
                       <h4 className="text-emerald-700 font-semibold tracking-wide">Memenuhi Syarat</h4>
                       <p className="text-gray-500 text-xs mt-0.5">Indikasi kelayakan valid</p>
                     </div>
                   </div>
                   <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:text-gray-900 transition-all shadow-sm">
                     <Download className="w-3.5 h-3.5 text-green-600" />
                     Unduh Laporan
                   </button>
                </div>

                <div className="rounded-2xl bg-green-50 border border-green-200 p-6 mb-8 text-center sm:text-left">
                  <p className="text-[10px] uppercase tracking-widest text-green-700 mb-2 font-semibold">Tipe Fasilitas</p>
                  <p className="text-green-900 text-xl font-display font-bold leading-snug">{result.jenisTaxHoliday}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-8 border-b border-gray-200 pb-8">
                  <InfoCard label="Ringkasan Simulasi" value={result.summary} icon={<FileText className="w-5 h-5" />} />
                  <InfoCard label="Kawasan Industri Terdaftar" value={result.kawasanIndustri.join(', ') || 'Tidak tersedia'} icon={<Building className="w-5 h-5" />} />
                  <InfoCard label="Jangka Waktu Fasilitas" value={result.jangkaWaktu} icon={<Clock className="w-5 h-5" />} />
                  <InfoCard label="Range Investasi" value={formatInvestmentRange(result.nilaiInvestasiMin, result.nilaiInvestasiMax)} icon={<Banknote className="w-5 h-5" />} />
                  {result.catatanRegulasi && <InfoCard label="Informasi Tambahan" value={result.catatanRegulasi} icon={<Sparkles className="w-5 h-5" />} />}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-semibold">Detail Pembebasan PPh</p>
                    <ul className="space-y-3">
                      {result.detailInsentif.map((d, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 leading-relaxed">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-semibold">Persyaratan Administratif</p>
                    <ul className="space-y-3">
                      {result.syarat.map((s, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[9px] text-gray-500">{i+1}</span>
                          </div>
                          <span className="text-sm text-gray-600 leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 text-green-600">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">{label}</p>
        <p className="text-gray-800 text-sm font-medium leading-relaxed">{value}</p>
      </div>
    </div>
  );
}
