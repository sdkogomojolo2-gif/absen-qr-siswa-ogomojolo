import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Student, BehaviorLog, BehaviorType, SystemSettings, Teacher } from '../types';
import { isHomeroomClassMatch, formatClassLabel } from '../utils/classUtils';
import { formatPhoneNumberForWA, generateWABehaviorMessage } from '../utils/whatsapp';

interface StudentBehaviorModalProps {
  students: Student[];
  behaviorLogs: BehaviorLog[];
  settings: SystemSettings;
  currentTeacher: Teacher | null;
  targetStudentId?: string | null;
  initialStudentId?: string | null;
  onSaveBehaviorLog: (log: BehaviorLog) => void;
  onDeleteBehaviorLog: (logId: string) => void;
  onClose: () => void;
}

// Preset Quick Templates
const PRESET_BEHAVIORS: Array<{
  title: string;
  type: BehaviorType;
  points: number;
  category: string;
  desc: string;
  icon: string;
}> = [
  {
    title: 'Seragam Rapi & Atribut Lengkap',
    type: 'positive',
    points: 5,
    category: 'Kerapihan',
    desc: 'Memakai seragam sesuai hari, dasi, sabuk, dan sepatu hitam bersih.',
    icon: 'fa-shirt',
  },
  {
    title: 'Membantu Teman / Guru',
    type: 'positive',
    points: 5,
    category: 'Sikap / Karakter',
    desc: 'Menolong teman yang kesulitan atau membantu guru menyiapkan kelas.',
    icon: 'fa-hand-holding-heart',
  },
  {
    title: 'Menjaga & Membersihkan Kelas',
    type: 'positive',
    points: 5,
    category: 'Kebersihan',
    desc: 'Melaksanakan piket kelas dengan penuh tanggung jawab.',
    icon: 'fa-broom',
  },
  {
    title: 'Prestasi Akademik / Non-Akademik',
    type: 'positive',
    points: 15,
    category: 'Prestasi',
    desc: 'Meraih juara lomba atau prestasi membanggakan bagi sekolah.',
    icon: 'fa-trophy',
  },
  {
    title: 'Mengerjakan Tugas Tepat Waktu',
    type: 'positive',
    points: 5,
    category: 'Kedisiplinan',
    desc: 'Mengumpulkan tugas dan PR tepat waktu dengan hasil rapi.',
    icon: 'fa-book-open',
  },
  {
    title: 'Terlambat Masuk Sekolah / Kelas',
    type: 'negative',
    points: -5,
    category: 'Kedisiplinan',
    desc: 'Hadir melebihi jam batas masuk yang ditentukan sekolah.',
    icon: 'fa-clock',
  },
  {
    title: 'Seragam / Atribut Tidak Lengkap',
    type: 'negative',
    points: -5,
    category: 'Kerapihan',
    desc: 'Tidak memakai atribut wajib (dasi/topi/sabuk) atau seragam tidak rapi.',
    icon: 'fa-triangle-exclamation',
  },
  {
    title: 'Membuang Sampah Sembarangan',
    type: 'negative',
    points: -5,
    category: 'Kebersihan',
    desc: 'Meninggalkan sampah di laci meja atau membuang di luar tempat sampah.',
    icon: 'fa-trash-can',
  },
  {
    title: 'Gaduh / Mengganggu Belajar di Kelas',
    type: 'negative',
    points: -5,
    category: 'Kedisiplinan',
    desc: 'Bercanda berlebihan atau mengganggu konsentrasi teman saat pelajaran.',
    icon: 'fa-volume-high',
  },
  {
    title: 'Tidak Mengerjakan Tugas / PR',
    type: 'negative',
    points: -5,
    category: 'Kedisiplinan',
    desc: 'Tidak menyelesaikan tugas atau PR yang diberikan guru.',
    icon: 'fa-circle-xmark',
  },
];

