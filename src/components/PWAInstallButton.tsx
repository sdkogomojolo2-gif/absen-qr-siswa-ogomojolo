import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'banner' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // If already installed or running in standalone mode, suppress
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback guide if browser doesn't expose prompt yet
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div
          id="pwa-install-banner"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-4 text-white shadow-lg border border-emerald-400/30"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-lg shadow-inner">
                <i className="fa-solid fa-mobile-screen-button text-emerald-100"></i>
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">Pasang Aplikasi di Layar HP (PWA)</h4>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  Akses instan 1 detik tanpa browser, layar penuh, dan tetap berfungsi saat offline!
                </p>
              </div>
            </div>
            <button
              id="btn-pwa-install-banner"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 active:scale-95 transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              <i className="fa-solid fa-download text-[11px]"></i>
              <span>{isInstalling ? 'Memasang...' : 'Install Sekarang'}</span>
            </button>
          </div>
        </div>
      ) : variant === 'sidebar' ? (
        <button
          id="btn-pwa-install-sidebar"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer border border-emerald-400/30"
          title="Pasang aplikasi absensi di layar beranda perangkat Anda"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs">
            <i className="fa-solid fa-download"></i>
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="truncate">Install Aplikasi HP</div>
            <div className="text-[10px] text-emerald-100/80 font-normal truncate">Mode Mandiri / PWA</div>
          </div>
        </button>
      ) : (
        <button
          id="btn-pwa-install-compact"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer border border-emerald-400/40"
          title="Pasang aplikasi ke layar beranda HP"
        >
          <i className="fa-solid fa-mobile-screen text-[11px]"></i>
          <span>Install Aplikasi</span>
        </button>
      )}

      {/* Panduan Instalasi Modal (untuk iOS Safari / Browser yang butuh petunjuk manual) */}
      {showIOSGuide && (
        <div
          id="pwa-install-guide-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base">
                  <i className="fa-solid fa-circle-down"></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Petunjuk Memasang Aplikasi</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Mudah & Cepat di Semua HP</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              {isIOS ? (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Untuk Pengguna iPhone / iPad (Safari):</p>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                    <li>
                      Ketuk tombol <strong>Bagikan / Share</strong> (<i className="fa-solid fa-arrow-up-from-bracket mx-1 text-sky-600"></i>) di bilah bawah browser Safari.
                    </li>
                    <li>Gulir ke bawah pada menu yang muncul.</li>
                    <li>
                      Pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                    </li>
                    <li>Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Selesai!</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Untuk Pengguna Android / Google Chrome:</p>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                    <li>
                      Ketuk menu <strong>Titik Tiga (<i className="fa-solid fa-ellipsis-vertical mx-0.5"></i>)</strong> di pojok kanan atas browser Google Chrome.
                    </li>
                    <li>
                      Pilih <strong>"Pasang aplikasi" (Install app)</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                    </li>
                    <li>Konfirmasi dengan menekan <strong>"Pasang / Install"</strong>.</li>
                    <li>Ikon resmi sekolah akan langsung muncul di layar menu HP Anda!</li>
                  </ol>
                </div>
              )}

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <i className="fa-solid fa-check-circle text-emerald-600 mt-0.5"></i>
                <span>Setelah terpasang, aplikasi dapat dibuka langsung tanpa kolom URL browser dan bisa bekerja dalam mode offline!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Saya Mengerti, Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
