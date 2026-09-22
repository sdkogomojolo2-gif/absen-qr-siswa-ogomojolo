import React, { useState, useEffect } from 'react';
import { SystemSettings, Teacher } from '../types';

export const CURRENT_ANNOUNCEMENT_VERSION = 'v2026.09.1';

interface DapodikAnnouncementModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
  settings: SystemSettings;
  currentTeacher?: Teacher | null;
  onUpdateSettings?: (newSettings: SystemSettings) => void;
  onNavigateToSettings?: () => void;
}

export const DapodikAnnouncementModal: React.FC<DapodikAnnouncementModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentTeacher,
  onUpdateSettings,
  onNavigateToSettings,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Admin edit form states
  const [editTitle, setEditTitle] = useState<string>(settings.announcementTitle || '');
  const [editContent, setEditContent] = useState<string>(settings.announcementContent || '');
  const [editDate, setEditDate] = useState<string>(settings.announcementDate || '');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const isAdmin = currentTeacher?.role === 'admin';

  // Sync edit form with settings
  useEffect(() => {
    setEditTitle(settings.announcementTitle || '');
    setEditContent(settings.announcementContent || '');
    setEditDate(settings.announcementDate || '');
  }, [settings]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose(dontShowAgain);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, dontShowAgain]);

  if (!isOpen) return null;

  const hasActiveAnnouncement = Boolean(
    (settings.announcementTitle && settings.announcementTitle.trim()) ||
    (settings.announcementContent && settings.announcementContent.trim())
  );

  const activeTitle = settings.announcementTitle?.trim() || 'Pemberitahuan Sistem';
  const activeDate = settings.announcementDate?.trim() || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !onUpdateSettings) return;

    const formattedDate = editDate.trim() || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    onUpdateSettings({
      ...settings,
      announcementTitle: editTitle.trim(),
      announcementContent: editContent.trim(),
      announcementDate: formattedDate,
    });

    setSaveSuccessNotice('Pemberitahuan baru berhasil disimpan dan diterbitkan!');
    setTimeout(() => {
      setSaveSuccessNotice(null);
      setIsEditing(false);
    }, 1200);
  };

  const handleClearAnnouncement = () => {
    if (!isAdmin || !onUpdateSettings) return;
    if (!window.confirm('Apakah Anda yakin ingin mengosongkan / menghapus pemberitahuan sistem ini?')) {
      return;
    }

    onUpdateSettings({
      ...settings,
      announcementTitle: '',
      announcementContent: '',
      announcementDate: '',
    });

    setEditTitle('');
    setEditContent('');
    setEditDate('');
    setIsEditing(false);
    setSaveSuccessNotice('Pemberitahuan telah berhasil dikosongkan!');
    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 1500);
  };

  return (
    <div
      id="dapodik-announcement-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#2b0407] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#5e0d16] overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-red-800 via-rose-900 to-[#3b0509] text-white p-5 sm:p-6 relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xs flex items-center justify-center text-white text-xl sm:text-2xl shadow-inner shrink-0">
                <i className="fa-solid fa-bullhorn animate-bounce"></i>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-900 shadow-2xs">
                    Pemberitahuan Sistem
                  </span>

                  {/* Access Level Badge: Admin vs Guru */}
                  {isAdmin ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/80 flex items-center gap-1 shadow-2xs">
                      <i className="fa-solid fa-shield-halved text-[9px]"></i>
                      Admin
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950 text-rose-200 border border-rose-800 flex items-center gap-1 shadow-2xs">
                      <i className="fa-solid fa-lock text-[9px] text-amber-400"></i>
                      Guru (Hanya Melihat)
                    </span>
                  )}
                </div>

                <h2
                  id="announcement-title"
                  className="text-lg sm:text-xl font-extrabold leading-tight text-white tracking-tight"
                >
                  {hasActiveAnnouncement ? activeTitle : 'Pemberitahuan Sistem'}
                </h2>
                <p className="text-xs text-rose-200/90 mt-1 flex items-center gap-2 flex-wrap">
                  <span>
                    <i className="fa-regular fa-building mr-1"></i>
                    {settings.schoolName || 'Sistem Absensi Sekolah'}
                  </span>
                  {hasActiveAnnouncement && (
                    <>
                      <span>•</span>
                      <span>
                        <i className="fa-regular fa-calendar-check mr-1"></i>
                        {activeDate}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Close Button */}
            <button
              type="button"
              onClick={() => onClose(dontShowAgain)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-rose-200 hover:text-white transition-all cursor-pointer shrink-0"
              title="Tutup"
              aria-label="Tutup"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-700 dark:text-rose-100 text-xs sm:text-sm leading-relaxed">
          {/* Notification / Toast Feedback */}
          {saveSuccessNotice && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 border border-emerald-300 dark:border-emerald-800 animate-fadeIn">
              <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400"></i>
              <span>{saveSuccessNotice}</span>
            </div>
          )}

          {/* Admin Inline Editor */}
          {isAdmin && isEditing ? (
            <form onSubmit={handleSaveAnnouncement} className="p-4 rounded-2xl bg-amber-50/80 dark:bg-[#3d080e] border-2 border-amber-400/80 dark:border-amber-600/80 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-[#6b101b]">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-xs uppercase tracking-wide">
                  <i className="fa-solid fa-pen-to-square text-amber-600 dark:text-amber-400"></i>
                  <span>{hasActiveAnnouncement ? 'Edit Pemberitahuan' : 'Buat 1 Pemberitahuan Baru'}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  Akses Admin
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-rose-200 mb-1">
                  Judul Pemberitahuan:
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Contoh: Pengumuman Absensi atau Libur Sekolah"
                  className="w-full bg-white dark:bg-[#200204] border border-amber-300 dark:border-[#73121d] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-rose-200 mb-1">
                  Tanggal Pemberitahuan (Opsional):
                </label>
                <input
                  type="text"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  placeholder="Contoh: 16 September 2026 (Kosongkan untuk otomatis hari ini)"
                  className="w-full bg-white dark:bg-[#200204] border border-amber-300 dark:border-[#73121d] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-rose-200 mb-1">
                  Isi Pesan Pemberitahuan:
                </label>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Tuliskan isi pesan atau instruksi pemberitahuan untuk dewan guru..."
                  className="w-full bg-white dark:bg-[#200204] border border-amber-300 dark:border-[#73121d] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/80 dark:border-[#6b101b]">
                {hasActiveAnnouncement ? (
                  <button
                    type="button"
                    onClick={handleClearAnnouncement}
                    className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="Kosongkan dan hapus pemberitahuan ini"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                    <span>Hapus / Kosongkan</span>
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#6b101b] text-slate-700 dark:text-rose-200 hover:bg-slate-200 dark:hover:bg-[#3d060a] text-xs font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-floppy-disk text-xs"></i>
                    <span>Simpan Pemberitahuan</span>
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          {/* If There is an Active Notification: Show that 1 notification */}
          {hasActiveAnnouncement && !isEditing ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#340408] border-2 border-rose-200 dark:border-[#6b101b] shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-700 dark:text-rose-300">
                    Pemberitahuan Aktif
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-rose-300/80 flex items-center gap-1">
                  <i className="fa-regular fa-clock text-[10px]"></i>
                  {activeDate}
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {activeTitle}
                </h3>
                <p className="text-xs text-slate-700 dark:text-rose-100 whitespace-pre-line mt-2 leading-relaxed font-medium">
                  {settings.announcementContent || 'Tidak ada isi pesan tambahan.'}
                </p>
              </div>

              {/* Author byline */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#520910] flex items-center justify-between text-[11px] text-slate-500 dark:text-rose-300/70">
                <span>
                  Oleh: <strong className="text-slate-800 dark:text-rose-200">{settings.headmasterName || 'Admin Sekolah'}</strong>
                </span>

                {/* Admin Quick Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-amber-700 dark:text-amber-300 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                      <span>Edit</span>
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleClearAnnouncement}
                      className="text-rose-600 dark:text-rose-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                      <span>Hapus / Kosongkan</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* If NO Active Notification: Show Clean Empty State */}
          {!hasActiveAnnouncement && !isEditing ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#340408]/50 border border-dashed border-slate-300 dark:border-[#6b101b] text-center space-y-3 my-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#200204] text-slate-400 dark:text-rose-300/60 flex items-center justify-center text-xl">
                <i className="fa-regular fa-bell"></i>
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-rose-200">
                  Tidak Ada Pemberitahuan Aktif
                </h4>
                <p className="text-xs text-slate-500 dark:text-rose-300/70 max-w-sm mx-auto leading-relaxed">
                  Daftar pembaruan telah dikosongkan. Jika diajukan pemberitahuan baru oleh Admin, 1 notifikasi tersebut akan langsung muncul di sini.
                </p>
              </div>

              {isAdmin && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 hover:to-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                    <span>Buat 1 Pemberitahuan Baru</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#200204] border-t border-slate-200/90 dark:border-[#5e0d16] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* 'Don't show again' checkbox */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-rose-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-red-700 focus:ring-red-600 dark:focus:ring-red-500 cursor-pointer accent-red-700"
            />
            <span>Jangan tampilkan lagi pemberitahuan ini</span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Admin Clear Notification button */}
            {isAdmin && hasActiveAnnouncement && !isEditing && (
              <button
                type="button"
                onClick={handleClearAnnouncement}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                title="Hapus pemberitahuan saat ini"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
                <span>Kosongkan Notif</span>
              </button>
            )}

            {/* Admin Edit button */}
            {isAdmin && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <i className="fa-solid fa-pen-to-square text-xs text-amber-600"></i>
                <span>{hasActiveAnnouncement ? 'Edit' : '+ Buat Notif'}</span>
              </button>
            )}

            {/* Admin link to settings */}
            {isAdmin && onNavigateToSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose(dontShowAgain);
                  onNavigateToSettings();
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#6b101b] text-slate-700 dark:text-rose-200 hover:bg-slate-200 dark:hover:bg-[#3d060a] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-sliders text-xs"></i>
                <span>Pengaturan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onClose(dontShowAgain)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 hover:to-rose-700 text-white text-xs font-extrabold shadow-md shadow-red-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-check text-xs"></i>
              <span>Tutup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
