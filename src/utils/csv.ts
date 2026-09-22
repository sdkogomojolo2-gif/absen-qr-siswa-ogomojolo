import { AttendanceRecord, Student, SystemSettings, Teacher } from '../types';
import { formatCleanNIP, resolveRecordTeacher } from './classUtils';

export interface CSVAttendanceExportOptions {
  records: AttendanceRecord[];
  filename?: string;
  settings?: SystemSettings;
  selectedClass?: string;
  dateRangeLabel?: string;
  teachers?: Teacher[];
  students?: Student[];
  currentTeacher?: Teacher | null;
  homeroomTeacher?: {
    name?: string;
    nip?: string;
    classLabel?: string;
  };
  headmaster?: {
    name?: string;
    nip?: string;
  };
  signatureDate?: string;
}

/**
 * Export attendance records to Excel-compatible CSV file with UTF-8 BOM
 */
export const exportAttendanceToCSV = (
  recordsOrOptions: AttendanceRecord[] | CSVAttendanceExportOptions,
  legacyFilename?: string
) => {
  let records: AttendanceRecord[] = [];
  let filename = legacyFilename || 'Rekap_Absensi_Siswa_SD.csv';
  let settings: SystemSettings | undefined = undefined;
  let selectedClass = 'Semua';
  let dateRangeLabel = '';
  let teachers: Teacher[] | undefined = undefined;
  let students: Student[] | undefined = undefined;
  let currentTeacher: Teacher | null | undefined = undefined;
  let homeroomTeacher: { name?: string; nip?: string; classLabel?: string } | undefined = undefined;
  let headmaster: { name?: string; nip?: string } | undefined = undefined;
  let signatureDate = '';

  if (Array.isArray(recordsOrOptions)) {
    records = recordsOrOptions;
  } else {
    records = recordsOrOptions.records;
    filename = recordsOrOptions.filename || filename;
    settings = recordsOrOptions.settings;
    selectedClass = recordsOrOptions.selectedClass || 'Semua';
    dateRangeLabel = recordsOrOptions.dateRangeLabel || '';
    teachers = recordsOrOptions.teachers;
    students = recordsOrOptions.students;
    currentTeacher = recordsOrOptions.currentTeacher;
    homeroomTeacher = recordsOrOptions.homeroomTeacher;
    headmaster = recordsOrOptions.headmaster;
    signatureDate = recordsOrOptions.signatureDate || '';
  }

  if (!records || records.length === 0) {
    alert('Tidak ada data absensi untuk diekspor.');
    return;
  }

  const lines: string[] = [];

  // Kop Header if settings provided
  if (settings) {
    lines.push(`"${settings.schoolName.toUpperCase()}"`);
    lines.push(`"LAPORAN REKAPITULASI PRESENSI SISWA - TAHUN AJARAN ${settings.academicYear}"`);
    if (dateRangeLabel) lines.push(`"Periode:","${dateRangeLabel}"`);
    lines.push(`"Kelas:","${selectedClass}"`);
    lines.push(`"Batas Masuk:","${settings.lateCutoffTime} WIB"`);
    lines.push('""');
  }

  // Header row
  const headers = [
    'No',
    'Tanggal',
    'Jam Masuk',
    'NIS',
    'Nama Siswa',
    'Kelas',
    'Status Kehadiran',
    'Guru Pengabsen',
    'Metode Absen',
    'Keterangan',
  ];
  lines.push(headers.join(','));

  // Data rows
  records.forEach((record, index) => {
    const tInfo = resolveRecordTeacher(record, teachers, students, currentTeacher);
    const roleTag =
      tInfo.type === 'wali_kelas'
        ? (tInfo.subject.startsWith('Wali') ? tInfo.subject : `Wali ${tInfo.subject}`)
        : tInfo.type === 'guru_mapel'
        ? (tInfo.subject.startsWith('Mapel') ? tInfo.subject : `Mapel: ${tInfo.subject}`)
        : (tInfo.subject || 'Admin');
    const teacherStr = `${tInfo.name} (${roleTag})`;

    const row = [
      index + 1,
      `"${record.date}"`,
      `"${record.time}"`,
      `"${record.nis}"`,
      `"${record.studentName.replace(/"/g, '""')}"`,
      `"${record.classRoom}"`,
      `"${record.status}"`,
      `"${teacherStr.replace(/"/g, '""')}"`,
      `"${record.scannedVia}"`,
      `"${(record.note || '').replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(','));
  });

  // Tanda Tangan Section
  if (settings) {
    const now = new Date();
    const dateFormatted = signatureDate || now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const city = settings.schoolCity || 'Kota';
    const waliTitle = homeroomTeacher?.classLabel || (selectedClass !== 'Semua' ? `Wali Kelas ${selectedClass}` : 'Wali Kelas / Koordinator');
    const waliName = homeroomTeacher?.name?.trim() || '( ........................................ )';
    const waliNip = formatCleanNIP(homeroomTeacher?.nip);

    const headName = headmaster?.name?.trim() || settings.headmasterName?.trim() || '( ........................................ )';
    const headNip = formatCleanNIP(headmaster?.nip || settings.headmasterNip);

    lines.push('""');
    lines.push('""');
    lines.push(`"","Mengetahui,","","","","","${city}, ${dateFormatted}"`);
    lines.push(`"","${waliTitle}","","","","","Mengetahui,"`);
    lines.push(`"","","","","","","Kepala Sekolah"`);
    lines.push('""');
    lines.push('""');
    lines.push(`"","${waliName}","","","","","${headName}"`);
    lines.push(`"","${waliNip}","","","","","${headNip}"`);
  }

  // Combine CSV content with BOM for Excel UTF-8 compatibility
  const csvContent = '\uFEFF' + lines.join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

export interface MonthlyRecapCSVExportOptions {
  recaps: Array<{
    nis: string;
    name: string;
    classRoom: string;
    gender: string;
    hadir: number;
    terlambat: number;
    sakit: number;
    izin: number;
    alpa: number;
    totalHadir: number;
    percentage: number;
  }>;
  monthLabel: string;
  selectedClass: string;
  settings: SystemSettings;
  homeroomTeacher?: {
    name?: string;
    nip?: string;
    classLabel?: string;
  };
  headmaster?: {
    name?: string;
    nip?: string;
  };
  signatureDate?: string;
  filename?: string;
  subjectInfo?: {
    teacherName?: string;
    teacherNip?: string;
    subjectName?: string;
  };
  reportType?: 'wali_kelas' | 'guru_mapel' | 'admin';
  totalEffectiveDays?: number;
}

/**
 * Export Monthly Student Attendance Summary (Per Siswa: Hadir, Terlambat, Sakit, Izin, Alfa) to CSV
 */
export const exportMonthlyRecapToCSV = ({
  recaps,
  monthLabel,
  selectedClass,
  settings,
  homeroomTeacher,
  headmaster,
  signatureDate,
  filename,
  subjectInfo,
  reportType = 'wali_kelas',
  totalEffectiveDays,
}: MonthlyRecapCSVExportOptions) => {
  if (!recaps || recaps.length === 0) {
    alert('Tidak ada data siswa untuk diekspor ke rekap bulanan.');
    return;
  }

  const lines: string[] = [];

  // Kop Header
  lines.push(`"${settings.schoolName.toUpperCase()}"`);
  if (reportType === 'guru_mapel' && subjectInfo) {
    lines.push(`"LAPORAN REKAPITULASI PRESENSI MAPEL ${subjectInfo.subjectName?.toUpperCase() || 'MATA PELAJARAN'}"`);
    lines.push(`"Guru Pengampu:","${subjectInfo.teacherName || '-'}"`);
    lines.push(`"NIP:","${formatCleanNIP(subjectInfo.teacherNip)}"`);
  } else if (reportType === 'wali_kelas') {
    lines.push(`"LAPORAN REKAPITULASI PRESENSI SISWA KELAS ${selectedClass}"`);
    lines.push(`"Keterangan:","Rekapitulasi Terpadu Presensi Wali Kelas & Guru Mapel"`);
  } else {
    lines.push(`"LAPORAN REKAPITULASI PRESENSI SISWA"`);
  }
  lines.push(`"Tahun Ajaran:","${settings.academicYear}"`);
  lines.push(`"Bulan / Periode:","${monthLabel}"`);
  lines.push(`"Kelas:","${selectedClass === 'Semua' ? 'Semua Kelas' : `Kelas ${selectedClass}`}"`);
  lines.push(`"Total Siswa:","${recaps.length} Siswa"`);
  if (totalEffectiveDays) {
    lines.push(`"Hari Efektif:","${totalEffectiveDays} Hari"`);
  }
  lines.push('""');

  // Columns
  const headers = [
    'No',
    'NIS',
    'Nama Siswa',
    'Kelas',
    'L/P',
    'Hadir (Hari)',
    'Terlambat (Hari)',
    'Sakit (Hari)',
    'Izin (Hari)',
    'Alfa (Hari)',
    'Total Hadir (Hari)',
    'Persentase Kehadiran (%)',
  ];
  lines.push(headers.join(','));

  let totalHadir = 0;
  let totalTerlambat = 0;
  let totalSakit = 0;
  let totalIzin = 0;
  let totalAlpa = 0;
  let totalKehadiranSemua = 0;

  recaps.forEach((r, idx) => {
    totalHadir += r.hadir;
    totalTerlambat += r.terlambat;
    totalSakit += r.sakit;
    totalIzin += r.izin;
    totalAlpa += r.alpa;
    totalKehadiranSemua += r.totalHadir;

    const row = [
      idx + 1,
      `"${r.nis}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.classRoom}"`,
      `"${r.gender === 'Perempuan' ? 'P' : 'L'}"`,
      r.hadir,
      r.terlambat,
      r.sakit,
      r.izin,
      r.alpa,
      r.totalHadir,
      `"${r.percentage}%"`,
    ];
    lines.push(row.join(','));
  });

  // Summary Row
  lines.push(
    [
      '"TOTAL"',
      '""',
      '""',
      '""',
      '""',
      totalHadir,
      totalTerlambat,
      totalSakit,
      totalIzin,
      totalAlpa,
      totalKehadiranSemua,
      '""',
    ].join(',')
  );

  // Signatures
  const now = new Date();
  const dateFormatted = signatureDate || now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const city = settings.schoolCity || 'Kota';
  const signerTitle =
    reportType === 'guru_mapel' && subjectInfo
      ? `Guru Mapel ${subjectInfo.subjectName || ''}`
      : homeroomTeacher?.classLabel ||
        (selectedClass !== 'Semua' ? `Wali Kelas ${selectedClass}` : 'Wali Kelas / Koordinator');
  const signerName =
    reportType === 'guru_mapel' && subjectInfo
      ? subjectInfo.teacherName || '( ........................................ )'
      : homeroomTeacher?.name?.trim() || '( ........................................ )';
  const signerNip =
    reportType === 'guru_mapel' && subjectInfo
      ? formatCleanNIP(subjectInfo.teacherNip)
      : formatCleanNIP(homeroomTeacher?.nip);

  const headName = headmaster?.name?.trim() || settings.headmasterName?.trim() || '( ........................................ )';
  const headNip = formatCleanNIP(headmaster?.nip || settings.headmasterNip);

  lines.push('""');
  lines.push('""');
  lines.push(`"","Mengetahui,","","","","","${city}, ${dateFormatted}"`);
  lines.push(`"","${signerTitle}","","","","","Mengetahui,"`);
  lines.push(`"","","","","","","Kepala Sekolah"`);
  lines.push('""');
  lines.push('""');
  lines.push(`"","${signerName}","","","","","${headName}"`);
  lines.push(`"","${signerNip}","","","","","${headNip}"`);

  const safeSchool = settings.schoolName.replace(/[\s\/\\]+/g, '_');
  const safeMonth = monthLabel.replace(/[\s\/\\]+/g, '_');
  const safeClass = selectedClass.replace(/[\s\/\\]+/g, '_');
  const defaultFilename = `Rekap_Bulanan_${safeSchool}_${safeMonth}_Kelas_${safeClass}.csv`;

  const csvContent = '\uFEFF' + lines.join('\n');
  downloadFile(csvContent, filename || defaultFilename, 'text/csv;charset=utf-8;');
};

/**
 * Export student list to Excel-compatible CSV file
 */
export const exportStudentsToCSV = (
  students: Student[],
  filename = 'Data_Siswa_SD.csv',
  options?: {
    settings?: SystemSettings;
    selectedClass?: string;
    homeroomTeacher?: { name?: string; nip?: string; classLabel?: string };
    headmaster?: { name?: string; nip?: string };
  }
) => {
  if (!students || students.length === 0) {
    alert('Tidak ada data siswa untuk diekspor.');
    return;
  }

  const lines: string[] = [];

  if (options?.settings) {
    const s = options.settings;
    lines.push(`"${s.schoolName.toUpperCase()}"`);
    lines.push(`"BUKU INDUK / DATA SISWA - TAHUN AJARAN ${s.academicYear}"`);
    if (options.selectedClass) lines.push(`"Kelas:","${options.selectedClass}"`);
    lines.push(`"Total Siswa:","${students.length} Siswa"`);
    lines.push('""');
  }

  const headers = ['No', 'NIS', 'NISN', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Agama', 'Alamat', 'No HP Orang Tua', 'Tanggal Daftar'];
  lines.push(headers.join(','));

  students.forEach((std, index) => {
    const row = [
      index + 1,
      `"${std.nis}"`,
      `"${std.nisn || '-'}"`,
      `"${std.name.replace(/"/g, '""')}"`,
      `"${std.classRoom}"`,
      `"${std.gender}"`,
      `"${std.birthPlace || '-'}"`,
      `"${std.birthDate || '-'}"`,
      `"${std.religion || '-'}"`,
      `"${(std.address || '-').replace(/"/g, '""')}"`,
      `"${std.parentPhone || '-'}"`,
      `"${std.createdAt || '-'}"`,
    ];
    lines.push(row.join(','));
  });

  if (options?.settings) {
    const s = options.settings;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const city = s.schoolCity || 'Kota';
    const waliTitle = options.homeroomTeacher?.classLabel || (options.selectedClass && options.selectedClass !== 'Semua' ? `Wali Kelas ${options.selectedClass}` : 'Wali Kelas / Koordinator');
    const waliName = options.homeroomTeacher?.name?.trim() || '( ........................................ )';
    const waliNip = formatCleanNIP(options.homeroomTeacher?.nip);
    const headName = options.headmaster?.name?.trim() || s.headmasterName?.trim() || '( ........................................ )';
    const headNip = formatCleanNIP(options.headmaster?.nip || s.headmasterNip);

    lines.push('""');
    lines.push('""');
    lines.push(`"","Mengetahui,","","","${city}, ${dateFormatted}"`);
    lines.push(`"","${waliTitle}","","","Mengetahui,"`);
    lines.push(`"","","","","Kepala Sekolah"`);
    lines.push('""');
    lines.push('""');
    lines.push(`"","${waliName}","","","${headName}"`);
    lines.push(`"","${waliNip}","","","${headNip}"`);
  }

  const csvContent = '\uFEFF' + lines.join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * Export full application database to a JSON backup file
 */
