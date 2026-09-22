import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, SystemSettings, Teacher, AttendanceStatus } from '../types';
import { formatPhoneNumberForWA, openWAAbsenteeNotification, generateWAAbsenteeConfirmationMessage } from '../utils/whatsapp';
import { isHomeroomClassMatch, formatClassLabel } from '../utils/classUtils';

interface AutoAbsenteeModalProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  settings: SystemSettings;
  currentTeacher: Teacher | null;
  onAddManualAttendance: (
    studentId: string,
    status: AttendanceStatus,
    note?: string,
    customTime?: string
  ) => void;
  onClose: () => void;
}

export const AutoAbsenteeModal: React.FC<AutoAbsenteeModalProps> = ({
  students,
  attendanceRecords,
  selectedDate,
  settings,
  currentTeacher,
  onAddManualAttendance,
  onClose,
}) => {
  const isAdmin = currentTeacher?.role === 'admin' || currentTeacher?.teacherType === 'admin';
  const isWaliKelas = !isAdmin && (currentTeacher?.teacherType === 'wali_kelas' || Boolean(currentTeacher?.homeroomClass));
  const myHomeroom = currentTeacher?.homeroomClass;

  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isWaliKelas && myHomeroom) return myHomeroom;
    return 'Semua';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Available classes
  const classesList = useMemo(() => {
    const setCls = new Set(students.map((s) => s.classRoom));
    return ['Semua', ...Array.from(setCls).sort()];
  }, [students]);

  // Records for selectedDate
  const todayRecords = useMemo(() => {
    return attendanceRecords.filter((r) => r.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

  const attendedStudentIds = useMemo(() => {
    return new Set(todayRecords.map((r) => r.studentId));
  }, [todayRecords]);

  // Students who have NOT scanned or have no attendance record yet today
  const absenteeStudents = useMemo(() => {
    return students.filter((s) => {
      // Filter by homeroom if wali kelas
      if (isWaliKelas && myHomeroom) {
        if (!isHomeroomClassMatch(s.classRoom, myHomeroom)) return false;
      } else if (selectedClass !== 'Semua') {
        if (!isHomeroomClassMatch(s.classRoom, selectedClass) && s.classRoom !== selectedClass) return false;
      }

      // Filter by search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match = s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Must NOT be in attendedStudentIds
      return !attendedStudentIds.has(s.id);
    });
  }, [students, attendedStudentIds, isWaliKelas, myHomeroom, selectedClass, searchTerm]);

  // Total students in the selected class scope
  const totalEnrolled = useMemo(() => {
    return students.filter((s) => {
      if (isWaliKelas && myHomeroom) {
        return isHomeroomClassMatch(s.classRoom, myHomeroom);
      } else if (selectedClass !== 'Semua') {
        return isHomeroomClassMatch(s.classRoom, selectedClass) || s.classRoom === selectedClass;
      }
      return true;
    }).length;
  }, [students, isWaliKelas, myHomeroom, selectedClass]);

  const totalAttended = totalEnrolled - absenteeStudents.length;

  // Handle Mark Single Student
  const handleMarkSingle = (studentId: string, status: AttendanceStatus) => {
    onAddManualAttendance(
      studentId,
      status,
      `Ditandai ${status} via Peringatan Siswa Belum Hadir`
    );
    setSuccessAlert(`Status siswa berhasil diperbarui menjadi ${status}.`);
    setTimeout(() => setSuccessAlert(null), 3000);
  };

  // Handle Mark All Absentees as Alpa
  const handleMarkAllAlpa = () => {
    if (absenteeStudents.length === 0) return;
    const confirmAction = window.confirm(
      `Apakah Anda yakin ingin menandai ${absenteeStudents.length} siswa yang belum hadir sebagai "Alpa" hari ini (${selectedDate})?`
    );
    if (!confirmAction) return;

    setIsProcessingBulk(true);
    try {
      absenteeStudents.forEach((std) => {
        onAddManualAttendance(
          std.id,
          'Alpa',
          `Otomatis ditandai Alpa pada batas masuk (${settings.lateCutoffTime} WIB)`
        );
      });
      setSuccessAlert(`Berhasil menandai ${absenteeStudents.length} siswa sebagai Alpa.`);
      setTimeout(() => setSuccessAlert(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Copy Summary of Absentees to Clipboard for Teacher / WhatsApp Group
  const handleCopySummary = async () => {
    if (absenteeStudents.length === 0) {
      alert('Tidak ada siswa yang belum hadir.');
      return;
    }

    const classLabel = selectedClass !== 'Semua' ? `Kelas ${selectedClass}` : 'Semua Kelas';
    let text = `📢 *LAPORAN SISWA BELUM HADIR / ALPHA*\n`;
    text += `🏫 *${settings.schoolName}*\n`;
    text += `📅 Tanggal: ${selectedDate}\n`;
    text += `⏰ Batas Masuk: ${settings.lateCutoffTime} WIB\n`;
    text += `🏷️ Lingkup: ${classLabel}\n`;
    text += `👥 Total Belum Hadir: *${absenteeStudents.length} Siswa*\n\n`;
    text += `*Daftar Siswa:* \n`;

    absenteeStudents.forEach((s, idx) => {
      text += `${idx + 1}. *${s.name}* (NIS: ${s.nis}) - ${s.classRoom}\n   📞 Ortu: ${s.parentPhone || 'Belum ada nomor'}\n`;
    });

    text += `\n_Mohon wali kelas / guru piket membantu konfirmasi ke orang tua._`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 3000);
    } catch {
      alert('Gagal menyalin teks ke clipboard.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-rose-600 dark:bg-rose-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Deteksi & Peringatan Siswa Belum Hadir</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-rose-700 uppercase">
                  Auto-Flag
                </span>
              </div>
              <p className="text-xs text-rose-100">
                Peringatan otomatis setelah jam masuk ({settings.lateCutoffTime} WIB) & konfirmasi WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Notice Bar / Success Alert */}
        {successAlert && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800/80 px-6 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400"></i>
            <span>{successAlert}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Top Summary Stats & Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Total Siswa Kelas
                </span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {totalEnrolled}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <i className="fa-solid fa-users text-base"></i>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Sudah Hadir / Absen
                </span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {totalAttended}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <i className="fa-solid fa-circle-check text-base"></i>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                  Belum Hadir / Alpha
                </span>
                <span className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
                  {absenteeStudents.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-700 dark:text-rose-300">
                <i className="fa-solid fa-user-xmark text-base"></i>
              </div>
            </div>
          </div>

          {/* Action & Filter Controls Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {!isWaliKelas && (
                <div className="relative min-w-[140px]">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full text-xs font-bold pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-rose-500"
                  >
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls === 'Semua' ? 'Semua Kelas' : formatClassLabel(cls)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative flex-1 min-w-[180px]">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Cari nama / NIS siswa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                title="Salin rekap siswa belum hadir untuk dikirim ke grup WA guru"
              >
                <i className={`fa-solid ${copiedAll ? 'fa-check text-emerald-600' : 'fa-copy text-slate-500'}`}></i>
                <span>{copiedAll ? 'Tersalin!' : 'Salin Rekap'}</span>
              </button>

              <button
                onClick={handleMarkAllAlpa}
                disabled={absenteeStudents.length === 0 || isProcessingBulk}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all cursor-pointer shadow-xs"
              >
                <i className="fa-solid fa-check-double text-xs"></i>
                <span>Tandai Semua Alpa ({absenteeStudents.length})</span>
              </button>
            </div>
          </div>

          {/* Absentee Student Table / List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <i className="fa-solid fa-list-check text-rose-600"></i>
                <span>Daftar Siswa Belum Melakukan Presensi Hari Ini ({selectedDate})</span>
              </h4>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                {absenteeStudents.length} Siswa
              </span>
            </div>

            {absenteeStudents.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mx-auto">
                  <i className="fa-solid fa-check"></i>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Luar Biasa! Semua Siswa Telah Terdata Hadir
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Tidak ada siswa yang belum hadir pada kelas yang dipilih untuk tanggal {selectedDate}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {absenteeStudents.map((std, index) => {
                  const hasPhone = Boolean(std.parentPhone && formatPhoneNumberForWA(std.parentPhone));

                  return (
                    <div
                      key={std.id}
                      className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center text-xs font-bold text-slate-400">
                          {index + 1}.
                        </span>
                        <img
                          src={std.photo || std.avatarUrl}
                          alt={std.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {std.name}
                            </h5>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {formatClassLabel(std.classRoom)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            NIS: {std.nis} • WA Ortu:{' '}
                            {std.parentPhone ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                {std.parentPhone}
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 italic">
                                Belum didaftarkan
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {/* WhatsApp Follow-up */}
                        <button
                          onClick={() =>
                            openWAAbsenteeNotification(
                              std,
                              selectedDate,
                              settings.lateCutoffTime,
                              settings.schoolName
                            )
                          }
                          disabled={!hasPhone}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            hasPhone
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          }`}
                          title={hasPhone ? 'Kirim WA Konfirmasi ke Orang Tua' : 'Nomor WA ortu belum terdaftar'}
                        >
                          <i className="fa-brands fa-whatsapp text-sm"></i>
                          <span className="hidden xs:inline">Hubungi Ortu</span>
                        </button>

                        {/* Fast Status Modifiers */}
                        <button
                          onClick={() => handleMarkSingle(std.id, 'Alpa')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 transition-all cursor-pointer"
                          title="Tandai sebagai Alpa"
                        >
                          Alpa
                        </button>

                        <button
                          onClick={() => handleMarkSingle(std.id, 'Izin')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 transition-all cursor-pointer"
                          title="Tandai sebagai Izin"
                        >
                          Izin
                        </button>

                        <button
                          onClick={() => handleMarkSingle(std.id, 'Sakit')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-100 dark:bg-blue-950/60 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-all cursor-pointer"
                          title="Tandai sebagai Sakit"
                        >
                          Sakit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>
            Waktu Cutoff Masuk: <strong className="text-slate-700 dark:text-slate-200">{settings.lateCutoffTime} WIB</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
