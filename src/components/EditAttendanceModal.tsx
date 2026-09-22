import React, { useState } from 'react';
import { AttendanceRecord, AttendanceStatus, Student, Teacher } from '../types';

interface EditAttendanceModalProps {
  record: AttendanceRecord;
  students: Student[];
  teachers: Teacher[];
  currentTeacher: Teacher | null;
  onSave: (updatedRecord: AttendanceRecord) => void;
  onDelete?: (recordId: string) => void;
  onClose: () => void;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  record,
  students,
  teachers,
  currentTeacher,
  onSave,
  onDelete,
  onClose,
}) => {
  const student = students.find((s) => s.id === record.studentId || s.nis === record.nis);

  const [date, setDate] = useState<string>(record.date || '');
  const [time, setTime] = useState<string>(record.time || '07:00:00');
  const [status, setStatus] = useState<AttendanceStatus>(record.status || 'Hadir');
  const [note, setNote] = useState<string>(record.note || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    record.teacherId || currentTeacher?.id || (teachers[0]?.id ?? '')
  );
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  const isAdmin = currentTeacher?.role === 'admin' || currentTeacher?.teacherType === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const assignedTeacher =
      teachers.find((t) => t.id === selectedTeacherId) ||
      currentTeacher ||
      teachers[0];

    const teacherName = assignedTeacher?.name || record.teacherName || 'MOH. FADLI';
    const teacherRole = assignedTeacher?.role || record.teacherRole || 'guru';
    const teacherType =
      assignedTeacher?.teacherType ||
      (assignedTeacher?.role === 'admin'
        ? 'admin'
        : assignedTeacher?.homeroomClass
        ? 'wali_kelas'
        : 'guru_mapel');
    const teacherSubject =
      teacherType === 'wali_kelas'
        ? (assignedTeacher?.homeroomClass ? `Wali ${assignedTeacher.homeroomClass}` : 'Wali Kelas')
        : teacherType === 'guru_mapel'
        ? (assignedTeacher?.subject ? `Mapel ${assignedTeacher.subject}` : 'Guru Mapel')
        : 'Administrator Sekolah';

    const updated: AttendanceRecord = {
      ...record,
      date,
      time,
      status,
      note: note.trim() || `Diperbarui (${status})`,
      teacherId: assignedTeacher?.id,
      teacherName,
      teacherRole,
      teacherType,
      teacherSubject,
    };

    onSave(updated);
    onClose();
  };

  const statusOptions: { value: AttendanceStatus; label: string; icon: string; color: string; activeClass: string }[] = [
    {
      value: 'Hadir',
      label: 'Hadir',
      icon: 'fa-check',
      color: 'emerald',
      activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    },
    {
      value: 'Terlambat',
      label: 'Terlambat',
      icon: 'fa-clock',
      color: 'amber',
      activeClass: 'bg-amber-600 text-white border-amber-600 shadow-xs',
    },
    {
      value: 'Izin',
      label: 'Izin',
      icon: 'fa-file-lines',
      color: 'sky',
      activeClass: 'bg-sky-600 text-white border-sky-600 shadow-xs',
    },
    {
      value: 'Sakit',
      label: 'Sakit',
      icon: 'fa-hospital-user',
      color: 'indigo',
      activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
    },
    {
      value: 'Alpa',
      label: 'Alpa',
      icon: 'fa-xmark',
      color: 'rose',
      activeClass: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-scale-up text-slate-800 dark:text-slate-100 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-bold">
            <i className="fa-solid fa-pen-to-square"></i>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              Edit Absensi Siswa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Koreksi status atau tanggal absensi lampau untuk siswa ini
            </p>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3.5 mb-5">
          <img
            src={
              student?.photo ||
              student?.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
            }
            alt={record.studentName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30"
          />
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
              {record.studentName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>NIS: {record.nis}</span>
              <span>•</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {record.classRoom}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {record.scannedVia || 'Absensi'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tanggal Absensi (Bisa pilih tanggal lampau) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Absensi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Anda dapat memilih tanggal hari ini atau tanggal berapa saja di masa lampau yang ingin dikoreksi.
            </p>
          </div>

          {/* Jam Masuk */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Jam Masuk (WIB)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                step="1"
                value={time.length === 5 ? `${time}:00` : time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setTime(
                    now.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })
                  );
                }}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Jam Sekarang
              </button>
            </div>
          </div>

          {/* Status Kehadiran (Interactive Badge Selector) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Status Kehadiran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {statusOptions.map((opt) => {
                const isActive = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isActive
                        ? opt.activeClass
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                    }`}
                  >
                    <i className={`fa-solid ${opt.icon} text-sm`}></i>
                    <span className="text-[11px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guru Pengabsen */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Guru Pengabsen / Pencatat
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {teachers.map((tch) => (
                <option key={tch.id} value={tch.id} className="bg-white dark:bg-slate-900">
                  {tch.name} — {tch.teacherType === 'wali_kelas'
                    ? (tch.homeroomClass ? `Wali ${tch.homeroomClass}` : 'Wali Kelas')
                    : tch.teacherType === 'guru_mapel'
                    ? `Guru Mapel: ${tch.subject}`
                    : 'Admin Sekolah'}
                </option>
              ))}
            </select>
          </div>

          {/* Keterangan / Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan / Alasan
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Koreksi absensi karena izin lisan, hadir tepat waktu, dll."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Hadir Tepat Waktu', 'Izin Acara Keluarga', 'Sakit Surat Dokter', 'Koreksi Lampau', 'Terlambat karena Hujan'].map(
                (quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setNote(quick)}
                    className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    + {quick}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            {onDelete ? (
              isConfirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(record.id);
                      onClose();
                    }}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmDelete(false)}
                    className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmDelete(true)}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Hapus data absensi ini"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>Hapus</span>
                </button>
              )
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <i className="fa-solid fa-check"></i>
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
