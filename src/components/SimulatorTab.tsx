import React, { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceRecord, SystemSettings, Teacher } from '../types';
import { SD_CLASSES } from '../data/initialData';
import { formatClassLabel } from '../utils/classUtils';
import { HeadmasterBarcode } from '../utils/headmasterBarcode';
import { CardBrandingModal } from './CardBrandingModal';
import { PWAInstallButton } from './PWAInstallButton';

interface SimulatorTabProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: SystemSettings;
  currentTeacher?: Teacher | null;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onRecordAttendance: (student: Student, scannedVia: 'QR Camera' | 'Manual Input' | 'Simulator') => {
    record: AttendanceRecord;
    isDuplicate: boolean;
  };
  onResetData: () => void;
  onOpenAnnouncement?: () => void;
  onResetAnnouncementStatus?: () => void;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  students,
  attendanceRecords,
  settings,
  currentTeacher,
  isDarkMode = false,
  onToggleDarkMode,
  onUpdateSettings,
  onRecordAttendance,
  onResetData,
  onOpenAnnouncement,
  onResetAnnouncementStatus,
}) => {
  const isAdmin = currentTeacher?.role === 'admin';
  const [cutoffTime, setCutoffTime] = useState(settings.lateCutoffTime);
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [headmasterName, setHeadmasterName] = useState(settings.headmasterName || 'Drs. H. Mulyadi, M.Pd');
  const [headmasterNip, setHeadmasterNip] = useState(settings.headmasterNip || '19680512 199403 1 005');
  const [headmasterBarcodeUrl, setHeadmasterBarcodeUrl] = useState(settings.headmasterBarcodeUrl || '');
  const [schoolCity, setSchoolCity] = useState(settings.schoolCity || 'Jakarta Selatan');
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress || '');
  const [announcementTitle, setAnnouncementTitle] = useState(settings.announcementTitle || '');
  const [announcementContent, setAnnouncementContent] = useState(settings.announcementContent || '');

  const [simulatedClass, setSimulatedClass] = useState<string>('Semua');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    setCutoffTime(settings.lateCutoffTime);
    setSchoolName(settings.schoolName);
    setAcademicYear(settings.academicYear);
    setHeadmasterName(settings.headmasterName || 'Drs. H. Mulyadi, M.Pd');
    setHeadmasterNip(settings.headmasterNip || '19680512 199403 1 005');
    setHeadmasterBarcodeUrl(settings.headmasterBarcodeUrl || '');
    setSchoolCity(settings.schoolCity || 'Jakarta Selatan');
    setSchoolAddress(settings.schoolAddress || '');
    setAnnouncementTitle(settings.announcementTitle || '');
    setAnnouncementContent(settings.announcementContent || '');
  }, [settings]);

  const filteredStudents = students.filter(
    (s) => simulatedClass === 'Semua' || s.classRoom === simulatedClass
  );

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      lateCutoffTime: cutoffTime,
      schoolName: schoolName.trim() || 'SD NEGERI INDONESIA',
      academicYear: academicYear.trim() || '2025/2026',
      headmasterName: headmasterName.trim(),
      headmasterNip: headmasterNip.trim(),
      headmasterBarcodeUrl: headmasterBarcodeUrl.trim(),
      schoolCity: schoolCity.trim() || 'Jakarta',
      schoolAddress: schoolAddress.trim(),
      // Only admin is permitted to update announcement content
      announcementTitle: isAdmin ? announcementTitle.trim() : (settings.announcementTitle || ''),
      announcementContent: isAdmin ? announcementContent.trim() : (settings.announcementContent || ''),
    });
    alert(
      isAdmin
        ? 'Pengaturan sekolah & data pengumuman pop-up berhasil diperbarui!'
        : 'Pengaturan berhasil diperbarui. Catatan: Pengumuman sistem terkunci dan hanya dapat diubah oleh Admin.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-sliders text-amber-600"></i>
          <span>Simulasi Presensi & Pengaturan Sistem</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Uji coba alur pemindaian cepat serta konfigurasi parameter sistem absensi sekolah.
        </p>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallButton variant="banner" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Scan Simulator (2 Cols) */}
        <div className="lg:col-span-2 bento-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-indigo-600"></i>
                <span>Simulasi Instan Scan QR Siswa</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Klik tombol &quot;Simulasi&quot; untuk menguji absensi siswa secara langsung.
              </p>
            </div>

            <select
              value={simulatedClass}
              onChange={(e) => setSimulatedClass(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Kelas</option>
              {Array.from(new Set([...SD_CLASSES, ...students.map((s) => s.classRoom)])).sort().map((cls) => (
                <option key={cls} value={cls}>
                  {formatClassLabel(cls)}
                </option>
              ))}
            </select>
          </div>

          {/* Student Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredStudents.map((student) => {
              const hasScannedToday = attendanceRecords.some(
                (r) => r.studentId === student.id && r.date === new Date().toISOString().split('T')[0]
              );

              return (
                <div
                  key={student.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    hasScannedToday
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{student.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono font-semibold">
                        NIS: {student.nis} • Kelas {student.classRoom}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const { isDuplicate } = onRecordAttendance(student, 'Simulator');
                      if (isDuplicate) {
                        alert(`⚠️ ${student.name} sudah melakukan absensi hari ini.`);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      hasScannedToday
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    <i className="fa-solid fa-qrcode text-[10px]"></i>
                    <span>{hasScannedToday ? 'Sudah Absen' : 'Simulasi'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Settings & Reset Data (1 Col) */}
        <div className="space-y-6">
          {/* Theme Mode Selector Card */}
          {onToggleDarkMode && (
            <div className="bento-card space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <i className="fa-solid fa-palette text-indigo-600"></i>
                <span>Tampilan / Tema Aplikasi</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih mode tampilan yang nyaman untuk mata saat bertugas di kelas atau gerbang sekolah:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isDarkMode) onToggleDarkMode();
                  }}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    !isDarkMode
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <i className="fa-solid fa-sun text-amber-500 text-sm"></i>
                  <span>Mode Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDarkMode) onToggleDarkMode();
                  }}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-indigo-950 border-indigo-400 text-indigo-300 shadow-xs ring-2 ring-indigo-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <i className="fa-solid fa-moon text-indigo-400 text-sm"></i>
                  <span>Mode Gelap</span>
                </button>
              </div>
            </div>
          )}

          {/* Settings Box */}
          <div className="bento-card space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <i className="fa-solid fa-gear text-indigo-600"></i>
              <span>Konfigurasi Batas Waktu & Sekolah</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Batas Masuk (Keterlambatan)
                </label>
                <input
                  type="time"
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-mono font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Absensi setelah jam ini akan dikategorikan sebagai <strong>Terlambat</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mb-2">
                  <i className="fa-solid fa-user-tie"></i>
                  <span>Data Kepala Sekolah (Untuk Tanda Tangan Laporan)</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Kepala Sekolah & Gelar
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Drs. H. Mulyadi, M.Pd"
                      value={headmasterName}
                      onChange={(e) => setHeadmasterName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      NIP Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 19680512 199403 1 005"
                      value={headmasterNip}
                      onChange={(e) => setHeadmasterNip(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  {/* Barcode TTE Kepala Sekolah */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Barcode TTE Kepala Sekolah (Muncul di Kartu Siswa)
                    </label>
                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="shrink-0 p-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <HeadmasterBarcode
                          customBarcodeUrl={headmasterBarcodeUrl}
                          size={52}
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-[10.5px] text-slate-600 font-medium leading-tight">
                          {headmasterBarcodeUrl
                            ? 'Barcode kustom tersimpan.'
                            : 'Barcode resmi SDN Kecil Ogomojolo.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-2xs">
                            <i className="fa-solid fa-upload"></i>
                            <span>Ganti File Barcode</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      setHeadmasterBarcodeUrl(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {headmasterBarcodeUrl && (
                            <button
                              type="button"
                              onClick={() => setHeadmasterBarcodeUrl('')}
                              className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors border border-slate-200"
                            >
                              <i className="fa-solid fa-rotate-left"></i>
                              <span>Reset SDN Kecil Ogomojolo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        Atur logo sekolah, Tut Wuri Handayani, dan TTD Kepsek:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsBrandingOpen(true)}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-stamp text-[10px]"></i>
                        <span>Kelola Logo & TTD Kartu Siswa</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kota/Kabupaten Tanda Tangan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Tolitoli / Jakarta Selatan"
                        value={schoolCity}
                        onChange={(e) => setSchoolCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Alamat Lengkap Sekolah
                      </label>
                      <input
                        type="text"
                        placeholder="Jl. Pendidikan No. 45"
                        value={schoolAddress}
                        onChange={(e) => setSchoolAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <i className="fa-solid fa-bullhorn"></i>
                        <span>Pemberitahuan Beranda / Pop-up Ala Dapodik</span>
                      </div>
                      {isAdmin ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                          <i className="fa-solid fa-shield-halved text-[9px]"></i>
                          Admin (Bisa Edit)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shadow-2xs">
                          <i className="fa-solid fa-lock text-[9px] text-amber-500"></i>
                          Guru (Hanya Melihat)
                        </span>
                      )}
                    </div>

                    {!isAdmin && (
                      <div className="mb-2.5 p-2.5 rounded-xl bg-amber-50/90 dark:bg-[#340408] border border-amber-300/80 dark:border-[#660f1a] flex items-start gap-2">
                        <i className="fa-solid fa-lock text-amber-600 dark:text-amber-400 text-xs mt-0.5 shrink-0"></i>
                        <p className="text-[11px] text-amber-900 dark:text-rose-200/90 leading-tight">
                          <strong>Pengaturan Dikunci:</strong> Anda masuk sebagai{' '}
                          <em>{currentTeacher ? `${currentTeacher.name} (Guru)` : 'Bukan Admin'}</em>.
                          Hanya akun Administrator yang berhak mengubah isi dan judul pengumuman.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                          <span>Judul Pengumuman Khusus (Opsional)</span>
                          {!isAdmin && (
                            <span className="text-[9px] text-rose-500 dark:text-rose-400 font-semibold">
                              (Terkunci untuk Guru)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          readOnly={!isAdmin}
                          placeholder={
                            !isAdmin
                              ? 'Terkunci - Hanya dapat diubah oleh Administrator'
                              : 'Contoh: Pengumuman Jadwal Ujian Tengah Semester'
                          }
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none ${
                            !isAdmin
                              ? 'bg-slate-100 dark:bg-[#200204]/70 border-slate-200 dark:border-[#520910] text-slate-500 dark:text-rose-300/60 cursor-not-allowed select-none'
                              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                          <span>Isi Pesan Tambahan Sekolah (Akan tampil di pop-up)</span>
                          {!isAdmin && (
                            <span className="text-[9px] text-rose-500 dark:text-rose-400 font-semibold">
                              (Terkunci untuk Guru)
                            </span>
                          )}
                        </label>
                        <textarea
                          rows={2}
                          disabled={!isAdmin}
                          readOnly={!isAdmin}
                          placeholder={
                            !isAdmin
                              ? 'Terkunci - Hanya dapat diedit oleh Administrator / Kepala Sekolah'
                              : 'Tulis pesan atau imbauan khusus untuk dewan guru...'
                          }
                          value={announcementContent}
                          onChange={(e) => setAnnouncementContent(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none resize-none ${
                            !isAdmin
                              ? 'bg-slate-100 dark:bg-[#200204]/70 border-slate-200 dark:border-[#520910] text-slate-500 dark:text-rose-300/60 cursor-not-allowed select-none'
                              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'
                          }`}
                        ></textarea>
                      </div>
                      {isAdmin && (announcementTitle || announcementContent) && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-500">Ada 1 pemberitahuan aktif</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAnnouncementTitle('');
                              setAnnouncementContent('');
                              onUpdateSettings({
                                ...settings,
                                announcementTitle: '',
                                announcementContent: '',
                                announcementDate: '',
                              });
                            }}
                            className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                            <span>Kosongkan / Hapus Notif Ini</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
              >
                Simpan Pengaturan
              </button>
            </form>
          </div>

          {/* Dapodik Pop-up Announcement Controls */}
          <div className="bento-card border-amber-200/90 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <i className="fa-solid fa-bullhorn text-amber-600"></i>
                <span>Pop-up Pemberitahuan (Dapodik)</span>
              </h3>
              {isAdmin ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-800">
                  Admin (Edit & Lihat)
                </span>
              ) : (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-400 dark:border-rose-800">
                  Guru (Hanya Lihat)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pop-up jendela rilis fitur otomatis muncul saat pengguna pertama kali membuka beranda aplikasi, dan dapat ditutup kapan saja.
              {!isAdmin && (
                <span className="text-rose-700 dark:text-rose-400 font-semibold block mt-1">
                  🔒 Akses guru: Anda hanya berhak melihat pratinjau pemberitahuan sistem.
                </span>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {onOpenAnnouncement && (
                <button
                  type="button"
                  onClick={onOpenAnnouncement}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <i className="fa-solid fa-eye text-xs"></i>
                  <span>Pratinjau Pop-up</span>
                </button>
              )}
              {onResetAnnouncementStatus && (
                <button
                  type="button"
                  onClick={onResetAnnouncementStatus}
                  className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Reset status agar pop-up muncul kembali di beranda"
                >
                  <i className="fa-solid fa-rotate-right text-xs"></i>
                  <span>Tampilkan Ulang</span>
                </button>
              )}
            </div>
          </div>

          {/* Reset Database Box */}
          <div className="bento-card border-rose-200 bg-rose-50/30 space-y-3">
            <h3 className="text-sm font-extrabold text-rose-700 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>Reset Data ke Awal (Demo)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Mengembalikan seluruh data siswa dan riwayat absensi ke data dummy sampel awal.
            </p>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 bg-rose-100 hover:bg-rose-600 text-rose-800 hover:text-white border border-rose-200 font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              Reset Data Sampel
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Reset Database</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Apakah Anda yakin ingin mereset seluruh data absensi dan data siswa kembali ke data sampel awal?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetData();
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola Logo & TTD Kartu Siswa */}
      {isBrandingOpen && (
        <CardBrandingModal
          isOpen={isBrandingOpen}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onClose={() => setIsBrandingOpen(false)}
        />
      )}
    </div>
  );
};
