import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student, Gender, SystemSettings, Teacher, ScheduledLeave, BehaviorLog } from '../types';
import { StudentCardModal } from './StudentCardModal';
import { BulkCardPrintModal } from './BulkCardPrintModal';
import { CardTemplateSelectionModal } from './CardTemplateSelectionModal';
import { CardBrandingModal } from './CardBrandingModal';
import { CardTemplateId } from '../utils/studentCardTemplates';
import { MALE_BW_AVATAR, FEMALE_BW_AVATAR, getDefaultAvatar } from '../utils/avatars';
import { SD_CLASSES } from '../data/initialData';
import { exportStudentsToCSV, downloadStudentImportTemplateCSV, parseStudentImportCSV } from '../utils/csv';
import { downloadStudentImportTemplateExcel, parseStudentExcelFile } from '../utils/excel';
import { formatPhoneNumberForWA } from '../utils/whatsapp';
import { isHomeroomClassMatch, formatClassLabel, findHomeroomTeacher } from '../utils/classUtils';
import { compressStudentPhoto } from '../utils/imageCompressor';
import { ScheduledLeaveModal } from './ScheduledLeaveModal';
import { StudentBehaviorModal } from './StudentBehaviorModal';

interface StudentsTabProps {
  students: Student[];
  settings: SystemSettings;
  currentTeacher: Teacher | null;
  teachers?: Teacher[];
  scheduledLeaves?: ScheduledLeave[];
  behaviorLogs?: BehaviorLog[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  onAddBulkStudents?: (students: Student[]) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteBulkStudents?: (ids: string[]) => void;
  onSaveLeave?: (leave: ScheduledLeave, autoPopulateAttendance: boolean) => void;
  onDeleteLeave?: (leaveId: string) => void;
  onSaveBehaviorLog?: (log: BehaviorLog) => void;
  onDeleteBehaviorLog?: (logId: string) => void;
  onUpdateSettings?: (settings: SystemSettings) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  settings,
  currentTeacher,
  teachers,
  scheduledLeaves = [],
  behaviorLogs = [],
  onAddStudent,
  onAddBulkStudents,
  onUpdateStudent,
  onDeleteStudent,
  onDeleteBulkStudents,
  onSaveLeave,
  onDeleteLeave,
  onSaveBehaviorLog,
  onDeleteBehaviorLog,
  onUpdateSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'nis' | 'class'>('name');

  // Multi-select state for bulk actions (Delete & Print A4)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkPrintSelectedIds, setBulkPrintSelectedIds] = useState<string[] | undefined>(undefined);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Behavior & Leave Modals in StudentsTab
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isBehaviorModalOpen, setIsBehaviorModalOpen] = useState(false);
  const [targetStudentForModal, setTargetStudentForModal] = useState<string | null>(null);

  // Permission Logic:
  // - Admin: Akses penuh edit & hapus semua kelas
  // - Wali Kelas: Hanya melihat & mengelola siswa di kelas binaannya sendiri (misal 1-A) agar tidak mengacak-acak data kelas lain
  // - Guru Mapel: Memiliki akses melihat semua kelas untuk keperluan presensi mata pelajaran, cetak kartu QR, dan notifikasi WA
  const isAdmin = currentTeacher?.role === 'admin' || currentTeacher?.teacherType === 'admin';
  const isWaliKelas = !isAdmin && (currentTeacher?.teacherType === 'wali_kelas' || Boolean(currentTeacher?.homeroomClass));
  const myHomeroom = currentTeacher?.homeroomClass;
  const isGuruMapel = !isAdmin && !isWaliKelas;