export const exportFullBackupJSON = (
  students: Student[],
  attendanceRecords: AttendanceRecord[],
  settings: SystemSettings,
  teachers: Teacher[]
) => {
  const backupData = {
    app: 'Aplikasi Absensi QR Code Siswa SD',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    students,
    attendanceRecords,
    settings,
    teachers,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(jsonString, `Backup_Database_Absensi_SD_${dateStr}.json`, 'application/json');
};

/**
 * Download CSV Template for Bulk Student Import
 */
export const downloadStudentImportTemplateCSV = (className: string = 'Kelas 1') => {
  const headers = ['NIS', 'NISN', 'Nama', 'Kelas', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Agama', 'Alamat', 'No HP Orang Tua'];
  const sampleRows = [
    ['1001', '0081234561', 'Ahmad Fauzi', className, 'Laki-laki', 'Ogomojolo', '2014-08-12', 'Islam', 'Desa Ogomojolo, Kec. Palasa', '081234567890'],
    ['1002', '0081234562', 'Anisa Rahmawati', className, 'Perempuan', 'Palasa', '2014-05-14', 'Islam', 'Desa Ogomojolo, Kec. Palasa', '081234567891'],
    ['1003', '0081234563', 'Budi Santoso', className, 'Laki-laki', 'Parigi', '2014-11-20', 'Islam', 'Desa Ogomojolo, Kec. Palasa', '081234567892'],
  ];

  const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
  downloadFile(csvContent, `Template_Import_Siswa_${className.replace(/\s+/g, '_')}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Parse uploaded CSV file content into Student array
 */
export const parseStudentImportCSV = (
  csvText: string,
  defaultClass: string,
  existingStudents: Student[]
): { students: Student[]; errors: string[]; addedCount: number } => {
  const lines = csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    return { students: [], errors: ['File CSV kosong atau hanya berisi baris header.'], addedCount: 0 };
  }

  const MALE_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const FEMALE_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';

  const newStudents: Student[] = [];
  const errors: string[] = [];
  const existingNisSet = new Set(existingStudents.map(s => s.nis.trim()));

  // Examine header row to determine column indices dynamically
  const headerCols = lines[0].split(/[,;\t]/).map(c => c.replace(/^["']|["']$/g, '').trim().toLowerCase());
  let nisIdx = headerCols.findIndex(c => c === 'nis' || (c.includes('nis') && !c.includes('nisn')));
  let nisnIdx = headerCols.findIndex(c => c.includes('nisn'));
  let nameIdx = headerCols.findIndex(c => c.includes('nama'));
  let classIdx = headerCols.findIndex(c => c.includes('kelas'));
  let genderIdx = headerCols.findIndex(c => c.includes('kelamin') || c.includes('gender') || c.includes('jk'));
  let birthPlaceIdx = headerCols.findIndex(c => c.includes('tempat') || c.includes('tmp_lahir'));
  let birthDateIdx = headerCols.findIndex(c => c.includes('tanggal') || c.includes('tgl_lahir') || c.includes('lahir'));
  let ttlIdx = headerCols.findIndex(c => c === 'ttl' || c.includes('tempat tanggal lahir'));
  let religionIdx = headerCols.findIndex(c => c.includes('agama'));
  let addressIdx = headerCols.findIndex(c => c.includes('alamat') || c.includes('domisili'));
  let phoneIdx = headerCols.findIndex(c => c.includes('hp') || c.includes('phone') || c.includes('ortu') || c.includes('telepon') || c.includes('wa'));

  // Fallbacks if header matching fails
  if (nisIdx === -1) nisIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (classIdx === -1) classIdx = 2;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine
      .split(/[,;\t]/)
      .map(col => col.replace(/^["']|["']$/g, '').trim());

    if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) continue;

    const nis = cols[nisIdx] || '';
    const nisn = nisnIdx >= 0 ? cols[nisnIdx] || '' : '';
    const name = cols[nameIdx] || '';
    const classRoom = cols[classIdx] || defaultClass || 'Kelas 1';
    let gender = cols[genderIdx] || 'Laki-laki';
    const parentPhone = phoneIdx >= 0 ? cols[phoneIdx] || '' : '';
    let birthPlace = birthPlaceIdx >= 0 ? cols[birthPlaceIdx] || '' : '';
    let birthDate = birthDateIdx >= 0 ? cols[birthDateIdx] || '' : '';
    const religion = religionIdx >= 0 ? cols[religionIdx] || 'Islam' : 'Islam';
    const address = addressIdx >= 0 ? cols[addressIdx] || 'Desa Ogomojolo, Kec. Palasa' : 'Desa Ogomojolo, Kec. Palasa';

    if (ttlIdx >= 0 && (!birthPlace || !birthDate)) {
      const ttlVal = cols[ttlIdx] || '';
      if (ttlVal.includes(',')) {
        const parts = ttlVal.split(',');
        if (!birthPlace) birthPlace = parts[0].trim();
        if (!birthDate) birthDate = parts.slice(1).join(',').trim();
      } else if (!birthPlace) {
        birthPlace = ttlVal;
      }
    }

    if (!nis || !name) {
      errors.push(`Baris ${i + 1}: NIS dan Nama Wajib diisi (${rawLine}).`);
      continue;
    }

    if (existingNisSet.has(nis)) {
      errors.push(`Baris ${i + 1}: NIS "${nis}" sudah terdaftar di sistem, dilewati.`);
      continue;
    }

    const gLower = gender.toLowerCase();
    if (gLower.includes('p') || gLower.includes('female') || gLower.includes('wanita') || gLower === 'pr') {
      gender = 'Perempuan';
    } else {
      gender = 'Laki-laki';
    }

    const uniqueId = `std-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 8)}`;

    const newStudent: Student = {
      id: uniqueId,
      nis: nis,
      nisn: nisn || undefined,
      name: name,
      classRoom: classRoom,
      gender: gender as 'Laki-laki' | 'Perempuan',
      birthPlace: birthPlace || 'Ogomojolo',
      birthDate: birthDate || undefined,
      ttl: birthPlace && birthDate ? `${birthPlace}, ${birthDate}` : birthPlace || undefined,
      religion: religion,
      address: address,
      parentPhone: parentPhone,
      avatarUrl: gender === 'Perempuan' ? FEMALE_AVATAR : MALE_AVATAR,
      createdAt: new Date().toISOString().split('T')[0],
    };

    existingNisSet.add(nis);
    newStudents.push(newStudent);
  }

  return {
    students: newStudents,
    errors,
    addedCount: newStudents.length,
  };
};

/**
 * Helper to trigger file download in browser
 */
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

