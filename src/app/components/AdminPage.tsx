import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Eye, ArrowLeft, Shield, Database, FileSpreadsheet, X, CheckCircle, AlertCircle, BarChart3, Landmark, RefreshCcw, Scale, LogOut, UserPlus, Users } from 'lucide-react';
import IslamicPattern from './IslamicPattern';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface UploadedFile {
  id: string;
  name: string;
  type: 'tax_holiday' | 'tax_allowance';
  uploadDate: Date;
  recordCount: number;
  status: 'active' | 'processing';
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };
  const [activeTab, setActiveTab] = useState<'holiday' | 'allowance'>('holiday');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', password: '' });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const loadAdminData = async () => {
    try {
      const [datasetResponse, userResponse] = await Promise.all([
        apiFetch<{ datasets: UploadedFile[] }>('/api/datasets'),
        apiFetch<{ users: AdminUser[] }>('/api/users'),
      ]);
      setUploadedFiles(datasetResponse.datasets.map(file => ({
        ...file,
        uploadDate: new Date(file.uploadDate),
      })));
      setUsers(userResponse.users);
    } catch (error: any) {
      showToast('error', error.message || 'Gagal memuat data admin.');
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleFileUpload = async (file: File, type: 'tax_holiday' | 'tax_allowance') => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast('error', 'Format file tidak valid. Gunakan .xlsx atau .xls');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      const response = await apiFetch<{ dataset: UploadedFile }>(`/api/datasets/${type}/upload`, {
        method: 'POST',
        body: formData,
      });
      setUploadedFiles(prev => [
        ...prev.filter(item => item.type !== type),
        { ...response.dataset, uploadDate: new Date(response.dataset.uploadDate) },
      ]);
      showToast('success', `"${file.name}" berhasil diupload dan diimpor ke database.`);
    } catch (error: any) {
      showToast('error', error.message || 'Upload gagal.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'tax_holiday' | 'tax_allowance') => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, type);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'tax_holiday' | 'tax_allowance') => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file, type);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await apiFetch<{ message: string }>(`/api/datasets/files/${id}`, { method: 'DELETE' });
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
      showToast('success', `"${name}" berhasil dihapus.`);
    } catch (error: any) {
      showToast('error', error.message || 'Gagal menghapus file.');
    }
  };

  const handlePreview = async (file: UploadedFile) => {
    try {
      const response = await apiFetch<{ rows: any[] }>(`/api/datasets/${file.type}/preview?limit=20`);
      setPreviewData(response.rows);
      setPreviewTitle(file.name);
      setShowPreview(true);
    } catch (error: any) {
      showToast('error', error.message || 'Gagal memuat preview.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      const response = await apiFetch<{ user: AdminUser }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      setUsers(prev => [response.user, ...prev]);
      setNewUser({ username: '', fullName: '', password: '' });
      showToast('success', `User "${response.user.username}" berhasil dibuat.`);
    } catch (error: any) {
      showToast('error', error.message || 'Gagal membuat user.');
    } finally {
      setIsAddingUser(false);
    }
  };

  const filteredFiles = uploadedFiles.filter(f => f.type === (activeTab === 'holiday' ? 'tax_holiday' : 'tax_allowance'));
  const curType = activeTab === 'holiday' ? 'tax_holiday' : 'tax_allowance';
  const curTypeLabel = activeTab === 'holiday' ? 'Tax Holiday' : 'Tax Allowance';
  const latestFile = filteredFiles[filteredFiles.length - 1];

  return (
    <div className="min-h-screen bg-white text-[#030213] overflow-hidden relative font-body selection:bg-green-500/20 selection:text-green-900">
      {/* Ambient Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-green-100/50 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-green-50/80 blur-[130px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_15%,#000_10%,transparent_100%)] pointer-events-none" />

      <IslamicPattern opacity={0.04} color="#0D5C2E" />

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto border backdrop-blur-xl min-w-[280px] ${
                toast.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {toast.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
              <span className="text-sm">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navbar (Floating Glass) */}
      <nav className="fixed top-6 inset-x-0 z-50 flex justify-center px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between w-full max-w-5xl px-6 py-3 bg-white/90 backdrop-blur-2xl border border-gray-200 rounded-full shadow-lg shadow-gray-200/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-600 to-green-800 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-gray-900 text-sm font-semibold tracking-wide font-display">PORTAL ADMIN</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="group flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium text-gray-600 hover:text-gray-900 transition-all bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="tracking-wide">Simulator</span>
            </a>
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium text-red-500 hover:text-red-700 transition-all bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="tracking-wide">Keluar</span>
            </button>
          </div>
        </motion.div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex flex-col lg:flex-row gap-6 lg:items-end lg:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-400/30 bg-green-50 mb-4">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              <span className="text-green-700 text-xs uppercase tracking-[0.2em] font-medium">Dashboard Admin · Dataset Manager</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 leading-tight">
              Kelola <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800">Dataset Excel</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2">Unggah dan kelola file acuan KBLI untuk fasilitas Tax Holiday dan Tax Allowance.</p>
            {isLoadingAdmin && <p className="text-xs text-gray-400 mt-2">Memuat data dari database...</p>}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Total File', value: uploadedFiles.length, color: 'text-green-700' },
              { label: 'Tax Holiday', value: uploadedFiles.filter(f => f.type === 'tax_holiday').length, color: 'text-green-600' },
              { label: 'Tax Allowance', value: uploadedFiles.filter(f => f.type === 'tax_allowance').length, color: 'text-amber-600' },
              { label: 'Total Record', value: uploadedFiles.reduce((a, f) => a + f.recordCount, 0), color: 'text-blue-600' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm"
              >
                <p className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid xl:grid-cols-5 gap-6">
          {/* Left Panel */}
          <div className="xl:col-span-2 space-y-5">

            {/* Tab Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              <h2 className="text-gray-700 text-sm font-medium mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                Pilih Dataset Aktif
              </h2>
              <div className="p-1.5 bg-gray-100 border border-gray-200 rounded-xl flex gap-1">
                {[
                  { key: 'holiday', label: 'Tax Holiday', count: uploadedFiles.filter(f => f.type === 'tax_holiday').length },
                  { key: 'allowance', label: 'Tax Allowance', count: uploadedFiles.filter(f => f.type === 'tax_allowance').length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as 'holiday' | 'allowance')}
                    className={`relative flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg transition-all duration-300 z-10 ${
                      activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-green-700'
                    }`}
                  >
                    {activeTab === tab.key && (
                      <motion.div
                        layoutId="admin-tab"
                        className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-800 rounded-lg shadow-md shadow-green-500/20"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-20 tracking-wide">{tab.label}</span>
                    <span className={`relative z-20 ml-1.5 text-[10px] ${activeTab === tab.key ? 'text-green-200' : 'text-gray-400'}`}>
                      ({tab.count})
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Upload Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.6 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              <h2 className="text-gray-700 text-sm font-medium mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-green-600" />
                Upload / Update {curTypeLabel}
              </h2>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => handleDrop(e, curType)}
                className={`rounded-2xl p-8 text-center transition-all duration-300 border-2 border-dashed ${
                  isDragging
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${
                  isDragging ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <FileSpreadsheet className={`w-7 h-7 transition-colors ${isDragging ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <p className="text-gray-600 text-sm mb-1">
                  {isUploading ? 'Mengimpor file ke database...' : isDragging ? 'Lepaskan file untuk upload' : 'Drag & drop file Excel terbaru'}
                </p>
                <p className="text-gray-400 text-xs mb-5">Format yang diterima: .xlsx atau .xls</p>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all bg-white border border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700 shadow-sm">
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Memproses...' : 'Pilih File Excel'}
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    disabled={isUploading}
                    onChange={(e) => handleInputChange(e, curType)}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              <h3 className="text-gray-700 text-sm font-medium mb-3 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-500" />
                Ringkasan Dataset Aktif
              </h3>
              {latestFile ? (
                <div className="space-y-2 text-xs">
                  <p className="text-gray-500">File: <span className="text-gray-900 font-medium">{latestFile.name}</span></p>
                  <p className="text-gray-400">Tanggal upload: {latestFile.uploadDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-gray-400">Total record: <span className="text-gray-700 font-medium">{latestFile.recordCount}</span></p>
                  <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Aktif sebagai acuan simulasi
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-xs">Belum ada file aktif untuk tipe data ini.</p>
              )}
            </motion.div>

            {/* User Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.6 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              <h3 className="text-gray-700 text-sm font-medium mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-green-600" />
                Tambah User Admin
              </h3>
              <form onSubmit={handleAddUser} className="space-y-3">
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Username"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Nama lengkap"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Password minimal 6 karakter"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <button
                  type="submit"
                  disabled={isAddingUser || !newUser.username || !newUser.password}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {isAddingUser ? 'Menyimpan...' : 'Tambah User'}
                </button>
              </form>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-3">
                  <Users className="w-3.5 h-3.5" />
                  User Terdaftar ({users.length})
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{user.fullName || user.username}</p>
                        <p className="text-[11px] text-gray-400 truncate">@{user.username}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Aktif
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Panel — File List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="xl:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-gray-700 text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Riwayat File {curTypeLabel}
              </h2>
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                {filteredFiles.length} file tersedia
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredFiles.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 rounded-xl bg-gray-50 border border-dashed border-gray-200"
                >
                  <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">Belum ada file {curTypeLabel}</p>
                  <p className="text-gray-400 text-xs mt-1">Upload file pertama untuk mengaktifkan dataset.</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filteredFiles.map((file, idx) => (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center bg-gray-50 border border-gray-200 hover:border-green-200 hover:bg-green-50/30 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-medium truncate">{file.name}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {file.uploadDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {file.recordCount} record
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-green-50 border border-green-200 text-green-700 font-medium">
                          <RefreshCcw className="w-3 h-3" />
                          Aktif
                        </span>
                        <button
                          onClick={() => handlePreview(file)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleDelete(file.id, file.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-gray-200/80"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-600" />
                    <h2 className="text-gray-900 text-sm font-semibold">Preview Data</h2>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">{previewTitle}</p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-auto flex-1 p-6">
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {Object.keys(previewData[0] || {}).map(key => (
                          <th key={key} className="px-5 py-3 text-left text-xs font-semibold text-green-700">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="px-5 py-3 text-gray-600 text-xs">{value}</td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-gray-400 text-xs mt-3">Menampilkan {previewData.length} dari total records (sample preview)</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