export const StudentBehaviorModal: React.FC<StudentBehaviorModalProps> = ({
  students,
  behaviorLogs,
  settings,
  currentTeacher,
  targetStudentId,
  initialStudentId,
  onSaveBehaviorLog,
  onDeleteBehaviorLog,
  onClose,
}) => {
  const effectiveInitialStudentId = initialStudentId || targetStudentId || '';
  const isAdmin = currentTeacher?.role === 'admin' || currentTeacher?.teacherType === 'admin';
  const isWaliKelas = !isAdmin && (currentTeacher?.teacherType === 'wali_kelas' || Boolean(currentTeacher?.homeroomClass));
  const myHomeroom = currentTeacher?.homeroomClass;

  const [activeTab, setActiveTab] = useState<'create' | 'journal' | 'recap'>('create');
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isWaliKelas && myHomeroom) return myHomeroom;
    return 'Semua';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('Semua');

  // Form State
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [studentId, setStudentId] = useState<string>(effectiveInitialStudentId);
  const [logType, setLogType] = useState<BehaviorType>('positive');
  const [category, setCategory] = useState<string>('Kedisiplinan');
  const [title, setTitle] = useState<string>('');
  const [points, setPoints] = useState<number>(5);
  const [date, setDate] = useState<string>(todayStr);
  const [description, setDescription] = useState<string>('');
  const [formAlert, setFormAlert] = useState<string | null>(null);

  // Available classes
  const classesList = useMemo(() => {
    const setCls = new Set(students.map((s) => s.classRoom));
    return ['Semua', ...Array.from(setCls).sort()];
  }, [students]);

  // Filtered students for dropdown
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

  // Apply Quick Preset
  const handleApplyPreset = (preset: (typeof PRESET_BEHAVIORS)[0]) => {
    setLogType(preset.type);
    setCategory(preset.category);
    setTitle(preset.title);
    setPoints(preset.points);
    setDescription(preset.desc);
  };

  // Submit Behavior Log
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId) {
      alert('Silakan pilih siswa terlebih dahulu.');
      return;
    }

    if (!title.trim()) {
      alert('Silakan isi judul catatan / perilaku.');
      return;
    }

    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) return;

    const newLog: BehaviorLog = {
      id: `bhv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: targetStudent.id,
      nis: targetStudent.nis,
      studentName: targetStudent.name,
      classRoom: targetStudent.classRoom,
      date,
      type: logType,
      category,
      title: title.trim(),
      points: Number(points),
      description: description.trim(),
      recordedBy: currentTeacher?.name || 'Wali Kelas',
      createdAt: new Date().toISOString(),
    };

    onSaveBehaviorLog(newLog);
    setFormAlert(`Catatan untuk ${targetStudent.name} (${points > 0 ? '+' : ''}${points} Poin) berhasil disimpan!`);

    // Reset Form
    setTitle('');
    setDescription('');
    setPoints(5);

    setTimeout(() => {
      setFormAlert(null);
      setActiveTab('journal');
    }, 1200);
  };

  // Calculate points balance per student
  const studentStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalPoints: number;
        positiveCount: number;
        negativeCount: number;
        logsCount: number;
      }
    >();

    behaviorLogs.forEach((log) => {
      const curr = map.get(log.studentId) || {
        totalPoints: 100, // Base default starting score
        positiveCount: 0,
        negativeCount: 0,
        logsCount: 0,
      };

      curr.totalPoints += log.points;
      if (log.type === 'positive') curr.positiveCount += 1;
      if (log.type === 'negative') curr.negativeCount += 1;
      curr.logsCount += 1;

      map.set(log.studentId, curr);
    });

    return map;
  }, [behaviorLogs]);

  // Filtered Behavior Logs for Journal Tab
  const filteredLogs = useMemo(() => {
    return behaviorLogs.filter((l) => {
      if (isWaliKelas && myHomeroom) {
        if (!isHomeroomClassMatch(l.classRoom, myHomeroom)) return false;
      } else if (selectedClass !== 'Semua') {
        if (!isHomeroomClassMatch(l.classRoom, selectedClass) && l.classRoom !== selectedClass) return false;
      }

      if (filterType !== 'Semua' && l.type !== filterType) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          l.studentName.toLowerCase().includes(q) ||
          l.nis.toLowerCase().includes(q) ||
          l.title.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [behaviorLogs, isWaliKelas, myHomeroom, selectedClass, filterType, searchTerm]);

  // Recap Table data for evaluation
  const recapData = useMemo(() => {
    return filteredStudents.map((s) => {
      const stats = studentStatsMap.get(s.id) || {
        totalPoints: 100,
        positiveCount: 0,
        negativeCount: 0,
        logsCount: 0,
      };

      let predicate = 'Baik (B)';
      let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      if (stats.totalPoints >= 115) {
        predicate = 'Sangat Baik (A)';
        badgeClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
      } else if (stats.totalPoints >= 95) {
        predicate = 'Baik (B)';
        badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      } else if (stats.totalPoints >= 80) {
        predicate = 'Cukup (C)';
        badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      } else {
        predicate = 'Perlu Bimbingan (D)';
        badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      }

      return {
        student: s,
        stats,
        predicate,
        badgeClass,
      };
    });
  }, [filteredStudents, studentStatsMap]);

  // Send WhatsApp Report to Parent
  const handleSendWA = (log: BehaviorLog) => {
    const student = students.find((s) => s.id === log.studentId);
    if (!student || !student.parentPhone) {
      alert('Nomor WhatsApp orang tua belum terdaftar.');
      return;
    }

    const stats = studentStatsMap.get(log.studentId) || { totalPoints: 100 };
    const formatted = formatPhoneNumberForWA(student.parentPhone);
    const msg = generateWABehaviorMessage(student, log, stats.totalPoints, settings.schoolName);
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Export Behavior Recap to Excel
  const handleExportExcel = () => {
    if (recapData.length === 0) {
      alert('Tidak ada data rekap untuk diekspor.');
      return;
    }

    const rows = recapData.map((item, idx) => ({
      No: idx + 1,
      NIS: item.student.nis,
      'Nama Siswa': item.student.name,
      Kelas: item.student.classRoom,
      'Jenis Kelamin': item.student.gender,
      'Total Skor Karakter': item.stats.totalPoints,
      'Catatan Positif (+)': item.stats.positiveCount,
      'Catatan Pelanggaran (-)': item.stats.negativeCount,
      'Predikat Sikap Rapor': item.predicate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Karakter');

    const fileName = `Jurnal_Karakter_Siswa_${selectedClass}_${todayStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-amber-600 dark:bg-amber-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl">
              <i className="fa-solid fa-star"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Jurnal & Poin Kedisiplinan Siswa</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-amber-700 uppercase">
                  Evaluasi Rapor
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Pencatatan perkembangan karakter, poin kebaikan, dan kedisiplinan siswa
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 pt-3 gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>Catat Poin & Jurnal Baru</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'journal'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <i className="fa-solid fa-book"></i>
            <span>Buku Jurnal Riwayat ({behaviorLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recap')}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'recap'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <i className="fa-solid fa-chart-simple"></i>
            <span>Rekap Evaluasi Rapor</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Notification Alert */}
          {formAlert && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600"></i>
              <span>{formAlert}</span>
            </div>
          )}

          {/* TAB 1: FORM INPUT */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Quick Preset Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-bolt text-amber-500"></i>
                  <span>Pilihan Cepat (1-Klik Template Catatan)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {PRESET_BEHAVIORS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs flex flex-col justify-between gap-1 shadow-2xs hover:scale-101 ${
                        preset.type === 'positive'
                          ? 'bg-emerald-50/60 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50/60 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <i className={`fa-solid ${preset.icon} text-sm`}></i>
                        <span
                          className={`font-mono font-black text-[10px] px-1.5 py-0.2 rounded-md ${
                            preset.type === 'positive'
                              ? 'bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                              : 'bg-rose-200/80 text-rose-800 dark:bg-rose-900 dark:text-rose-300'
                          }`}
                        >
                          {preset.points > 0 ? `+${preset.points}` : preset.points}
                        </span>
                      </div>
                      <span className="font-bold text-[11px] leading-tight line-clamp-2 mt-1">
                        {preset.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Select Student */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-user-graduate text-amber-600"></i>
                    <span>Pilih Siswa *</span>
                  </label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nis}) - {formatClassLabel(s.classRoom)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Log Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Jenis Catatan *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLogType('positive');
                        if (points < 0) setPoints(5);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        logType === 'positive'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <i className="fa-solid fa-star"></i>
                      <span>Poin Kebaikan (+)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLogType('negative');
                        if (points > 0) setPoints(-5);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        logType === 'negative'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <i className="fa-solid fa-triangle-exclamation"></i>
                      <span>Pelanggaran (-)</span>
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kategori Penilaian
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                  >
                    <option value="Kedisiplinan">Kedisiplinan</option>
                    <option value="Kerapihan">Kerapihan & Seragam</option>
                    <option value="Kebersihan">Kebersihan Kelas</option>
                    <option value="Prestasi">Prestasi Akademik/Lomba</option>
                    <option value="Sikap / Karakter">Sikap & Budi Pekerti</option>
                    <option value="Tanggung Jawab">Tanggung Jawab & Tugas</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Judul Catatan / Perilaku *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Seragam Rapi, Membantu Teman..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Points & Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nilai Poin *
                    </label>
                    <input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      required
                      className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Keterangan Tambahan / Catatan Evaluasi Guru
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan detail kejadian atau saran pembinaan untuk siswa..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                  ></textarea>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Simpan Catatan Jurnal</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: JOURNAL LOGS */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
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

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-xs font-bold px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                  >
                    <option value="Semua">Semua Jenis</option>
                    <option value="positive">🌟 Kebaikan (+)</option>
                    <option value="negative">⚠️ Pelanggaran (-)</option>
                  </select>

                  <div className="relative flex-1 min-w-[160px]">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      placeholder="Cari siswa atau catatan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('create')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Catat Jurnal</span>
                </button>
              </div>

              {/* Logs List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mx-auto">
                      <i className="fa-solid fa-book-open"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Belum Ada Catatan Jurnal Perilaku
                    </h4>
                    <p className="text-xs text-slate-500">
                      Klik "Catat Jurnal" untuk memberikan poin kebaikan atau catatan kedisiplinan.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLogs.map((log) => {
                      const isPositive = log.type === 'positive';

                      return (
                        <div
                          key={log.id}
                          className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                  isPositive
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {isPositive ? '🌟 Kebaikan' : '⚠️ Pelanggaran'}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {log.studentName}
                              </h5>
                              <span className="text-xs font-mono text-slate-400 font-semibold">
                                ({log.nis})
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {formatClassLabel(log.classRoom)}
                              </span>
                              <span
                                className={`font-mono font-black text-xs px-2 py-0.2 rounded-full ${
                                  isPositive
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {log.points > 0 ? `+${log.points}` : log.points} Poin
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {log.title} <span className="text-slate-400 font-normal">({log.category})</span>
                            </p>

                            {log.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                "{log.description}"
                              </p>
                            )}

                            <div className="text-[10px] text-slate-400 flex items-center gap-3">
                              <span>📅 {log.date}</span>
                              <span>👨‍🏫 Dicatat oleh: {log.recordedBy}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => handleSendWA(log)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
                              title="Kirim laporan catatan ke WhatsApp orang tua"
                            >
                              <i className="fa-brands fa-whatsapp text-sm"></i>
                              <span className="hidden sm:inline">Lapor WA</span>
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus catatan "${log.title}" untuk ananda ${log.studentName}?`)) {
                                  onDeleteBehaviorLog(log.id);
                                }
                              }}
                              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                              title="Hapus Catatan"
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

          {/* TAB 3: RECAP EVALUATION FOR REPORT CARD */}
          {activeTab === 'recap' && (
            <div className="space-y-4">
              {/* Header & Export Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
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
                  <span className="text-xs text-slate-500 font-semibold">
                    Total: {recapData.length} Siswa
                  </span>
                </div>

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <i className="fa-solid fa-file-excel"></i>
                  <span>Ekspor Rekap Excel (.xlsx)</span>
                </button>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-4 text-center">Catatan (+)</th>
                        <th className="py-3 px-4 text-center">Catatan (-)</th>
                        <th className="py-3 px-4 text-center">Total Skor</th>
                        <th className="py-3 px-4">Predikat Sikap</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recapData.map((item, idx) => (
                        <tr
                          key={item.student.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {item.student.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              NIS: {item.student.nis}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                            {formatClassLabel(item.student.classRoom)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {item.stats.positiveCount}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-rose-600 dark:text-rose-400">
                            {item.stats.negativeCount}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">
                              {item.stats.totalPoints}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeClass}`}>
                              {item.predicate}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setStudentId(item.student.id);
                                setActiveTab('create');
                              }}
                              className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                            >
                              + Tambah Poin
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Skor Dasar: <strong className="text-slate-700 dark:text-slate-200">100 Poin</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