  // Selected class state, locked to myHomeroom if teacher is Wali Kelas
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isWaliKelas && myHomeroom) return myHomeroom;
    return 'Semua';
  });

  // Synchronize class selection when teacher changes
  useEffect(() => {
    if (isWaliKelas && myHomeroom) {
      setSelectedClass(myHomeroom);
    }
  }, [isWaliKelas, myHomeroom]);

  const effectiveClass = (isWaliKelas && myHomeroom) ? myHomeroom : selectedClass;

  const canEditStudent = (student: Student) => {
    if (isAdmin) return true;
    if (isWaliKelas && myHomeroom) {
      return isHomeroomClassMatch(student.classRoom, myHomeroom);
    }
    return false;
  };

  const canDeleteStudent = (student: Student) => {
    if (isAdmin) return true;
    if (isWaliKelas && myHomeroom) {
      return isHomeroomClassMatch(student.classRoom, myHomeroom);
    }
    return false;
  };

  // Excel & CSV Import file input references
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [cardStudent, setCardStudent] = useState<Student | null>(null);
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Form Fields (includes photo base64 string, NISN, TTL, Address)
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    name: '',
    classRoom: 'Kelas 1',
    gender: 'Laki-laki' as Gender,
    birthPlace: 'Ogomojolo',
    birthDate: '',
    religion: 'Islam',
    address: 'Desa Ogomojolo, Kec. Palasa',
    parentPhone: '',
    avatarUrl: MALE_BW_AVATAR,
    photo: undefined as string | undefined,
  });

  // Dynamic unique classes list derived from actual students & default SD classes
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>(SD_CLASSES);
    students.forEach((s) => {
      if (s.classRoom) classSet.add(s.classRoom);
    });
    return Array.from(classSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [students]);

  // Counts of students per class
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: students.length };
    availableClasses.forEach((cls) => {
      counts[cls] = 0;
    });
    students.forEach((s) => {
      const cls = s.classRoom || 'Lainnya';
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return counts;
  }, [students, availableClasses]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return students
      .filter((std) => {
        const matchSearch =
          !query ||
          std.name.toLowerCase().includes(query) ||
          std.nis.toLowerCase().includes(query) ||
          (std.parentPhone && std.parentPhone.includes(query));

        let matchClass = true;
        if (isWaliKelas && myHomeroom) {
          matchClass = isHomeroomClassMatch(std.classRoom, myHomeroom);
        } else if (selectedClass !== 'Semua') {
          matchClass = isHomeroomClassMatch(std.classRoom, selectedClass) || std.classRoom === selectedClass;
        }

        return matchSearch && matchClass;
      })
      .sort((a, b) => {
        if (sortBy === 'nis') {
          return a.nis.localeCompare(b.nis, undefined, { numeric: true });
        }
        if (sortBy === 'class') {
          const classCompare = (a.classRoom || '').localeCompare(b.classRoom || '');
          if (classCompare !== 0) return classCompare;
          return a.name.localeCompare(b.name);
        }
        return a.name.localeCompare(b.name);
      });
  }, [students, searchTerm, isWaliKelas, myHomeroom, selectedClass, sortBy]);

  // Multi-selection computed states & effects
  const isAllFilteredSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.has(s.id));
  const isSomeFilteredSelected = filteredStudents.some((s) => selectedStudentIds.has(s.id)) && !isAllFilteredSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeFilteredSelected;
    }
  }, [isSomeFilteredSelected]);

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        filteredStudents.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        filteredStudents.forEach((s) => next.add(s.id));
        return next;
      });
    }
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  const handleOpenBulkPrintSelected = () => {
    if (selectedStudentIds.size === 0) {
      alert('Pilih minimal satu siswa untuk dicetak!');
      return;
    }
    setBulkPrintSelectedIds(Array.from(selectedStudentIds));
    setIsBulkPrintModalOpen(true);
  };

  const handleOpenBulkPrintAll = () => {
    setBulkPrintSelectedIds(undefined);
    setIsBulkPrintModalOpen(true);
  };

  const handleOpenBulkDelete = () => {
    if (selectedStudentIds.size === 0) {
      alert('Pilih minimal satu siswa untuk dihapus!');
      return;
    }
    if (isGuruMapel) {
      alert('Akun Guru Mapel tidak memiliki izin menghapus data siswa. Hanya Wali Kelas dan Admin yang berhak menghapus data.');
      return;
    }
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    const idsToDelete = Array.from(selectedStudentIds).filter((id) => {
      const std = students.find((s) => s.id === id);
      return std ? canDeleteStudent(std) : false;
    });

    if (idsToDelete.length === 0) {
      alert('Anda tidak memiliki wewenang untuk menghapus siswa yang dipilih.');
      setIsBulkDeleteModalOpen(false);
      return;
    }

    if (onDeleteBulkStudents) {
      onDeleteBulkStudents(idsToDelete);
    } else {
      idsToDelete.forEach((id) => onDeleteStudent(id));
    }

    setSelectedStudentIds(new Set());
    setIsBulkDeleteModalOpen(false);
  };

  const handleOpenAddForm = () => {
    if (isGuruMapel) {
      alert('Akun Guru Mapel tidak memiliki wewenang menambah data siswa. Harap hubungi Guru Wali Kelas atau Administrator.');
      return;
    }
    setEditingStudent(null);
    const initialClass = (isWaliKelas && myHomeroom) ? myHomeroom : (selectedClass !== 'Semua' ? selectedClass : 'Kelas 1');
    setFormData({
      nis: String(1000 + students.length + 1),
      nisn: '',
      name: '',
      classRoom: initialClass,
      gender: 'Laki-laki',
      birthPlace: 'Ogomojolo',
      birthDate: '',
      religion: 'Islam',
      address: 'Desa Ogomojolo, Kec. Palasa',
      parentPhone: '',
      avatarUrl: MALE_BW_AVATAR,
      photo: undefined,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditForm = (student: Student) => {
    if (!canEditStudent(student)) {
      if (isGuruMapel) {
        alert('Akun Guru Mata Pelajaran tidak memiliki izin mengedit data siswa. Hanya Wali Kelas dan Administrator yang berhak mengubah data siswa.');
      } else {
        alert(`Anda adalah Wali Kelas ${myHomeroom}. Anda hanya berhak mengedit data siswa kelas ${myHomeroom}. Siswa ini terdaftar di kelas ${student.classRoom}.`);
      }
      return;
    }
    setEditingStudent(student);

    // Parse TTL if student only has ttl string
    let bPlace = student.birthPlace || '';
    let bDate = student.birthDate || '';
    if (!bPlace && student.ttl && student.ttl.includes(',')) {
      const parts = student.ttl.split(',');
      bPlace = parts[0].trim();
      bDate = parts.slice(1).join(',').trim();
    } else if (!bPlace && student.ttl) {
      bPlace = student.ttl;
    }

    setFormData({
      nis: student.nis,
      nisn: student.nisn || '',
      name: student.name,
      classRoom: student.classRoom || (isWaliKelas && myHomeroom ? myHomeroom : 'Kelas 1'),
      gender: student.gender,
      birthPlace: bPlace || 'Ogomojolo',
      birthDate: bDate || '',
      religion: student.religion || 'Islam',
      address: student.address || 'Desa Ogomojolo, Kec. Palasa',
      parentPhone: student.parentPhone || '',
      avatarUrl: student.avatarUrl || getDefaultAvatar(student.gender),
      photo: student.photo,
    });
    setIsFormModalOpen(true);
  };

  /**
   * File Upload Handler with Automatic Compression
   * Compresses uploaded photo to ~15-25 KB (240x320 px) for lightning-fast performance & minimal storage
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file foto maksimal 10 MB!');
        return;
      }

      setIsCompressingPhoto(true);
      try {
        const compressedBase64 = await compressStudentPhoto(file);
        setFormData((prev) => ({
          ...prev,
          photo: compressedBase64,
          avatarUrl: compressedBase64,
        }));
      } catch (err: any) {
        console.error('Error compressing student photo:', err);
        alert('Gagal memproses dan mengompres foto. Silakan coba file gambar lain.');
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  /**
   * Handle Excel File Upload (.xls, .xlsx, .csv) for Bulk Student Import
   */
  const handleImportExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    try {
      const defaultClass = (isWaliKelas && myHomeroom) ? myHomeroom : (selectedClass !== 'Semua' ? selectedClass : 'Kelas 1');
      const { students: parsedStudents, errors, addedCount } = await parseStudentExcelFile(file, defaultClass, students);

      if (parsedStudents.length === 0) {
        alert('Gagal mengimpor file Excel: ' + (errors[0] || 'Tidak ada data siswa valid ditemukan di file Excel.'));
        return;
      }

      if (onAddBulkStudents) {
        onAddBulkStudents(parsedStudents);
      } else {
        parsedStudents.forEach((std) => {
          onAddStudent({
            nis: std.nis,
            name: std.name,
            classRoom: std.classRoom,
            gender: std.gender,
            parentPhone: std.parentPhone,
            avatarUrl: std.avatarUrl,
            photo: std.photo,
          });
        });
      }

      let msg = `Berhasil menambahkan ${addedCount} siswa baru secara otomatis dari file Excel!`;
      if (errors.length > 0) {
        msg += `\n\nCatatan Peringatan:\n- ${errors.slice(0, 4).join('\n- ')}`;
      }
      alert(msg);
      setImportStatus(`Berhasil mengimpor ${addedCount} siswa dari file Excel (${file.name}).`);
    } catch (err: any) {
      alert('Terjadi kesalahan saat memproses file Excel: ' + (err.message || 'Format tidak valid.'));
    } finally {
      setIsParsingExcel(false);
      e.target.value = '';
    }
  };

  /**
   * Handle CSV File Upload for Bulk Student Import
   */
  const handleImportCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const defaultClass = (isWaliKelas && myHomeroom) ? myHomeroom : (selectedClass !== 'Semua' ? selectedClass : 'Kelas 1');
        const { students: parsedStudents, errors } = parseStudentImportCSV(content, defaultClass, students);

        if (parsedStudents.length === 0) {
          alert('Gagal mengimpor file: ' + (errors[0] || 'Tidak ada data siswa valid ditemukan di file CSV.'));
          return;
        }

        if (onAddBulkStudents) {
          onAddBulkStudents(parsedStudents);
        } else {
          parsedStudents.forEach((std) => {
            onAddStudent({
              nis: std.nis,
              name: std.name,
              classRoom: std.classRoom,
              gender: std.gender,
              parentPhone: std.parentPhone,
              avatarUrl: std.avatarUrl,
              photo: std.photo,
            });
          });
        }
        let addedCount = parsedStudents.length;

        let msg = `Berhasil menambahkan ${addedCount} siswa baru secara otomatis ke database!`;
        if (errors.length > 0) {
          msg += `\n\nCatatan:\n- ${errors.slice(0, 3).join('\n- ')}`;
        }
        alert(msg);
        setImportStatus(`Berhasil mengimpor ${addedCount} siswa secara otomatis.`);
      }
    };
    reader.onerror = () => {
      alert('Gagal membaca file CSV. Pastikan file dalam format teks/CSV yang valid.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nis) {
      alert('Mohon isi nama dan NIS siswa!');
      return;
    }

    const payload = {
      ...formData,
      ttl: formData.birthPlace && formData.birthDate 
        ? `${formData.birthPlace}, ${formData.birthDate}` 
        : (formData.birthPlace || formData.birthDate || undefined),
    };

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...payload,
      });
    } else {
      onAddStudent(payload);
    }

    setIsFormModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-id-card text-emerald-600 dark:text-emerald-400"></i>
              <span>Data Siswa SD & Kartu Pelajar</span>
            </h2>
            {isAdmin ? (
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                <i className="fa-solid fa-shield-halved text-[9px]"></i>
                Akses Admin (Semua Kelas)
              </span>
            ) : isWaliKelas ? (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <i className="fa-solid fa-user-graduate text-[9px]"></i>
                Wali Kelas {myHomeroom} (Hak Edit Kelas {myHomeroom})
              </span>
            ) : (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <i className="fa-solid fa-book-open text-[9px]"></i>
                Guru Mapel ({currentTeacher?.subject || 'Mapel'}) • Mode Lihat & Cetak QR
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isGuruMapel
              ? 'Melihat daftar siswa, mencetak Kartu Pelajar Digital ber-QR Code, dan menghubungi orang tua siswa.'
              : isWaliKelas
              ? `Mengelola data siswa binaan Kelas ${myHomeroom} dan mencetak Kartu Pelajar Digital ber-QR Code.`
              : 'Kelola data siswa SD (Kelas 1 s/d 6) dan cetak Kartu Pelajar Digital ber-QR Code dengan foto profil base64.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template Excel Button (Only for Admin & Wali Kelas) */}
          {!isGuruMapel && (
            <button
              onClick={() =>
                downloadStudentImportTemplateExcel(
                  isWaliKelas && myHomeroom ? myHomeroom : selectedClass !== 'Semua' ? selectedClass : 'Kelas 1'
                )
              }
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              title="Unduh file template Excel acuan (.xlsx) dengan header: NIS, Nama, Kelas, No HP Orang Tua"
            >
              <i className="fa-solid fa-file-excel text-xs"></i>
              <span>Template Excel</span>
            </button>
          )}

          {/* Upload Excel File Input Button (Only for Admin & Wali Kelas) */}
          {!isGuruMapel && (
            <>
              <button
                onClick={() => excelFileInputRef.current?.click()}
                disabled={isParsingExcel}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                title="Pilih dan unggah file Excel (.xls, .xlsx, .csv) untuk memperbarui data siswa secara otomatis"
              >
                <i className={`fa-solid ${isParsingExcel ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} text-xs`}></i>
                <span>{isParsingExcel ? 'Membaca...' : 'Unggah Excel'}</span>
              </button>
              <input
                type="file"
                ref={excelFileInputRef}
                accept=".xls,.xlsx,.csv"
                onChange={handleImportExcelFile}
                className="hidden"
              />
            </>
          )}

          {/* Cetak Kartu Massal A4 Button (Available for all roles) */}
          <button
            onClick={handleOpenBulkPrintAll}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Cetak Kartu Siswa Massal Format Kertas A4 (Download PDF / Cetak Langsung)"
          >
            <i className="fa-solid fa-print text-xs"></i>
            <span>Cetak Kartu A4</span>
          </button>

          {/* Tombol Pemilih 3 Desain Kartu CR80 Standar */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Lihat & Pilih 3 Contoh Desain Kartu Siswa (Standar CR80: 85,60 × 53,98 mm)"
          >
            <i className="fa-solid fa-id-card-clip text-xs"></i>
            <span>Pilih Desain Kartu</span>
          </button>

          {/* Tombol Atur Logo Sekolah & TTD Kepala Sekolah */}
          <button
            onClick={() => setIsBrandingModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Unggah Logo Sekolah, Logo Tut Wuri Handayani, dan Tanda Tangan / Barcode Kepala Sekolah"
          >
            <i className="fa-solid fa-stamp text-xs"></i>
            <span>Logo & TTD Kepsek</span>
          </button>

          {/* Jurnal Karakter & Poin Siswa Shortcut Button */}
          {onSaveBehaviorLog && (
            <button
              onClick={() => {
                setTargetStudentForModal(null);
                setIsBehaviorModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              title="Buka Jurnal Karakter & Poin Kebaikan / Pelanggaran Siswa"
            >
              <i className="fa-solid fa-star text-xs"></i>
              <span>Jurnal Karakter</span>
            </button>
          )}

          {/* Izin / Sakit Terjadwal Shortcut Button */}
          {onSaveLeave && (
            <button
              onClick={() => {
                setTargetStudentForModal(null);
                setIsLeaveModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              title="Buka Menu Izin / Sakit Terjadwal & Upload Bukti Surat Dokter"
            >
              <i className="fa-solid fa-calendar-days text-xs"></i>
              <span>Izin Terjadwal</span>
            </button>
          )}

          {/* Add Student Manual Button (Only for Admin & Wali Kelas) */}
          {!isGuruMapel ? (
            <button
              onClick={handleOpenAddForm}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <i className="fa-solid fa-user-plus text-xs"></i>
              <span>Tambah Siswa</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700">
              <i className="fa-solid fa-lock text-xs"></i>
              <span>Edit Dibatasi (Wali Kelas)</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Informative Notice Banner */}
      {isGuruMapel && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-sky-900 dark:text-sky-200">
          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 font-bold">
            <i className="fa-solid fa-info text-sm"></i>
          </div>
          <div>
            <p className="font-bold text-sky-950 dark:text-sky-100">
              Akses Guru Mata Pelajaran ({currentTeacher?.name} - {currentTeacher?.subject})
            </p>
            <p className="mt-0.5 text-[11px] text-sky-800 dark:text-sky-300">
              Anda dapat melihat seluruh data siswa, memindai presensi QR, dan mencetak Kartu Pelajar Digital. Sesuai kebijakan sekolah, <strong>pengubahan dan penambahan data siswa hanya dapat dilakukan oleh Guru Wali Kelas masing-masing atau Administrator</strong>.
            </p>
          </div>
        </div>
      )}

      {isWaliKelas && myHomeroom && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
            <span>
              Anda login sebagai <strong>Wali Kelas {myHomeroom}</strong>. Tampilan dan pengelolaan data secara khusus difokuskan hanya untuk siswa <strong>Kelas {myHomeroom}</strong> guna menjaga integritas data antar kelas.
            </span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] shrink-0 ml-2">
            Terkunci Kelas {myHomeroom}
          </span>
        </div>
      )}

      {/* CSV Import Banner Notification */}
      {importStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
            <span>{importStatus}</span>
          </div>
          <button
            onClick={() => setImportStatus(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
        {/* Controls Bar: Search, Class Dropdown, Sort Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box with Clear Button */}
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="Cari berdasarkan nama, NIS, atau No. HP orang tua..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer"
                title="Hapus Pencarian"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            )}
          </div>

          {/* Filter & Sort Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dropdown Filter Kelas */}
            {isWaliKelas && myHomeroom ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 rounded-xl px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-200">
                <i className="fa-solid fa-graduation-cap text-emerald-600 dark:text-emerald-400 text-xs"></i>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">Kelas:</span>
                <span className="font-bold">Kelas {myHomeroom} ({classCounts[myHomeroom] || 0} siswa)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs">
                <i className="fa-solid fa-graduation-cap text-indigo-600 dark:text-indigo-400 text-xs"></i>
                <span className="font-semibold text-slate-500 dark:text-slate-400">Kelas:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Semua" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    Semua Kelas ({students.length})
                  </option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                      Kelas {cls} ({classCounts[cls] || 0} siswa)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dropdown Urutkan (Sort) */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <i className="fa-solid fa-arrow-down-a-z text-slate-500 dark:text-slate-400 text-xs"></i>
              <span className="font-semibold text-slate-500 dark:text-slate-400">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'nis' | 'class')}
                className="bg-transparent text-slate-800 dark:text-slate-100 font-bold focus:outline-none cursor-pointer"
              >
                <option value="name" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Nama Siswa (A - Z)
                </option>
                <option value="nis" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Nomor Induk (NIS)
                </option>
                <option value="class" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Tingkat Kelas
                </option>
              </select>
            </div>

            {/* Reset Filter Button if active */}
            {(searchTerm || selectedClass !== 'Semua') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClass('Semua');
                }}
                className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Reset Semua Filter & Pencarian"
              >
                <i className="fa-solid fa-rotate-left text-[10px]"></i>
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Class Pills for 1-Click Filtering */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-0.5">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 mr-1">
            Pilih Cepat:
          </span>
          <button
            type="button"
            onClick={() => setSelectedClass('Semua')}
            className={`px-3 py-1 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedClass === 'Semua'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Semua Kelas</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              selectedClass === 'Semua' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {students.length}
            </span>
          </button>

          {availableClasses.map((cls) => {
            const isSelected = selectedClass === cls;
            const count = classCounts[cls] || 0;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>Kelas {cls}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results summary indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <i className="fa-solid fa-users text-indigo-500 text-xs"></i>
            <span>
              Menampilkan <strong className="text-slate-800 dark:text-white font-bold">{filteredStudents.length}</strong> dari{' '}
              <strong className="text-slate-800 dark:text-white font-bold">{students.length}</strong> siswa
              {selectedClass !== 'Semua' && (
                <> (Kelas <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedClass}</span>)</>
              )}
              {searchTerm && (
                <> untuk kata kunci "<span className="italic font-medium text-slate-700 dark:text-slate-300">{searchTerm}</span>"</>
              )}
            </span>
          </div>
          {selectedStudentIds.size > 0 && (
            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
              {selectedStudentIds.size} siswa dicentang
            </span>
          )}
        </div>

        {/* Floating / Inline Bulk Actions Bar */}
        {selectedStudentIds.size > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 dark:from-indigo-950/70 dark:via-slate-900 dark:to-indigo-950/70 border-2 border-indigo-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                <i className="fa-solid fa-check-double"></i>
              </div>
              <div>
                <div className="text-xs font-extrabold text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5">
                  <span>{selectedStudentIds.size} Siswa Dicentang</span>
                  <span className="text-[10px] font-normal text-indigo-700 dark:text-indigo-300">
                    (dari {filteredStudents.length} siswa tampil)
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Pilih aksi: Cetak kartu absensi 2x4 (A4) atau hapus siswa yang dipilih sekaligus.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Batal Centang
              </button>
              <button
                type="button"
                onClick={handleOpenBulkPrintSelected}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Cetak Kartu Siswa Dicentang dalam Ukuran 2x4 (8 per halaman A4)"
              >
                <i className="fa-solid fa-print text-xs"></i>
                <span>Cetak Kartu A4 (2x4) ({selectedStudentIds.size})</span>
              </button>
              {!isGuruMapel && (
                <button
                  type="button"
                  onClick={handleOpenBulkDelete}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Hapus Siswa yang Dicentang dari Database"
                >
                  <i className="fa-solid fa-trash-can text-xs"></i>
                  <span>Hapus ({selectedStudentIds.size})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    ref={headerCheckboxRef}
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer border-slate-300 dark:border-slate-600 accent-indigo-600"
                    title={isAllFilteredSelected ? 'Batalkan pilihan semua siswa' : 'Centang semua siswa di tabel ini'}
                  />
                </th>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-4">Foto & Identitas Siswa</th>
                <th className="py-3 px-4">NIS / NISN</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Kontak Ortu</th>
                <th className="py-3 px-4 text-center">Aksi / Kartu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => {
                  const displayPhoto = student.photo || student.avatarUrl || getDefaultAvatar(student.gender);
                  const isSelected = selectedStudentIds.has(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(student.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer border-slate-300 dark:border-slate-600 accent-indigo-600"
                          title={isSelected ? 'Batalkan centang siswa ini' : 'Centang siswa ini'}
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 font-medium">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={displayPhoto}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 bg-slate-100 dark:bg-slate-800 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{student.name}</div>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {(student.ttl || (student.birthPlace ? `${student.birthPlace}${student.birthDate ? `, ${student.birthDate}` : ''}` : '')) && (
                                <span className="inline-flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                  <i className="fa-solid fa-cake-candles text-[9px] text-amber-500"></i>
                                  {student.ttl || `${student.birthPlace}${student.birthDate ? `, ${student.birthDate}` : ''}`}
                                </span>
                              )}
                              {student.address && (
                                <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={student.address}>
                                  <i className="fa-solid fa-location-dot text-[9px] text-rose-500"></i>
                                  {student.address}
                                </span>
                              )}
                              {!student.ttl && !student.birthPlace && !student.address && (
                                <span>Terdaftar: {student.createdAt}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-amber-700 dark:text-amber-400">{student.nis}</div>
                        {student.nisn ? (
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            NISN: <span className="font-bold text-slate-700 dark:text-slate-300">{student.nisn}</span>
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400 italic mt-0.5">NISN: -</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60">
                          {student.classRoom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">{student.gender}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{student.parentPhone}</span>
                          <a
                            href={`https://wa.me/${formatPhoneNumberForWA(student.parentPhone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 p-1 rounded-md border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
                            title={`Chat WhatsApp Orang Tua (${student.name})`}
                          >
                            <i className="fa-brands fa-whatsapp text-xs"></i>
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Kartu QR Button */}
                          <button
                            onClick={() => setCardStudent(student)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl transition-all text-xs font-bold cursor-pointer"
                          >
                            <i className="fa-solid fa-qrcode text-xs"></i>
                            <span>Kartu QR</span>
                          </button>

                          {/* Quick Jurnal Karakter */}
                          {onSaveBehaviorLog && (
                            <button
                              onClick={() => {
                                setTargetStudentForModal(student.id);
                                setIsBehaviorModalOpen(true);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                              title={`Catat Poin Karakter / Pelanggaran untuk ${student.name}`}
                            >
                              <i className="fa-solid fa-star text-xs"></i>
                            </button>
                          )}

                          {/* Quick Izin / Sakit */}
                          {onSaveLeave && (
                            <button
                              onClick={() => {
                                setTargetStudentForModal(student.id);
                                setIsLeaveModalOpen(true);
                              }}
                              className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors cursor-pointer"
                              title={`Catat Izin / Sakit Terjadwal untuk ${student.name}`}
                            >
                              <i className="fa-solid fa-calendar-plus text-xs"></i>
                            </button>
                          )}

                          {/* Edit & Delete Buttons with Permission Check */}
                          {canEditStudent(student) ? (
                            <>
                              <button
                                onClick={() => handleOpenEditForm(student)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Siswa"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>

                              <button
                                onClick={() => setStudentToDelete(student)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Siswa"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </>
                          ) : (
                            <span
                              className="p-1.5 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                              title={
                                isGuruMapel
                                  ? 'Guru Mapel: Hanya Wali Kelas & Admin yang dapat mengedit/menghapus data siswa'
                                  : `Hanya Wali Kelas ${student.classRoom} atau Admin yang dapat mengedit siswa ini`
                              }
                            >
                              <i className="fa-solid fa-lock text-xs"></i>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 text-lg">
                        <i className="fa-solid fa-user-slash"></i>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">Tidak ada siswa ditemukan</p>
                      <p className="text-xs text-slate-400">
                        Tidak ada data siswa yang cocok dengan filter kelas atau kata kunci pencarian Anda.
                      </p>
                      {(searchTerm || selectedClass !== 'Semua') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedClass('Semua');
                          }}
                          className="mt-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                        >
                          Reset Filter & Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-scale-up my-8">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-1">
              <i className="fa-solid fa-user-gear text-indigo-600"></i>
              <span>{editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Isi formulir data siswa SD untuk pendaftaran absensi dan kartu pelajar.
            </p>

            {!editingStudent && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-emerald-900">Ingin Tambah Siswa Massal via Excel?</p>
                  <p className="text-[11px] text-emerald-700">Unduh template acuan (NIS, Nama, Kelas, No HP Ortu) lalu unggah file Excel.</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadStudentImportTemplateExcel(formData.classRoom)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <i className="fa-solid fa-file-excel text-[10px]"></i>
                    <span>Template Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormModalOpen(false);
                      excelFileInputRef.current?.click();
                    }}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i>
                    <span>Unggah Excel</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* NIS */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIS (Nomor Induk Siswa) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1001"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-mono font-bold focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                {/* NISN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NISN (Nomor Induk Siswa Nasional)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Contoh: 0081234567 (10 digit)"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-mono font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Fauzi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-bold focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 uppercase"
                  />
                </div>

                {/* Class Dropdown - SD Classes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas SD <span className="text-rose-500">*</span>
                  </label>
                  {isWaliKelas && myHomeroom ? (
                    <div className="w-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-2 text-xs text-emerald-900 dark:text-emerald-300 font-bold flex items-center justify-between">
                      <span>{formatClassLabel(myHomeroom)}</span>
                      <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-extrabold">
                        Kelas Binaan
                      </span>
                    </div>
                  ) : (
                    <select
                      value={formData.classRoom}
                      onChange={(e) => setFormData({ ...formData, classRoom: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-bold focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                    >
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          {formatClassLabel(cls)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Tempat & Tanggal Lahir (TTL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ogomojolo / Palasa"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => {
                      const newGender = e.target.value as Gender;
                      setFormData((prev) => ({
                        ...prev,
                        gender: newGender,
                        avatarUrl:
                          !prev.photo && (prev.avatarUrl === MALE_BW_AVATAR || prev.avatarUrl === FEMALE_BW_AVATAR)
                            ? getDefaultAvatar(newGender)
                            : prev.avatarUrl,
                      }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Religion */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Agama
                  </label>
                  <select
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen Protestan">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                  </select>
                </div>
              </div>

              {/* Alamat & Kontak Ortu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Siswa
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dusun 1, Desa Ogomojolo, Kec. Palasa"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. HP / WhatsApp Orang Tua
                  </label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              {/* Photo Upload & Black/White Silhouette Options */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Foto Profil Siswa (Proses via FileReader Base64)
                </label>

                {/* Live Preview */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={formData.photo || formData.avatarUrl || getDefaultAvatar(formData.gender)}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/30 bg-slate-200 shadow-xs"
                    />
                    {isCompressingPhoto && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-spinner fa-spin text-white text-sm"></i>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    {/* Real File Upload with Auto-Compression */}
                    <label className={`inline-flex items-center gap-2 px-3 py-1.5 ${isCompressingPhoto ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'} text-white text-xs font-bold rounded-xl shadow-xs transition-all`}>
                      {isCompressingPhoto ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                          <span>Mengompres Foto...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                          <span>Unggah Foto Pasfoto (Auto-Kompres)</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isCompressingPhoto}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Otomatis dikompres ke ~15-20 KB agar sangat ringan & hemat penyimpanan (JPG/PNG/WEBP)
                    </p>
                  </div>
                </div>

                {/* Black & White Silhouette Presets (Faceless) */}
                <div className="border-t border-slate-200/60 pt-2.5">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Atau Pilih Avatar Siluet Hitam-Putih (Tanpa Wajah):
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          photo: undefined,
                          avatarUrl: MALE_BW_AVATAR,
                        })
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        !formData.photo && formData.avatarUrl === MALE_BW_AVATAR
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <img src={MALE_BW_AVATAR} alt="Male B&W" className="w-5 h-5 rounded-full" />
                      <span>Siluet Laki-laki</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          photo: undefined,
                          avatarUrl: FEMALE_BW_AVATAR,
                        })
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        !formData.photo && formData.avatarUrl === FEMALE_BW_AVATAR
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <img src={FEMALE_BW_AVATAR} alt="Female B&W" className="w-5 h-5 rounded-full" />
                      <span>Siluet Perempuan</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Digital Student Card */}
      {cardStudent && (
        <StudentCardModal
          student={cardStudent}
          settings={settings}
          onSaveDefaultTemplate={(templateId: CardTemplateId) => {
            if (onUpdateSettings) {
              onUpdateSettings({ ...settings, defaultCardTemplate: templateId });
            } else {
              localStorage.setItem('absensi_default_card_template', templateId);
            }
          }}
          onUpdateSettings={onUpdateSettings}
          onClose={() => setCardStudent(null)}
        />
      )}

      {/* Modal Bulk Print A4 Student Cards */}
      {isBulkPrintModalOpen && (
        <BulkCardPrintModal
          students={students}
          settings={settings}
          currentTeacher={currentTeacher}
          initialClass={effectiveClass}
          initialSelectedIds={bulkPrintSelectedIds}
          onSaveDefaultTemplate={(templateId: CardTemplateId) => {
            if (onUpdateSettings) {
              onUpdateSettings({ ...settings, defaultCardTemplate: templateId });
            } else {
              localStorage.setItem('absensi_default_card_template', templateId);
            }
          }}
          onUpdateSettings={onUpdateSettings}
          onClose={() => {
            setIsBulkPrintModalOpen(false);
            setBulkPrintSelectedIds(undefined);
          }}
        />
      )}

      {/* Modal Branding Kartu Siswa: Logo & TTD Kepala Sekolah */}
      {isBrandingModalOpen && (
        <CardBrandingModal
          isOpen={isBrandingModalOpen}
          settings={settings}
          onUpdateSettings={(updated) => {
            if (onUpdateSettings) {
              onUpdateSettings(updated);
            }
          }}
          onClose={() => setIsBrandingModalOpen(false)}
        />
      )}

      {/* Modal Pemilihan 3 Contoh Desain Kartu Siswa (CR80) */}
      {isTemplateModalOpen && (
        <CardTemplateSelectionModal
          settings={settings}
          sampleStudents={students.slice(0, 3)}
          onClose={() => setIsTemplateModalOpen(false)}
          onSaveDefaultTemplate={(templateId: CardTemplateId) => {
            if (onUpdateSettings) {
              onUpdateSettings({ ...settings, defaultCardTemplate: templateId });
            } else {
              localStorage.setItem('absensi_default_card_template', templateId);
            }
            setIsTemplateModalOpen(false);
          }}
        />
      )}

      {/* Confirmation Modal for Delete Single Student */}
      {studentToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Konfirmasi Hapus Siswa</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus data siswa <strong>{studentToDelete.name}</strong>?
              </p>
              <div className="text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5 mt-2 text-left space-y-0.5 font-medium text-slate-700 dark:text-slate-300">
                <div><strong>NIS:</strong> {studentToDelete.nis}</div>
                <div><strong>Kelas:</strong> {studentToDelete.classRoom}</div>
                <div><strong>Jenis Kelamin:</strong> {studentToDelete.gender}</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = studentToDelete.id;
                  setStudentToDelete(null);
                  onDeleteStudent(id);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Bulk Delete Students */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl shadow-xs">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Hapus {selectedStudentIds.size} Siswa Terpilih?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus data <strong>{selectedStudentIds.size} siswa</strong> yang dicentang? Tindakan ini akan menghapus data siswa secara permanen dari database.
              </p>
              <div className="max-h-48 overflow-y-auto text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5 mt-2 text-left divide-y divide-slate-100 dark:divide-slate-700">
                {Array.from(selectedStudentIds).map((id) => {
                  const std = students.find((s) => s.id === id);
                  if (!std) return null;
                  const canDel = canDeleteStudent(std);
                  return (
                    <div key={id} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{std.name}</span>{' '}
                        <span className="text-slate-400 font-mono text-[10px]">(NIS: {std.nis})</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        canDel
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {canDel ? `Kelas ${std.classRoom}` : 'Tidak Berizin'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Ya, Hapus ({selectedStudentIds.size}) Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Leaves Modal */}
      {isLeaveModalOpen && onSaveLeave && onDeleteLeave && (
        <ScheduledLeaveModal
          students={students}
          leaves={scheduledLeaves}
          currentTeacher={currentTeacher}
          initialStudentId={targetStudentForModal || undefined}
          onSaveLeave={onSaveLeave}
          onDeleteLeave={onDeleteLeave}
          onClose={() => {
            setIsLeaveModalOpen(false);
            setTargetStudentForModal(null);
          }}
        />
      )}

      {/* Student Behavior & Character Log Modal */}
      {isBehaviorModalOpen && onSaveBehaviorLog && onDeleteBehaviorLog && (
        <StudentBehaviorModal
          students={students}
          behaviorLogs={behaviorLogs}
          settings={settings}
          currentTeacher={currentTeacher}
          initialStudentId={targetStudentForModal || undefined}
          onSaveBehaviorLog={onSaveBehaviorLog}
          onDeleteBehaviorLog={onDeleteBehaviorLog}
          onClose={() => {
            setIsBehaviorModalOpen(false);
            setTargetStudentForModal(null);
          }}
        />
      )}
    </div>
  );
};
