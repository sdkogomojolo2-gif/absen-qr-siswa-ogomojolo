import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode = false,
  onToggleDarkMode,
  onToggleMobileSidebar,
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

        {/* Right: PWA Install Button & Dark/Light Mode Toggle */}
        <div className="flex items-center gap-2">
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
