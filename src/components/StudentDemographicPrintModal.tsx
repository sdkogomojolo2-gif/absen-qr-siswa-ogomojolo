import React, { useState, useMemo, useRef } from 'react';
import { Student, SystemSettings, Teacher } from '../types';
import {
  AGE_GROUPS,
  STANDARD_RELIGIONS,
  calculateStudentAge,
  normalizeReligion,
  computeDemographicStats,
  exportDemographicsToExcel,
  generateDemographicsPDF,
} from '../utils/studentDemographics';
import { formatCleanNIP } from '../utils/classUtils';

interface StudentDemographicPrintModalProps {
  students: Student[];
  settings: SystemSettings;
  currentTeacher?: Teacher | null;
  teachers?: Teacher[];
  defaultClass?: string;
  onClose: () => void;
}

export const StudentDemographicPrintModal: React.FC<StudentDemographicPrintModalProps> = ({
  students,
  settings,
  currentTeacher,
  teachers = [],
  defaultClass,
  onClose,
}) => {
  const isAdmin = currentTeacher?.role === 'admin' || currentTeacher?.teacherType === 'admin';
  const isWaliKelas = !isAdmin && (currentTeacher?.teacherType === 'wali_kelas' || Boolean(currentTeacher?.homeroomClass));
  const isGuruMapel = !isAdmin && currentTeacher?.teacherType === 'guru_mapel';
  const myHomeroom = currentTeacher?.homeroomClass;

  // Available classes derived from students and default SD classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].forEach((c) => set.add(c));
    students.forEach((s) => {
      if (s.classRoom) set.add(s.classRoom);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [students]);

  // Initial class selection based on role
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isWaliKelas && myHomeroom) return myHomeroom;
    if (defaultClass && defaultClass !== 'Semua') return defaultClass;
    return 'Semua';
  });

  const [selectedReligion, setSelectedReligion] = useState<string>('Semua');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('Semua');
  const [selectedGender, setSelectedGender] = useState<'Semua' | 'Laki-laki' | 'Perempuan'>('Semua');
  const [sortBy, setSortBy] = useState<'name_asc' | 'age_asc' | 'age_desc' | 'nis_asc'>('name_asc');
  const [reportType, setReportType] = useState<'full' | 'nominal' | 'recap' | 'matrix'>('full');

  // Signer Customization State
  const defaultSignerTitle = useMemo(() => {
    if (isWaliKelas && myHomeroom) return `Wali Kelas ${myHomeroom}`;
    if (isGuruMapel && currentTeacher?.subject) return `Guru Mapel ${currentTeacher.subject}`;
    if (isAdmin) return 'Administrator / Operator Dapodik';
    return selectedClass !== 'Semua' ? `Wali Kelas ${selectedClass}` : 'Penanggung Jawab Data Siswa';
  }, [isWaliKelas, myHomeroom, isGuruMapel, currentTeacher, isAdmin, selectedClass]);

  const [signerTitle, setSignerTitle] = useState(defaultSignerTitle);
  const [signerName, setSignerName] = useState(currentTeacher?.name || 'MOH. FADLI');
  const [signerNip, setSignerNip] = useState(currentTeacher?.nip || '199903202025211020');

  const [headmasterName, setHeadmasterName] = useState(settings.headmasterName || 'Drs. H. Mulyadi, M.Pd');
  const [headmasterNip, setHeadmasterNip] = useState(settings.headmasterNip || '19680512 199403 1 005');
  const [schoolCity, setSchoolCity] = useState(settings.schoolCity || 'Parigi Moutong');

  const todayIndo = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const [signatureDate, setSignatureDate] = useState(todayIndo);

  // Sync signer title if class changes and role is wali kelas
  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    if (!isGuruMapel && !isAdmin) {
      if (newClass !== 'Semua') {
        setSignerTitle(`Wali Kelas ${newClass}`);
      } else {
        setSignerTitle('Wali Kelas / Koordinator Data');
      }
    }
  };

  // Filter students based on all criteria
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Class filter
      if (selectedClass !== 'Semua' && s.classRoom !== selectedClass) {
        return false;
      }

      // Gender filter
      if (selectedGender !== 'Semua' && s.gender !== selectedGender) {
        return false;
      }

      // Religion filter
      if (selectedReligion !== 'Semua') {
        const norm = normalizeReligion(s.religion);
        if (norm !== selectedReligion) return false;
      }

      // Age group filter
      if (selectedAgeGroup !== 'Semua') {
        const ageInfo = calculateStudentAge(s);
        if (ageInfo.ageGroup !== selectedAgeGroup) return false;
      }

      return true;
    });
  }, [students, selectedClass, selectedGender, selectedReligion, selectedAgeGroup]);

  // Sort filtered students
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
      }
      if (sortBy === 'nis_asc') {
        return (a.nis || '').localeCompare(b.nis || '', undefined, { numeric: true });
      }
      const ageA = calculateStudentAge(a).years;
      const ageB = calculateStudentAge(b).years;
      if (sortBy === 'age_asc') {
        return ageA - ageB || a.name.localeCompare(b.name);
      }
      if (sortBy === 'age_desc') {
        return ageB - ageA || a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [filteredStudents, sortBy]);

  // Demographic Statistics for selected cohort
  const stats = useMemo(() => {
    return computeDemographicStats(sortedStudents);
  }, [sortedStudents]);

  // Most frequent religion
  const topReligion = useMemo(() => {
    if (!stats.religionStats.length) return '-';
    const sorted = [...stats.religionStats].sort((a, b) => b.total - a.total);
    return sorted[0]?.total > 0 ? `${sorted[0].religion} (${sorted[0].total})` : '-';
  }, [stats]);

  // Actions
  const handlePrintWindow = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateDemographicsPDF({
      students: sortedStudents,
      selectedClass,
      selectedReligion,
      selectedAgeGroup,
      settings,
      teacher: currentTeacher,
      headmasterName,
      headmasterNip,
      signerTitle,
      signerName,
      signerNip,
      signatureDate,
      reportType,
      directPrint: false,
    });
  };

  const handleExportExcel = () => {
    exportDemographicsToExcel({
      students: sortedStudents,
      selectedClass,
      selectedReligion,
      selectedAgeGroup,
      settings,
      teacher: currentTeacher,
      signatureDate,
      reportType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Print-specific style tag to isolate and clean up print view */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-student-demographics, #printable-student-demographics * {
            visibility: visible !important;
          }
          #printable-student-demographics {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            font-size: 10pt !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <i className="fa-solid fa-file-invoice text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Cetak Data Siswa Berdasarkan Umur & Agama
                </h3>
                {isAdmin ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                    Akses Admin
                  </span>
                ) : isWaliKelas ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                    Wali {myHomeroom}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60">
                    Guru Mapel ({currentTeacher?.subject || 'Mapel'})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Laporan resmi permintaan data kependudukan siswa, kelompok usia & agama untuk dinas/sekolah
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Modal Body: Controls & Live Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Siswa</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {sortedStudents.length} <span className="text-xs font-normal text-slate-500">Siswa</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">Laki-laki (L)</span>
              <div className="text-xl font-extrabold text-blue-800 dark:text-blue-200 mt-0.5">
                {stats.maleStudents} <span className="text-xs font-normal text-blue-600 dark:text-blue-400">Siswa</span>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-2xl border border-rose-200/60 dark:border-rose-900/40">
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">Perempuan (P)</span>
              <div className="text-xl font-extrabold text-rose-800 dark:text-rose-200 mt-0.5">
                {stats.femaleStudents} <span className="text-xs font-normal text-rose-600 dark:text-rose-400">Siswa</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Rata-rata Usia</span>
              <div className="text-xl font-extrabold text-amber-800 dark:text-amber-200 mt-0.5">
                {stats.averageAge} <span className="text-xs font-normal text-amber-600 dark:text-amber-400">Tahun</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Agama Terbanyak</span>
              <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200 mt-1 truncate" title={topReligion}>
                {topReligion}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <i className="fa-solid fa-filter text-emerald-600"></i>
              <span>Kriteria Filter Permintaan Data</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Kelas Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Pilih Kelas / Rombel
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Semua">Semua Kelas ({students.length} Siswa)</option>
                  {availableClasses.map((cls) => {
                    const count = students.filter((s) => s.classRoom === cls).length;
                    return (
                      <option key={cls} value={cls}>
                        {cls} ({count} Siswa)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Agama Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Kriteria Agama
                </label>
                <select
                  value={selectedReligion}
                  onChange={(e) => setSelectedReligion(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Semua">Semua Agama</option>
                  {STANDARD_RELIGIONS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Umur Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Kriteria Kelompok Usia
                </label>
                <select
                  value={selectedAgeGroup}
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Semua">Semua Kelompok Usia</option>
                  {AGE_GROUPS.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Semua">Semua (Laki-laki & Perempuan)</option>
                  <option value="Laki-laki">Hanya Laki-laki (L)</option>
                  <option value="Perempuan">Hanya Perempuan (P)</option>
                </select>
              </div>
            </div>

            {/* Sub-controls: Format Laporan & Sorting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Format Dokumen / Tipe Laporan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReportType('full')}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all text-center ${
                      reportType === 'full'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    📑 Lengkap
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('nominal')}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all text-center ${
                      reportType === 'nominal'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    👥 Daftar Nama
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('recap')}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all text-center ${
                      reportType === 'recap'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    📊 Tabel Rekap
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('matrix')}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all text-center ${
                      reportType === 'matrix'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    🧮 Matriks Silang
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Urutan Daftar Siswa
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="name_asc">Nama Siswa (A s/d Z)</option>
                  <option value="age_asc">Umur (Termuda ke Tertua)</option>
                  <option value="age_desc">Umur (Tertua ke Termuda)</option>
                  <option value="nis_asc">Nomor Induk Siswa (NIS)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Signature & Title Customization Dropdown / Toggle */}
          <details className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 group">
            <summary className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between select-none">
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-pen-nib text-indigo-600"></i>
                <span>Pengaturan Tanda Tangan & Titimangsa Dokumen (Opsional)</span>
              </span>
              <span className="text-[11px] text-slate-400 group-open:rotate-180 transition-transform">
                <i className="fa-solid fa-chevron-down"></i>
              </span>
            </summary>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 mt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tempat / Kota & Tanggal Cetak
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={schoolCity}
                    onChange={(e) => setSchoolCity(e.target.value)}
                    placeholder="Kota"
                    className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                  />
                  <input
                    type="text"
                    value={signatureDate}
                    onChange={(e) => setSignatureDate(e.target.value)}
                    placeholder="Tgl Laporan"
                    className="w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Pembuat Laporan (Kiri)
                </label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  placeholder="Jabatan (cth: Wali Kelas 1)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 mb-1"
                />
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 mb-1"
                />
                <input
                  type="text"
                  value={signerNip}
                  onChange={(e) => setSignerNip(e.target.value)}
                  placeholder="NIP Pembuat Laporan"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kepala Sekolah (Kanan)
                </label>
                <input
                  type="text"
                  value={headmasterName}
                  onChange={(e) => setHeadmasterName(e.target.value)}
                  placeholder="Nama Kepala Sekolah"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 mb-1"
                />
                <input
                  type="text"
                  value={headmasterNip}
                  onChange={(e) => setHeadmasterNip(e.target.value)}
                  placeholder="NIP Kepala Sekolah"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                />
              </div>
            </div>
          </details>

          {/* Printable Document Preview Area */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 sm:p-4">
            <div className="flex items-center justify-between mb-2 px-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-eye text-emerald-600"></i>
                Pratinjau Lembar Cetak Dokumen Resmi
              </span>
              <span>Kertas Standar A4 / F4</span>
            </div>

            {/* Document Content Paper */}
            <div
              id="printable-student-demographics"
              className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-md mx-auto max-w-4xl text-left border border-slate-200"
            >
              {/* Kop Surat Sekolah */}
              <div className="border-b-4 border-double border-slate-900 pb-3 mb-4 text-center relative">
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-700">
                  PEMERINTAH KABUPATEN {settings.schoolCity ? settings.schoolCity.toUpperCase() : 'PARIGI MOUTONG'}
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-700">
                  DINAS PENDIDIKAN DAN KEBUDAYAAN
                </div>
                <div className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-tight mt-0.5">
                  {settings.schoolName}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {settings.schoolAddress}
                </div>
              </div>

              {/* Title & Filter Context */}
              <div className="text-center mb-5">
                <h4 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wide underline underline-offset-4">
                  DAFTAR DAN REKAPITULASI DATA SISWA BERDASARKAN UMUR & AGAMA
                </h4>
                <div className="text-xs font-semibold text-slate-700 mt-1.5">
                  TAHUN AJARAN {settings.academicYear}
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-center gap-4 flex-wrap">
                  <span><strong>Kelas:</strong> {selectedClass}</span>
                  <span><strong>Kriteria Agama:</strong> {selectedReligion}</span>
                  <span><strong>Kriteria Usia:</strong> {selectedAgeGroup}</span>
                  <span><strong>Total:</strong> {sortedStudents.length} Siswa</span>
                </div>
              </div>

              {/* 1. Rekapitulasi Berdasarkan Agama (if full or recap) */}
              {(reportType === 'full' || reportType === 'recap') && (
                <div className="mb-5">
                  <div className="text-xs font-black uppercase text-slate-800 mb-1.5">
                    I. REKAPITULASI SISWA BERDASARKAN AGAMA
                  </div>
                  <table className="w-full text-xs border border-slate-800 border-collapse">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 border-b border-slate-800 font-bold text-center">
                        <th className="border border-slate-800 p-1.5 w-10">No</th>
                        <th className="border border-slate-800 p-1.5 text-left">Agama</th>
                        <th className="border border-slate-800 p-1.5 w-24">Laki-laki (L)</th>
                        <th className="border border-slate-800 p-1.5 w-24">Perempuan (P)</th>
                        <th className="border border-slate-800 p-1.5 w-24">Jumlah Total</th>
                        <th className="border border-slate-800 p-1.5 w-24">Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.religionStats
                        .filter((r) => r.total > 0 || STANDARD_RELIGIONS.includes(r.religion as any))
                        .map((r, i) => (
                          <tr key={r.religion} className="border-b border-slate-400">
                            <td className="border border-slate-800 p-1.5 text-center">{i + 1}</td>
                            <td className="border border-slate-800 p-1.5 font-medium">{r.religion}</td>
                            <td className="border border-slate-800 p-1.5 text-center">{r.male}</td>
                            <td className="border border-slate-800 p-1.5 text-center">{r.female}</td>
                            <td className="border border-slate-800 p-1.5 text-center font-bold">{r.total}</td>
                            <td className="border border-slate-800 p-1.5 text-center">{r.percentage}%</td>
                          </tr>
                        ))}
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-800">
                        <td colSpan={2} className="border border-slate-800 p-1.5 text-center">TOTAL KESELURUHAN</td>
                        <td className="border border-slate-800 p-1.5 text-center">{stats.maleStudents}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{stats.femaleStudents}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{stats.totalStudents}</td>
                        <td className="border border-slate-800 p-1.5 text-center">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 2. Rekapitulasi Berdasarkan Kelompok Usia (if full or recap) */}
              {(reportType === 'full' || reportType === 'recap') && (
                <div className="mb-5">
                  <div className="text-xs font-black uppercase text-slate-800 mb-1.5">
                    II. REKAPITULASI SISWA BERDASARKAN KELOMPOK UMUR
                  </div>
                  <table className="w-full text-xs border border-slate-800 border-collapse">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 border-b border-slate-800 font-bold text-center">
                        <th className="border border-slate-800 p-1.5 w-10">No</th>
                        <th className="border border-slate-800 p-1.5 text-left">Kelompok Umur</th>
                        <th className="border border-slate-800 p-1.5 w-24">Laki-laki (L)</th>
                        <th className="border border-slate-800 p-1.5 w-24">Perempuan (P)</th>
                        <th className="border border-slate-800 p-1.5 w-24">Jumlah Total</th>
                        <th className="border border-slate-800 p-1.5 w-24">Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.ageStats.map((a, i) => (
                        <tr key={a.ageGroup} className="border-b border-slate-400">
                          <td className="border border-slate-800 p-1.5 text-center">{i + 1}</td>
                          <td className="border border-slate-800 p-1.5 font-medium">{a.ageGroup}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{a.male}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{a.female}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-bold">{a.total}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{a.percentage}%</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-800">
                        <td colSpan={2} className="border border-slate-800 p-1.5 text-center">TOTAL KESELURUHAN</td>
                        <td className="border border-slate-800 p-1.5 text-center">{stats.maleStudents}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{stats.femaleStudents}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{stats.totalStudents}</td>
                        <td className="border border-slate-800 p-1.5 text-center">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. Matriks Silang Umur x Agama (if matrix) */}
              {reportType === 'matrix' && (
                <div className="mb-5 overflow-x-auto">
                  <div className="text-xs font-black uppercase text-slate-800 mb-1.5">
                    MATRIKS SILANG KELOMPOK UMUR × AGAMA
                  </div>
                  <table className="w-full text-xs border border-slate-800 border-collapse">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 border-b border-slate-800 font-bold text-center">
                        <th className="border border-slate-800 p-1.5 w-10">No</th>
                        <th className="border border-slate-800 p-1.5 text-left">Kelompok Usia</th>
                        {stats.religionsInUse.map((rel) => (
                          <th key={rel} className="border border-slate-800 p-1.5">{rel}</th>
                        ))}
                        <th className="border border-slate-800 p-1.5 w-20">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.matrix.map((row, i) => (
                        <tr key={row.ageGroup} className="border-b border-slate-400">
                          <td className="border border-slate-800 p-1.5 text-center">{i + 1}</td>
                          <td className="border border-slate-800 p-1.5 font-medium">{row.ageGroup}</td>
                          {stats.religionsInUse.map((rel) => (
                            <td key={rel} className="border border-slate-800 p-1.5 text-center">
                              {row.counts[rel]?.total || 0}
                            </td>
                          ))}
                          <td className="border border-slate-800 p-1.5 text-center font-bold bg-slate-50">{row.rowTotal}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-800">
                        <td colSpan={2} className="border border-slate-800 p-1.5 text-center">TOTAL KESELURUHAN</td>
                        {stats.religionsInUse.map((rel) => {
                          const relSum = stats.matrix.reduce((sum, r) => sum + (r.counts[rel]?.total || 0), 0);
                          return (
                            <td key={rel} className="border border-slate-800 p-1.5 text-center font-bold">
                              {relSum}
                            </td>
                          );
                        })}
                        <td className="border border-slate-800 p-1.5 text-center font-black bg-slate-200">
                          {stats.totalStudents}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 4. Daftar Nominatif Siswa (if full or nominal) */}
              {(reportType === 'full' || reportType === 'nominal') && (
                <div className="mb-6">
                  <div className="text-xs font-black uppercase text-slate-800 mb-1.5">
                    {reportType === 'full' ? 'III. DAFTAR NOMINATIF SISWA LENGKAP' : 'DAFTAR NOMINATIF SISWA'}
                  </div>
                  {sortedStudents.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-300 text-slate-500 text-xs">
                      Tidak ada siswa yang sesuai dengan filter kriteria umur dan agama yang dipilih.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border border-slate-800 border-collapse">
                        <thead>
                          <tr className="bg-slate-200 text-slate-900 border-b border-slate-800 font-bold text-center">
                            <th className="border border-slate-800 p-1 w-8">No</th>
                            <th className="border border-slate-800 p-1 w-16">NIS</th>
                            <th className="border border-slate-800 p-1 w-20">NISN</th>
                            <th className="border border-slate-800 p-1 text-left">Nama Siswa</th>
                            <th className="border border-slate-800 p-1 w-14">Kelas</th>
                            <th className="border border-slate-800 p-1 w-8">L/P</th>
                            <th className="border border-slate-800 p-1 text-left">Tempat Lahir</th>
                            <th className="border border-slate-800 p-1 w-20">Tgl Lahir</th>
                            <th className="border border-slate-800 p-1 w-24">Usia / Umur</th>
                            <th className="border border-slate-800 p-1 w-20">Agama</th>
                            <th className="border border-slate-800 p-1 text-left">No. HP Orang Tua</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedStudents.map((s, index) => {
                            const ageInfo = calculateStudentAge(s);
                            const rel = normalizeReligion(s.religion);
                            return (
                              <tr key={s.id || s.nis} className="border-b border-slate-300 hover:bg-slate-50">
                                <td className="border border-slate-800 p-1 text-center">{index + 1}</td>
                                <td className="border border-slate-800 p-1 text-center font-mono">{s.nis || '-'}</td>
                                <td className="border border-slate-800 p-1 text-center font-mono">{s.nisn || '-'}</td>
                                <td className="border border-slate-800 p-1 font-semibold text-slate-900">{s.name}</td>
                                <td className="border border-slate-800 p-1 text-center">{s.classRoom}</td>
                                <td className="border border-slate-800 p-1 text-center font-bold">
                                  {s.gender === 'Laki-laki' ? 'L' : 'P'}
                                </td>
                                <td className="border border-slate-800 p-1">{s.birthPlace || '-'}</td>
                                <td className="border border-slate-800 p-1 text-center">{s.birthDate || '-'}</td>
                                <td className="border border-slate-800 p-1 text-center font-medium">{ageInfo.formatted}</td>
                                <td className="border border-slate-800 p-1 text-center">{rel}</td>
                                <td className="border border-slate-800 p-1 font-mono text-[10px]">{s.parentPhone || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tanda Tangan & Pengesahan Dokumen */}
              <div className="pt-4 mt-6 border-t border-slate-300 text-xs text-slate-900">
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column: Pembuat Laporan (Wali Kelas / Guru Mapel / Admin) */}
                  <div className="text-left pl-2">
                    <div>Mengetahui / Memeriksa,</div>
                    <div className="font-bold text-slate-900">{signerTitle}</div>
                    <div className="h-16"></div>
                    <div className="font-bold underline text-slate-900">{signerName}</div>
                    <div className="text-[11px] text-slate-700">{formatCleanNIP(signerNip)}</div>
                  </div>

                  {/* Right Column: Kepala Sekolah */}
                  <div className="text-right pr-2">
                    <div>{schoolCity}, {signatureDate}</div>
                    <div>Mengetahui,</div>
                    <div className="font-bold text-slate-900">Kepala Sekolah</div>
                    <div className="h-16"></div>
                    <div className="font-bold underline text-slate-900">{headmasterName}</div>
                    <div className="text-[11px] text-slate-700">{formatCleanNIP(headmasterNip)}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer with Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Siap dicetak atau diekspor ke PDF / Excel untuk memenuhi permintaan data.
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Tutup
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              title="Ekspor seluruh lembar ke file Excel (.xlsx)"
            >
              <i className="fa-solid fa-file-excel text-xs"></i>
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              title="Unduh laporan resmi format PDF"
            >
              <i className="fa-solid fa-file-pdf text-xs"></i>
              <span>Unduh PDF</span>
            </button>

            <button
              onClick={handlePrintWindow}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
              title="Cetak langsung ke kertas fisik melalui dialog printer"
            >
              <i className="fa-solid fa-print text-xs"></i>
              <span>Cetak Dokumen</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
