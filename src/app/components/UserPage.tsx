import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import TaxHolidaySimulator from './TaxHolidaySimulator';
import TaxAllowanceSimulator from './TaxAllowanceSimulator';
import IslamicPattern, { IslamicGeometricArt } from './IslamicPattern';
import IndonesiaMap from './IndonesiaMap';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any } }
};

const simulatorTabs = [
  { id: 'holiday', label: 'Tax Holiday' },
  { id: 'allowance', label: 'Tax Allowance' },
  { id: 'super_deduction', label: 'Super Tax Deduction' },
  { id: 'bea_masuk', label: 'Bea Masuk' },
] as const;

type SimulatorTab = (typeof simulatorTabs)[number]['id'];

export default function UserPage() {
  const [activeTab, setActiveTab] = useState<SimulatorTab>('holiday');

  return (
    <div className="min-h-screen bg-white text-[#030213] overflow-hidden relative font-body selection:bg-green-500/20 selection:text-green-900">
      {/* Ambient Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-green-100/50 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-green-50/80 blur-[130px] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_15%,#000_10%,transparent_100%)] pointer-events-none" />
      
      <IslamicPattern opacity={0.04} color="#0D5C2E" />

      {/* Navbar (Floating Glass) */}
      <nav className="fixed top-6 inset-x-0 z-50 flex justify-center px-4">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between w-full max-w-5xl px-6 py-3 bg-white/90 backdrop-blur-2xl border border-gray-200 rounded-full shadow-lg shadow-gray-200/60"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src="/img/img-knks.png" 
              alt="KNKS Logo" 
              className="h-8 w-auto object-contain"
            />
            <div className="h-6 w-px bg-gray-300" />
            <div className="min-w-0">
              <p className="text-gray-900 text-sm font-semibold tracking-wide font-display truncate">SIMULATOR INSENTIF KAWASAN INDUSTRI HALAL</p>
            </div>
          </div>
          <a
            href="https://kneks.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kembali ke Web KNEKS</span>
            <span className="sm:hidden">KNEKS</span>
          </a>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="max-w-4xl flex flex-col items-center">
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-display font-bold leading-[1.1] text-gray-900 mb-6">
            Evaluasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800 italic">Investasi Anda</span><br />
            Dengan Presisi.
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-500 font-light max-w-2xl leading-relaxed mb-8">
            Platform simulasi indikatif untuk mengevaluasi kelayakan fasilitas <span className="text-green-700 font-semibold">Tax Holiday</span> dan <span className="text-green-700 font-semibold">Tax Allowance</span> di seluruh kawasan wilayah Indonesia.
          </motion.p>

          {/* Indonesia Map */}
          <motion.div
            variants={fadeUp}
            className="w-full max-w-3xl mb-12"
          >
            <IndonesiaMap className="h-[18rem] md:h-[22rem]" />
          </motion.div>
        </motion.div>

        {/* Tab Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="w-full max-w-[44rem] p-1.5 bg-gray-100 border border-gray-200 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-1.5 relative z-20 shadow-sm mb-12"
        >
          {simulatorTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-3 px-4 text-sm font-medium rounded-xl transition-all duration-500 z-10 ${
                activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-green-700'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-800 rounded-xl shadow-lg shadow-green-500/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-20 tracking-wide font-semibold">
                {tab.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Simulator Container */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-6xl relative text-left"
        >
          {/* Subtle glow behind the simulator card */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent blur-2xl -z-10 rounded-[3rem]" />
          
          <div className="bg-white border border-gray-200 rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]">
            <div className="p-1 border-b border-gray-100 flex gap-1.5 px-6 py-4 bg-gray-50">
                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
            </div>

            <div className="p-6 md:p-10 lg:p-12">
              <AnimatePresence mode="wait">
                 {activeTab === 'holiday' ? (
                   <motion.div key="holiday" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                     <TaxHolidaySimulator />
                   </motion.div>
                 ) : activeTab === 'allowance' ? (
                   <motion.div key="allowance" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                     <TaxAllowanceSimulator />
                   </motion.div>
                 ) : (
                   <motion.div
                     key={activeTab}
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.98 }}
                     transition={{ duration: 0.4, ease: 'easeOut' }}
                     className="min-h-[500px] flex items-center justify-center"
                   >
                     <div className="text-center max-w-md px-6 py-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50/80">
                       <Search className="w-12 h-12 text-green-500/50 mx-auto mb-5" />
                       <h3 className="text-2xl font-display text-gray-900 mb-2">Coming soon</h3>
                       <p className="text-sm text-gray-500 leading-relaxed">
                         Modul <span className="font-semibold text-gray-700">{simulatorTabs.find(tab => tab.id === activeTab)?.label}</span> sedang dalam proses pengembangan.
                       </p>
                     </div>
                   </motion.div>
                 )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1 }}
          className="mt-12 flex items-center justify-center gap-3 text-center"
        >
          <BookOpen className="w-4 h-4 text-green-600" />
          <p className="text-xs text-gray-400 tracking-wider font-light">
            Output simulasi ini bersifat indikatif. Harap merujuk pada regulasi resmi otoritas berwenang.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
