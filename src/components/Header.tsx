import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onToggleMobileSidebar?: () => void;
  isCustomCloud?: boolean;
  cloudProjectName?: string;
  onOpenCloudSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode = false,
  onToggleDarkMode,
  onToggleMobileSidebar,
  isCustomCloud = false,
  cloudProjectName = '',
  onOpenCloudSettings,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-[#340408]/95 dark:bg-[#200204]/95 backdrop-blur-md border-b border-[#5e0d16] dark:border-[#3d060a] sticky top-0 z-20 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Sidebar Toggle + Live Date & Time */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Toggle (hidden on desktop) */}
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-rose-200 bg-[#48080f] dark:bg-[#280306] hover:bg-[#5a0c16] dark:hover:bg-[#3d060a] border border-[#6b101b] transition-colors cursor-pointer"
              title="Buka Navigasi Menu"
              aria-label="Toggle navigation"
            >
              <i className="fa-solid fa-bars text-sm"></i>
            </button>
          )}

          {/* Date & Time Display */}
          <div className="flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-xl bg-[#45070d] dark:bg-[#280306] border border-[#660f1a] dark:border-[#42060b] text-xs sm:text-sm text-rose-100 font-medium shadow-2xs">
            <i className="fa-regular fa-calendar-days text-rose-400 text-xs"></i>
            <span className="font-semibold text-white">{formattedDate}</span>
            <span className="text-rose-300/40 hidden sm:inline">•</span>
            <span className="font-mono font-bold text-rose-200">
              {formattedTime} <span className="text-[10px] font-normal text-rose-300/70">WIB</span>
            </span>
          </div>
        </div>

        {/* Right: Cloud Sync Status Indicator, PWA Install Button & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Status Sinkronisasi: Hijau (Cloud Pribadi) vs Abu-abu (Mode Offline/Lokal) */}
          {isCustomCloud ? (
            <button
              type="button"
              onClick={onOpenCloudSettings}
              className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title={`Terhubung ke Cloud Firebase Pribadi (${cloudProjectName || 'Aktif'}). Klik untuk melihat pengaturan.`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <i className="fa-solid fa-cloud text-emerald-400 text-[11px]"></i>
              <span className="hidden sm:inline font-medium">Cloud Pribadi:</span>
              <span className="font-mono text-white text-[11px] max-w-[110px] truncate group-hover:text-emerald-200">
                {cloudProjectName || 'Terhubung'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenCloudSettings}
              className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/60 text-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Aplikasi berjalan dalam Mode Offline/Lokal. Klik untuk mengatur Database Cloud Firebase Pribadi Anda."
            >
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              <i className="fa-solid fa-cloud-arrow-down text-slate-400 text-[11px]"></i>
              <span className="hidden sm:inline font-normal text-slate-300">Mode:</span>
              <span className="text-slate-200 text-[11px] group-hover:text-white">
                Offline / Lokal
              </span>
            </button>
          )}

          <PWAInstallButton variant="compact" />

          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-sm font-bold text-amber-300 bg-[#45070d] hover:bg-[#580d16] dark:bg-[#280306] dark:hover:bg-[#3d060a] border border-[#660f1a] dark:border-[#42060b] transition-all cursor-pointer shadow-2xs"
              title={isDarkMode ? 'Ganti ke Mode Terang (Maroon)' : 'Ganti ke Mode Gelap (Dark Maroon)'}
              aria-label="Toggle Dark Mode"
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400 text-base' : 'fa-moon text-rose-200 text-base'}`}></i>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
