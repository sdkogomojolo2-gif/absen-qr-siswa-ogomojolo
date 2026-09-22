import React, { useState, useMemo } from 'react';
import { Student, ScheduledLeave, LeaveType, SystemSettings, Teacher, AttendanceStatus } from '../types';
import { isHomeroomClassMatch, formatClassLabel } from '../utils/classUtils';
import { formatPhoneNumberForWA, generateWALeaveMessage } from '../utils/whatsapp';
import { compressLeaveLetter } from '../utils/imageCompressor';

interface ScheduledLeaveModalProps {
  students: Student[];
  leaves?: ScheduledLeave[];
  scheduledLeaves?: ScheduledLeave[];
  settings?: SystemSettings;
  currentTeacher: Teacher | null;
  initialStudentId?: string;
  onSaveLeave: (leave: ScheduledLeave, autoPopulateAttendance: boolean) => void;
  onDeleteLeave: (leaveId: string) => void;
  onClose: () => void;
}

export const ScheduledLeaveModal: React.FC<ScheduledLeaveModalProps> = ({
  students,
  leaves,
  scheduledLeaves: propScheduledLeaves,
  settings,
  currentTeacher,
  initialStudentId,
  onSaveLeave,
  onDeleteLeave,
  onClose,
}) => {
  const activeLeavesList = useMemo(() => leaves || propScheduledLeaves || [], [leaves, propScheduledLeaves]);
  const isAdmin = currentTeacher?.role === 'admin' || currentTeacher?.teacherType === 'admin';
  const isWaliKelas = !isAdmin && (currentTeacher?.teacherType === 'wali_kelas' || Boolean(currentTeacher?.homeroomClass));
  const myHomeroom = currentTeacher?.homeroomClass;

  const [activeSubTab, setActiveSubTab] = useState<'create' | 'list'>('create');
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isWaliKelas && myHomeroom) return myHomeroom;
    return 'Semua';
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('Sakit');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [reason, setReason] = useState<string>('');
  const [attachmentPhoto, setAttachmentPhoto] = useState<string>('');
  const [autoPopulate, setAutoPopulate] = useState<boolean>(true);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Preview Modal for Attachment Photo
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Available classes
  const classesList = useMemo(() => {
    const setCls = new Set(students.map((s) => s.classRoom));
    return ['Semua', ...Array.from(setCls).sort()];
  }, [students]);

  // Filtered student options for dropdown
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (isWaliKelas && myHomeroom) {
        return isHomeroomClassMatch(s.classRoom, myHomeroom);
      } else if (selectedClass !== 'Semua') {
        return isHomeroomClassMatch(s.classRoom, selectedClass) || s.classRoom === selectedClass;
      }
      return true;
    });
  }, [students, isWaliKelas, myHomeroom, selectedClass]);

  // Calculate day difference
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  }, [startDate, endDate]);

  // Handle Photo Upload with Auto-Compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 10MB.');
      return;
    }

    setIsCompressingPhoto(true);
    try {
      const compressed = await compressLeaveLetter(file);
      setAttachmentPhoto(compressed);
    } catch (err) {
      console.error('Error compressing leave letter attachment:', err);
      alert('Gagal memproses gambar surat izin. Silakan coba file lain.');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  // Submit Leave Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStudentId) {
      setFormError('Silakan pilih siswa terlebih dahulu.');
      return;
    }

    if (!startDate || !endDate) {
      setFormError('Silakan tentukan tanggal mulai dan tanggal selesai.');
      return;
    }

    if (startDate > endDate) {
      setFormError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
      return;
    }

    const targetStudent = students.find((s) => s.id === selectedStudentId);
    if (!targetStudent) {
      setFormError('Data siswa tidak ditemukan.');
      return;
    }

    const newLeave: ScheduledLeave = {
      id: `leave_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: targetStudent.id,
      nis: targetStudent.nis,
      studentName: targetStudent.name,
      classRoom: targetStudent.classRoom,
      type: leaveType,
      startDate,
      endDate,
      reason: reason.trim() || `Izin/Sakit selama ${durationDays} hari`,
      attachmentPhoto: attachmentPhoto || undefined,
      createdAt: new Date().toISOString(),
      recordedBy: currentTeacher?.name || 'Wali Kelas',
      status: 'Aktif',
    };

    onSaveLeave(newLeave, autoPopulate);
    setFormSuccess(
      `Permohonan ${leaveType} ananda ${targetStudent.name} (${durationDays} hari) berhasil dicatat!`
    );

    // Reset Form
    setSelectedStudentId('');
    setReason('');
    setAttachmentPhoto('');
    setStartDate(todayStr);
    setEndDate(todayStr);

    setTimeout(() => {
      setFormSuccess(null);
      setActiveSubTab('list');
    }, 1500);
  };

  // Filtered leaves list
  const filteredLeaves = useMemo(() => {
    return activeLeavesList.filter((l) => {
      if (isWaliKelas && myHomeroom) {
        if (!isHomeroomClassMatch(l.classRoom, myHomeroom)) return false;
      } else if (selectedClass !== 'Semua') {
        if (!isHomeroomClassMatch(l.classRoom, selectedClass) && l.classRoom !== selectedClass) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          l.studentName.toLowerCase().includes(q) ||
          l.nis.toLowerCase().includes(q) ||
          l.reason.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activeLeavesList, isWaliKelas, myHomeroom, selectedClass, searchTerm]);

  // Send WA Confirmation to Parent
  const handleSendWA = (leave: ScheduledLeave) => {
    const student = students.find((s) => s.id === leave.studentId);
    if (!student || !student.parentPhone) {
      alert('Nomor HP Orang Tua belum terdaftar untuk siswa ini.');
      return;
    }

    const formatted = formatPhoneNumberForWA(student.parentPhone);
    const msg = generateWALeaveMessage(student, leave, settings.schoolName);
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Input Izin / Sakit Terjadwal & Surat Dokter</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-700 uppercase">
                  Multi-Hari
                </span>
              </div>
              <p className="text-xs text-indigo-100">
                Pencatatan izin / sakit berjangka beserta upload surat dokter & sinkronisasi absensi
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'create'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <i className="fa-solid fa-file-circle-plus"></i>
            <span>Input Permohonan Izin Baru</span>
          </button>

          <button
            onClick={() => setActiveSubTab('list')}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'list'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <i className="fa-solid fa-list-ul"></i>
            <span>Daftar & Riwayat Izin ({activeLeavesList.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Notifications */}
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-rose-600"></i>
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600"></i>
              <span>{formSuccess}</span>
            </div>
          )}

          {/* TAB 1: CREATE FORM */}
          {activeSubTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Select Student */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-user-graduate text-indigo-600"></i>
                    <span>Pilih Siswa *</span>
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih Siswa yang Mengajukan Izin --</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nis}) - {formatClassLabel(s.classRoom)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Leave Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kategori Izin *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Sakit', 'Izin', 'Dispensasi'] as LeaveType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLeaveType(type)}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          leaveType === type
                            ? type === 'Sakit'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : type === 'Izin'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            type === 'Sakit'
                              ? 'fa-heart-pulse'
                              : type === 'Izin'
                              ? 'fa-envelope-open-text'
                              : 'fa-award'
                          } text-xs`}
                        ></i>
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Durasi Permohonan
                  </label>
                  <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                      Total Hari Izin:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white font-mono">
                      {durationDays} Hari
                    </span>
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-calendar-day text-slate-500"></i>
                    <span>Tanggal Mulai *</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-calendar-day text-slate-500"></i>
                    <span>Tanggal Selesai *</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Reason / Keterangan */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-pen-to-square text-slate-500"></i>
                    <span>Alasan / Keterangan Izin</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Demam tinggi & dirawat di Puskesmas, Acara Keluarga di Luar Kota..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Upload Surat Dokter / Bukti Surat */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-file-medical text-rose-500"></i>
                      <span>Lampiran Surat Dokter / Surat Izin Orang Tua (Foto / Scan)</span>
                    </span>
                    {attachmentPhoto && (
                      <button
                        type="button"
                        onClick={() => setAttachmentPhoto('')}
                        className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className={`flex-1 w-full flex items-center justify-center gap-2 p-3.5 border-2 border-dashed ${isCompressingPhoto ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40'} rounded-2xl text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-pointer transition-all`}>
                      {isCompressingPhoto ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin text-indigo-600 text-sm"></i>
                          <span>Mengompres Foto Bukti Surat...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up text-indigo-600 text-sm"></i>
                          <span>{attachmentPhoto ? 'Ganti Foto Surat Bukti (Auto-Kompres)' : 'Pilih Foto Surat Dokter / Izin (Auto-Kompres Hemat Data)'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isCompressingPhoto}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {attachmentPhoto && (
                      <div className="relative group shrink-0">
                        <img
                          src={attachmentPhoto}
                          alt="Surat Dokter"
                          onClick={() => setPreviewImage(attachmentPhoto)}
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 ring-2 ring-indigo-500/20 shadow-xs cursor-pointer hover:opacity-90"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 text-[8px]">
                          <i className="fa-solid fa-magnifying-glass"></i>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto Populate Daily Attendance Checkbox */}
                <div className="md:col-span-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="autoPopulate"
                    checked={autoPopulate}
                    onChange={(e) => setAutoPopulate(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="autoPopulate" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <strong className="block font-bold text-slate-900 dark:text-slate-100">
                      Otomatis Catat Presensi Harian ({leaveType})
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400">
                      Sistem akan langsung mengisi data absensi harian siswa sebagai "{leaveType}" untuk rentang tanggal {startDate} s/d {endDate}.
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Simpan Permohonan Izin</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: LIST OF SCHEDULED LEAVES */}
          {activeSubTab === 'list' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 flex-1">
                  {!isWaliKelas && (
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="text-xs font-bold px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                    >
                      {classesList.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls === 'Semua' ? 'Semua Kelas' : formatClassLabel(cls)}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="relative flex-1">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      placeholder="Cari siswa atau alasan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setActiveSubTab('create')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Tambah Izin Baru</span>
                </button>
              </div>

              {/* Table / List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {filteredLeaves.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mx-auto">
                      <i className="fa-solid fa-envelope-open"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Belum Ada Permohonan Izin / Sakit Terjadwal
                    </h4>
                    <p className="text-xs text-slate-500">
                      Klik tombol "Input Permohonan Izin Baru" untuk mencatat izin siswa.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLeaves.map((leave) => {
                      const isOngoing = todayStr >= leave.startDate && todayStr <= leave.endDate;

                      return (
                        <div
                          key={leave.id}
                          className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                        >
                          {/* Student & Leave Info */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                  leave.type === 'Sakit'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                    : leave.type === 'Izin'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                }`}
                              >
                                {leave.type}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {leave.studentName}
                              </h5>
                              <span className="text-xs font-mono text-slate-400 font-semibold">
                                ({leave.nis})
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {formatClassLabel(leave.classRoom)}
                              </span>
                              {isOngoing && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse">
                                  ● Berlangsung Hari Ini
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                              <span className="flex items-center gap-1 font-semibold">
                                <i className="fa-solid fa-calendar text-slate-400"></i>
                                {leave.startDate} s/d {leave.endDate}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="italic text-slate-500 dark:text-slate-400">
                                "{leave.reason}"
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-400">
                              Dicatat oleh: {leave.recordedBy || 'Wali Kelas'}
                            </div>
                          </div>

                          {/* Actions & Attachment */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            {leave.attachmentPhoto && (
                              <button
                                onClick={() => setPreviewImage(leave.attachmentPhoto!)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                                title="Lihat foto surat dokter / izin"
                              >
                                <i className="fa-solid fa-file-image text-indigo-600"></i>
                                <span>Lihat Surat</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleSendWA(leave)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
                              title="Kirim konfirmasi ke WhatsApp Orang Tua"
                            >
                              <i className="fa-brands fa-whatsapp text-sm"></i>
                              <span className="hidden sm:inline">Konfirmasi WA</span>
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus permohonan izin ananda ${leave.studentName}?`)) {
                                  onDeleteLeave(leave.id);
                                }
                              }}
                              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                              title="Hapus Data Izin"
                            >
                              <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Total Izin Terjadwal: <strong className="text-slate-700 dark:text-slate-200">{activeLeavesList.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Attachment Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <i className="fa-solid fa-file-medical text-rose-500"></i>
                <span>Bukti Surat Keterangan Dokter / Surat Izin</span>
              </h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-950 rounded-2xl flex items-center justify-center p-2">
              <img
                src={previewImage}
                alt="Bukti Surat"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
