import React from 'react';
import { ActiveTab, SystemSettings, Teacher } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  todayCount: number;
  settings: SystemSettings;
  currentTeacher: Teacher | null;
  onOpenLogin: () => void;
  onLogout?: () => void;
  onOpenTeacherManage: () => void;
  onOpenCloudSync: () => void;
  onOpenAdminProfile?: () => void;
  onOpenAnnouncement?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  todayCount,
  settings,
  currentTeacher,
  onOpenLogin,
  onLogout,
  onOpenTeacherManage,
  onOpenCloudSync,
  onOpenAdminProfile,
  onOpenAnnouncement,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'DASHBOARD & REKAP',
      icon: 'fa-solid fa-chart-pie',
      badge: null,
    },
    {
      id: 'scanner' as ActiveTab,
      label: 'SCAN QR ABSENSI',
      icon: 'fa-solid fa-qrcode',
      badge: 'LIVE',
      badgeClass: 'bg-rose-500 text-white animate-pulse',
    },
    {
      id: 'students' as ActiveTab,
      label: 'DATA SISWA & KARTU',
      icon: 'fa-solid fa-id-card',
      badge: null,
    },
    {
      id: 'simulator' as ActiveTab,
      label: 'PENGATURAN',
      icon: 'fa-solid fa-sliders',
      badge: null,
    },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 text-rose-100">
      {/* Top: School Brand Identity */}
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#5e0d16] dark:border-[#380509]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-900 border border-rose-500/30 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-red-950/50 shrink-0">
              <i className="fa-solid fa-qrcode"></i>
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm leading-tight text-white truncate">
                {settings.schoolName || 'Sistem Absensi'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-[#520910] text-rose-200 border border-[#781420]">
                  TA {settings.academicYear}
                </span>
                <span className="text-[10px] text-rose-300/70 truncate">
                  Presensi QR
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Announcement Bell (Opens single system notification modal) */}
            {onOpenAnnouncement && (
              <button
                type="button"
                onClick={onOpenAnnouncement}
                className="p-1.5 rounded-lg text-rose-300 hover:text-amber-300 hover:bg-[#48080f] transition-colors relative"
                title="Pemberitahuan Sistem"
              >
                <i className="fa-solid fa-bell text-sm"></i>
                {(settings.announcementTitle || settings.announcementContent) && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </button>
            )}

            {/* Close button for Mobile Drawer */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-[#48080f] transition-colors"
                title="Tutup Menu"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            )}
          </div>
        </div>

        {/* Section: Menu Navigasi Utama */}
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-rose-300/60 mb-2 px-3">
            Menu Navigasi
          </div>
          <nav className="space-y-1.5">
            {/* 1. DASHBOARD & REKAP */}
            {/* 2. SCAN QR ABSENSI */}
            {/* 3. DATA SISWA & KARTU */}
            {/* 4. PENGATURAN */}
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-red-700 to-rose-800 text-white shadow-sm shadow-red-950/40 border border-red-500/30'
                      : 'text-rose-200 hover:bg-[#45070d] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i
                      className={`${item.icon} text-sm w-4 text-center ${
                        isActive ? 'text-white' : 'text-rose-300/70'
                      }`}
                    ></i>
                    <span className="tracking-wide uppercase">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.id === 'dashboard' && todayCount > 0 && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-rose-950/90 text-white'
                            : 'bg-[#48080f] text-rose-200 border border-[#6b101b]'
                        }`}
                      >
                        {todayCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* 5. SINKRON DATA (WAJIB TIAP HARI SELESAI ABSEN) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onOpenCloudSync();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex flex-col p-3 rounded-2xl text-left font-bold transition-all cursor-pointer bg-gradient-to-r from-[#4d0910] via-[#5c0d16] to-[#48080f] hover:from-[#5e0e18] hover:to-[#550a11] border border-rose-500/40 hover:border-rose-400 text-white shadow-md shadow-red-950/50 group"
                title="Sinkronisasi Data Presensi Harian ke Cloud Firebase (Wajib Tiap Hari Selesai Absen)"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs group-hover:scale-110 transition-transform shrink-0 border border-rose-400/30">
                      <i className="fa-solid fa-cloud-arrow-up animate-pulse text-amber-300"></i>
                    </div>
                    <span className="text-xs font-black tracking-wide uppercase text-white truncate">
                      SINKRON DATA
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 shrink-0 shadow-2xs">
                    WAJIB
                  </span>
                </div>
                <div className="text-[10px] text-rose-200/80 mt-1 pl-9 leading-tight font-medium">
                  (WAJIB TIAP HARI SELESAI ABSEN)
                </div>
              </button>

              {/* Install PWA Button */}
              <div className="pt-2">
                <PWAInstallButton variant="sidebar" />
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* 6. DATA GURU & PENGGUNA */}
      <div className="pt-4 border-t border-[#5e0d16] dark:border-[#380509] mt-6">
        <div className="text-[10px] font-black uppercase tracking-wider text-rose-300/80 mb-2 px-1 flex items-center justify-between">
          <span>DATA GURU & PENGGUNA</span>
          {currentTeacher?.role === 'admin' && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Admin
            </span>
          )}
        </div>

        {currentTeacher ? (
          <div className="bg-[#3d060a] dark:bg-[#200204] border border-[#610e16] dark:border-[#3d060b] rounded-2xl p-3 shadow-2xs">
            {/* Teacher Identity Card */}
            <div className="flex items-start gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                  currentTeacher.role === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-rose-700 text-white shadow-xs'
                }`}
              >
                <i
                  className={
                    currentTeacher.role === 'admin'
                      ? 'fa-solid fa-shield-halved text-xs'
                      : 'fa-solid fa-user-tie text-xs'
                  }
                ></i>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-xs text-white truncate" title={currentTeacher.name}>
                  {currentTeacher.name}
                </div>
                <div className="text-[10px] text-rose-300/70 truncate">
                  {currentTeacher.email || 'Guru Terdaftar'}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span
                    className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      currentTeacher.role === 'admin'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : currentTeacher.homeroomClass
                        ? 'bg-[#5c0d15] text-rose-200 border border-[#7d1420]'
                        : 'bg-[#48080f] text-rose-300'
                    }`}
                  >
                    {currentTeacher.role === 'admin'
                      ? 'Admin Utama'
                      : currentTeacher.homeroomClass
                      ? `Wali Kelas ${currentTeacher.homeroomClass}`
                      : currentTeacher.subject || 'Guru Mapel'}
                  </span>
                  {currentTeacher.nip && (
                    <span className="text-[9px] text-rose-300/70 font-mono">
                      NIP: {currentTeacher.nip}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions for Teacher / Admin */}
            <div className="mt-3 pt-2.5 border-t border-[#5e0d16]/70 dark:border-[#380509] space-y-1">
              {currentTeacher.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenTeacherManage();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#4a080f] text-[11px] font-medium text-rose-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-users-gear text-rose-400 text-xs w-4"></i>
                  <span>Kelola Akun Guru & Pengguna</span>
                </button>
              )}

              {currentTeacher.role === 'admin' && onOpenAdminProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAdminProfile();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#4a080f] text-[11px] font-medium text-rose-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-school text-rose-400 text-xs w-4"></i>
                  <span>Profil Sekolah & Kepala Sekolah</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  } else {
                    onOpenLogin();
                  }
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/80 text-[11px] font-semibold text-rose-300 hover:text-rose-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-right-from-bracket text-xs w-4"></i>
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#3d060a] dark:bg-[#200204] border border-[#610e16] dark:border-[#3d060b] rounded-2xl p-3 text-center">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-[#48080f] flex items-center justify-center text-rose-300 text-xs">
              <i className="fa-solid fa-user-lock"></i>
            </div>
            <p className="text-xs font-bold text-white">Belum Masuk Akun Guru</p>
            <p className="text-[10px] text-rose-300/70 mt-0.5 mb-2.5">
              Masuk untuk tanda tangan otomatis & izin khusus
            </p>
            <button
              type="button"
              onClick={() => {
                onOpenLogin();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2 px-3 bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-right-to-bracket text-xs"></i>
              <span>Login Akun Guru & Pengguna</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Locked Sidebar (Fixed / Sticky to Viewport so it doesn't scroll with content) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 shrink-0 bg-[#340408] dark:bg-[#1a0203] border-r border-[#5e0d16] dark:border-[#380509] z-30 select-none overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Overlay (Off-canvas sidebar when opened via mobile hamburger button) */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          ></div>

          {/* Drawer Panel */}
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full bg-[#340408] dark:bg-[#1a0203] border-r border-[#5e0d16] z-50 overflow-y-auto shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* 3. Mobile Sticky Bottom Navigation Bar (for convenient quick navigation on mobile phones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#340408]/95 dark:bg-[#1a0203]/95 backdrop-blur-md border-t border-[#5e0d16] z-40 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#4d0910] text-white border border-[#73121d] font-bold shadow-xs'
                    : 'text-rose-300/70 hover:text-white'
                }`}
              >
                <i className={`${item.icon} text-sm mb-0.5 ${isActive ? 'text-white' : 'text-rose-400'}`}></i>
                <span className="text-[9px] font-bold truncate max-w-full tracking-tighter">
                  {item.id === 'scanner' ? 'SCAN QR' : item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
