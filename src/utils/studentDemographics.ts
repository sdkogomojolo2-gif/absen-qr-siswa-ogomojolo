import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SystemSettings, Teacher } from '../types';
import { formatCleanNIP } from './classUtils';

export interface StudentAgeInfo {
  years: number;
  months: number;
  formatted: string;
  ageGroup: string;
  rawBirthDate: string;
}

export const AGE_GROUPS = [
  '< 6 Tahun',
  '6 Tahun',
  '7 Tahun',
  '8 Tahun',
  '9 Tahun',
  '10 Tahun',
  '11 Tahun',
  '12 Tahun',
  '> 12 Tahun',
  'Belum Ada Data',
] as const;

export type AgeGroupType = typeof AGE_GROUPS[number];

export const STANDARD_RELIGIONS = [
  'Islam',
  'Kristen Protestan',
  'Katolik',
  'Hindu',
  'Buddha',
  'Khonghucu',
  'Lainnya',
] as const;

/**
 * Normalizes religion names to standard Indonesian school naming
 */
export const normalizeReligion = (raw?: string): string => {
  if (!raw) return 'Islam';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('islam')) return 'Islam';
  if (lower.includes('protestan') || lower === 'kristen') return 'Kristen Protestan';
  if (lower.includes('katolik')) return 'Katolik';
  if (lower.includes('hindu')) return 'Hindu';
  if (lower.includes('buddha') || lower.includes('budha')) return 'Buddha';
  if (lower.includes('khonghucu') || lower.includes('konghucu')) return 'Khonghucu';
  return trimmed;
};

/**
 * Robust date parser from birthDate string or TTL string
 */
export const parseStudentBirthDate = (student: Student): Date | null => {
  if (student.birthDate) {
    const d = new Date(student.birthDate);
    if (!isNaN(d.getTime())) return d;
  }

  if (student.ttl) {
    // Try to extract date from strings like "Ogomojolo, 15-08-2015" or "15 Mei 2015"
    const raw = student.ttl;
    // Check for YYYY-MM-DD
    const isoMatch = raw.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (isoMatch) {
      const d = new Date(`${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`);
      if (!isNaN(d.getTime())) return d;
    }

    // Check for DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = raw.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
    if (dmyMatch) {
      const d = new Date(`${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`);
      if (!isNaN(d.getTime())) return d;
    }

    // Check for Indonesian month names: 15 Mei 2015
    const indoMonths: Record<string, string> = {
      januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', ags: '08', agu: '08',
      sep: '09', okt: '10', nov: '11', des: '12'
    };
    const indoMatch = raw.match(/\b(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})\b/);
    if (indoMatch) {
      const day = indoMatch[1].padStart(2, '0');
      const monthKey = indoMatch[2].toLowerCase();
      const month = indoMonths[monthKey];
      const year = indoMatch[3];
      if (month) {
        const d = new Date(`${year}-${month}-${day}`);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  return null;
};

/**
 * Calculates student age in years and months precisely
 */
export const calculateStudentAge = (student: Student, referenceDate: Date = new Date()): StudentAgeInfo => {
  const birthDate = parseStudentBirthDate(student);

  if (!birthDate) {
    return {
      years: -1,
      months: -1,
      formatted: student.birthDate || student.ttl ? 'Format Tidak Terbaca' : 'Belum Ada Data',
      ageGroup: 'Belum Ada Data',
      rawBirthDate: student.birthDate || student.ttl || '-',
    };
  }

  const now = referenceDate;
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();

  if (months < 0 || (months === 0 && now.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }

  if (now.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) {
      months += 12;
    }
  }

  // Determine age group
  let ageGroup: AgeGroupType;
  if (years < 6) {
    ageGroup = '< 6 Tahun';
  } else if (years === 6) {
    ageGroup = '6 Tahun';
  } else if (years === 7) {
    ageGroup = '7 Tahun';
  } else if (years === 8) {
    ageGroup = '8 Tahun';
  } else if (years === 9) {
    ageGroup = '9 Tahun';
  } else if (years === 10) {
    ageGroup = '10 Tahun';
  } else if (years === 11) {
    ageGroup = '11 Tahun';
  } else if (years === 12) {
    ageGroup = '12 Tahun';
  } else {
    ageGroup = '> 12 Tahun';
  }

  const formatted = months > 0 ? `${years} Thn ${months} Bln` : `${years} Thn`;
  const rawBirthStr = student.birthDate 
    ? student.birthDate 
    : birthDate.toISOString().slice(0, 10);

  return {
    years,
    months,
    formatted,
    ageGroup,
    rawBirthDate: rawBirthStr,
  };
};

export interface ReligionStat {
  religion: string;
  male: number;
  female: number;
  total: number;
  percentage: number;
}

export interface AgeGroupStat {
  ageGroup: string;
  male: number;
  female: number;
  total: number;
  percentage: number;
}

export interface DemographicStats {
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  averageAge: number;
  religionStats: ReligionStat[];
  ageStats: AgeGroupStat[];
  matrix: {
    ageGroup: string;
    counts: Record<string, { male: number; female: number; total: number }>;
    rowTotal: number;
  }[];
  religionsInUse: string[];
}

/**
 * Computes demographic statistics for students (religion breakdown, age breakdown, and cross matrix)
 */
export const computeDemographicStats = (students: Student[], referenceDate: Date = new Date()): DemographicStats => {
  const totalStudents = students.length;
  let maleStudents = 0;
  let femaleStudents = 0;
  let ageSum = 0;
  let ageCount = 0;

  const religionMap = new Map<string, { male: number; female: number; total: number }>();
  const ageMap = new Map<string, { male: number; female: number; total: number }>();

  // Initialize age map with all standard groups
  AGE_GROUPS.forEach((group) => {
    ageMap.set(group, { male: 0, female: 0, total: 0 });
  });

  // Track unique religions found in this batch
  const uniqueReligionsSet = new Set<string>();

  students.forEach((s) => {
    const isMale = s.gender === 'Laki-laki';
    if (isMale) maleStudents++;
    else femaleStudents++;

    // Religion
    const rel = normalizeReligion(s.religion);
    uniqueReligionsSet.add(rel);
    const currRel = religionMap.get(rel) || { male: 0, female: 0, total: 0 };
    if (isMale) currRel.male++;
    else currRel.female++;
    currRel.total++;
    religionMap.set(rel, currRel);

    // Age
    const ageInfo = calculateStudentAge(s, referenceDate);
    if (ageInfo.years >= 0) {
      ageSum += ageInfo.years;
      ageCount++;
    }
    const currAge = ageMap.get(ageInfo.ageGroup) || { male: 0, female: 0, total: 0 };
    if (isMale) currAge.male++;
    else currAge.female++;
    currAge.total++;
    ageMap.set(ageInfo.ageGroup, currAge);
  });

  // Ensure standard religions are at least considered
  STANDARD_RELIGIONS.forEach((r) => {
    if (!religionMap.has(r)) {
      religionMap.set(r, { male: 0, female: 0, total: 0 });
    }
  });

  // Filter religions in use (or standard)
  const sortedReligions = Array.from(religionMap.keys()).sort((a, b) => {
    const idxA = STANDARD_RELIGIONS.indexOf(a as any);
    const idxB = STANDARD_RELIGIONS.indexOf(b as any);
    if (idxA >= 0 && idxB >= 0) return idxA - idxB;
    if (idxA >= 0) return -1;
    if (idxB >= 0) return 1;
    return a.localeCompare(b);
  });

  const religionStats: ReligionStat[] = sortedReligions.map((rel) => {
    const counts = religionMap.get(rel)!;
    return {
      religion: rel,
      male: counts.male,
      female: counts.female,
      total: counts.total,
      percentage: totalStudents > 0 ? Number(((counts.total / totalStudents) * 100).toFixed(1)) : 0,
    };
  });

  const ageStats: AgeGroupStat[] = AGE_GROUPS.map((group) => {
    const counts = ageMap.get(group) || { male: 0, female: 0, total: 0 };
    return {
      ageGroup: group,
      male: counts.male,
      female: counts.female,
      total: counts.total,
      percentage: totalStudents > 0 ? Number(((counts.total / totalStudents) * 100).toFixed(1)) : 0,
    };
  });

  // Cross-matrix: Age x Religion
  const religionsInMatrix = sortedReligions.filter((r) => {
    const counts = religionMap.get(r);
    return counts && counts.total > 0;
  });
  if (religionsInMatrix.length === 0) {
    religionsInMatrix.push('Islam');
  }

  const matrix = AGE_GROUPS.map((ageGroup) => {
    const counts: Record<string, { male: number; female: number; total: number }> = {};
    religionsInMatrix.forEach((rel) => {
      counts[rel] = { male: 0, female: 0, total: 0 };
    });

    let rowTotal = 0;
    students.forEach((s) => {
      const ageInfo = calculateStudentAge(s, referenceDate);
      if (ageInfo.ageGroup === ageGroup) {
        const rel = normalizeReligion(s.religion);
        if (!counts[rel]) {
          counts[rel] = { male: 0, female: 0, total: 0 };
        }
        if (s.gender === 'Laki-laki') {
          counts[rel].male++;
        } else {
          counts[rel].female++;
        }
        counts[rel].total++;
        rowTotal++;
      }
    });

    return {
      ageGroup,
      counts,
      rowTotal,
    };
  });

  return {
    totalStudents,
    maleStudents,
    femaleStudents,
    averageAge: ageCount > 0 ? Number((ageSum / ageCount).toFixed(1)) : 0,
    religionStats,
    ageStats,
    matrix,
    religionsInUse: religionsInMatrix,
  };
};

export interface DemographicsExportOptions {
  students: Student[];
  selectedClass: string;
  selectedReligion: string;
  selectedAgeGroup: string;
  settings: SystemSettings;
  teacher?: Teacher | null;
  headmasterName?: string;
  headmasterNip?: string;
  signerTitle?: string;
  signerName?: string;
  signerNip?: string;
  signatureDate?: string;
  reportType?: 'full' | 'nominal' | 'recap' | 'matrix';
  referenceDate?: Date;
  directPrint?: boolean;
}

/**
 * Generates an Excel file with multiple sheets for Demographics & Nominal List
 */
export const exportDemographicsToExcel = (options: DemographicsExportOptions) => {
  const {
    students,
    selectedClass,
    selectedReligion,
    selectedAgeGroup,
    settings,
    referenceDate = new Date(),
  } = options;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Daftar Nominatif Siswa
  const nominalData = students.map((s, index) => {
    const ageInfo = calculateStudentAge(s, referenceDate);
    const rel = normalizeReligion(s.religion);
    return {
      'No': index + 1,
      'NIS': s.nis || '-',
      'NISN': s.nisn || '-',
      'Nama Siswa': s.name,
      'Kelas': s.classRoom || '-',
      'Jenis Kelamin': s.gender,
      'Tempat Lahir': s.birthPlace || '-',
      'Tanggal Lahir': s.birthDate || '-',
      'Umur (Tahun & Bulan)': ageInfo.formatted,
      'Kelompok Usia': ageInfo.ageGroup,
      'Agama': rel,
      'Nama Orang Tua / No HP': s.parentPhone || '-',
      'Alamat Siswa': s.address || '-',
    };
  });

  const wsNominal = XLSX.utils.json_to_sheet(nominalData);
  wsNominal['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // NIS
    { wch: 15 }, // NISN
    { wch: 28 }, // Nama Siswa
    { wch: 12 }, // Kelas
    { wch: 15 }, // Jenis Kelamin
    { wch: 18 }, // Tempat Lahir
    { wch: 14 }, // Tanggal Lahir
    { wch: 20 }, // Umur
    { wch: 16 }, // Kelompok Usia
    { wch: 18 }, // Agama
    { wch: 22 }, // No HP
    { wch: 35 }, // Alamat
  ];
  XLSX.utils.book_append_sheet(wb, wsNominal, 'Daftar Nominatif Siswa');

  // Sheet 2: Rekapitulasi Statistik Agama & Umur
  const stats = computeDemographicStats(students, referenceDate);

  const religionRecapData = stats.religionStats
    .filter((r) => r.total > 0 || STANDARD_RELIGIONS.includes(r.religion as any))
    .map((r, i) => ({
      'No': i + 1,
      'Agama': r.religion,
      'Laki-laki (L)': r.male,
      'Perempuan (P)': r.female,
      'Total Siswa': r.total,
      'Persentase (%)': `${r.percentage}%`,
    }));

  const wsReligion = XLSX.utils.json_to_sheet(religionRecapData);
  wsReligion['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsReligion, 'Rekap Agama');

  // Sheet 3: Rekap Kelompok Umur
  const ageRecapData = stats.ageStats.map((a, i) => ({
    'No': i + 1,
    'Kelompok Umur': a.ageGroup,
    'Laki-laki (L)': a.male,
    'Perempuan (P)': a.female,
    'Total Siswa': a.total,
    'Persentase (%)': `${a.percentage}%`,
  }));

  const wsAge = XLSX.utils.json_to_sheet(ageRecapData);
  wsAge['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAge, 'Rekap Umur');

  // Sheet 4: Matriks Silang Umur x Agama
  const matrixData = stats.matrix.map((row, i) => {
    const item: Record<string, string | number> = {
      'No': i + 1,
      'Kelompok Usia': row.ageGroup,
    };
    stats.religionsInUse.forEach((rel) => {
      const c = row.counts[rel] || { total: 0 };
      item[rel] = c.total;
    });
    item['Total Siswa'] = row.rowTotal;
    return item;
  });

  const wsMatrix = XLSX.utils.json_to_sheet(matrixData);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriks Umur x Agama');

  const safeSchool = settings.schoolName.replace(/[\s\/\\]+/g, '_');
  const safeClass = selectedClass.replace(/[\s\/\\]+/g, '_');
  const safeReligion = selectedReligion.replace(/[\s\/\\]+/g, '_');
  const safeAge = selectedAgeGroup.replace(/[\s\/\\]+/g, '_');
  const fileName = `Data_Siswa_Umur_Agama_${safeSchool}_Kelas_${safeClass}_${safeReligion}_${safeAge}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

/**
 * Generates an official PDF report using jsPDF and jsPDF-autotable
 */
export const generateDemographicsPDF = (options: DemographicsExportOptions) => {
  const {
    students,
    selectedClass,
    selectedReligion,
    selectedAgeGroup,
    settings,
    headmasterName = settings.headmasterName,
    headmasterNip = settings.headmasterNip,
    signerTitle = 'Wali Kelas / Pembuat Laporan',
    signerName = '( ........................................ )',
    signerNip = '-',
    signatureDate,
    reportType = 'full',
    referenceDate = new Date(),
    directPrint = false,
  } = options;

  // Use landscape for full nominal table so columns fit cleanly
  const doc = new jsPDF({
    orientation: reportType === 'matrix' || reportType === 'nominal' || reportType === 'full' ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Official Letterhead / Kop Surat
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.schoolName.toUpperCase(), pageWidth / 2, 9, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `DATA DAN REKAPITULASI SISWA BERDASARKAN UMUR DAN AGAMA - TAHUN AJARAN ${settings.academicYear}`,
    pageWidth / 2,
    15,
    { align: 'center' }
  );
  doc.setFontSize(7.5);
  doc.text(
    settings.schoolAddress || 'Alamat Sekolah Resmi',
    pageWidth / 2,
    20,
    { align: 'center' }
  );

  // Metadata Box below header
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  let currentY = 30;
  doc.text(`Kelas / Rombel: ${selectedClass}`, 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Kriteria Agama: ${selectedReligion}  |  Kriteria Usia: ${selectedAgeGroup}`,
    14,
    currentY + 4.5
  );

  const stats = computeDemographicStats(students, referenceDate);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Total Siswa: ${students.length} Siswa (L: ${stats.maleStudents} | P: ${stats.femaleStudents} | Rata-rata Umur: ${stats.averageAge} Thn)`,
    pageWidth - 14,
    currentY,
    { align: 'right' }
  );
  doc.setFont('helvetica', 'normal');
  const printDateStr = signatureDate || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Tanggal Unduh: ${printDateStr}`, pageWidth - 14, currentY + 4.5, { align: 'right' });

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, currentY + 7.5, pageWidth - 14, currentY + 7.5);

  currentY += 11;

  // Render Recap Tables if reportType is 'full' or 'recap'
  if (reportType === 'full' || reportType === 'recap') {
    // 1. Table Rekap Agama
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('I. REKAPITULASI BERDASARKAN AGAMA', 14, currentY);
    currentY += 2;

    const religionRows = stats.religionStats
      .filter((r) => r.total > 0 || STANDARD_RELIGIONS.includes(r.religion as any))
      .map((r, i) => [
        i + 1,
        r.religion,
        r.male,
        r.female,
        r.total,
        `${r.percentage}%`,
      ]);

    // Total Row
    religionRows.push([
      '',
      'TOTAL KESELURUHAN',
      stats.maleStudents,
      stats.femaleStudents,
      stats.totalStudents,
      '100%',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Agama', 'Laki-laki (L)', 'Perempuan (P)', 'Jumlah Total', 'Persentase']],
      body: religionRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [45, 55, 72], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 45, halign: 'left' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 25, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.row.index === religionRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;

    // 2. Table Rekap Kelompok Umur
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('II. REKAPITULASI BERDASARKAN KELOMPOK UMUR', 14, currentY);
    currentY += 2;

    const ageRows = stats.ageStats.map((a, i) => [
      i + 1,
      a.ageGroup,
      a.male,
      a.female,
      a.total,
      `${a.percentage}%`,
    ]);
    ageRows.push([
      '',
      'TOTAL KESELURUHAN',
      stats.maleStudents,
      stats.femaleStudents,
      stats.totalStudents,
      '100%',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kelompok Usia', 'Laki-laki (L)', 'Perempuan (P)', 'Jumlah Total', 'Persentase']],
      body: ageRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 45, halign: 'left' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 25, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.row.index === ageRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Render Matrix if reportType is 'matrix'
  if (reportType === 'matrix') {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('MATRIKS SILANG JUMLAH SISWA: KELOMPOK UMUR × AGAMA', 14, currentY);
    currentY += 2;

    const matrixHeaders = ['No', 'Kelompok Usia', ...stats.religionsInUse, 'Total Siswa'];
    const matrixRows = stats.matrix.map((row, i) => {
      const rCols: any[] = [i + 1, row.ageGroup];
      stats.religionsInUse.forEach((rel) => {
        rCols.push(row.counts[rel]?.total || 0);
      });
      rCols.push(row.rowTotal);
      return rCols;
    });

    // Total Row
    const totalRowCols: any[] = ['', 'TOTAL'];
    stats.religionsInUse.forEach((rel) => {
      const relTotal = stats.matrix.reduce((sum, r) => sum + (r.counts[rel]?.total || 0), 0);
      totalRowCols.push(relTotal);
    });
    totalRowCols.push(stats.totalStudents);
    matrixRows.push(totalRowCols);

    autoTable(doc, {
      startY: currentY,
      head: [matrixHeaders],
      body: matrixRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59], halign: 'center' },
      headStyles: { fillColor: [45, 55, 72], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35, halign: 'left' },
      },
      didParseCell: (data) => {
        if (data.row.index === matrixRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Render Nominal Table if reportType is 'full' or 'nominal'
  if (reportType === 'full' || reportType === 'nominal') {
    // If full report and not enough space on page, start nominal table on new page
    if (reportType === 'full') {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(
      reportType === 'full' 
        ? 'III. DAFTAR NOMINATIF SISWA LENGKAP' 
        : 'DAFTAR NOMINATIF SISWA BERDASARKAN UMUR & AGAMA', 
      14, 
      currentY
    );
    currentY += 2;

    const nominalRows = students.map((s, index) => {
      const ageInfo = calculateStudentAge(s, referenceDate);
      const rel = normalizeReligion(s.religion);
      return [
        index + 1,
        s.nis || '-',
        s.nisn || '-',
        s.name,
        s.classRoom || '-',
        s.gender === 'Laki-laki' ? 'L' : 'P',
        s.birthPlace || '-',
        s.birthDate || '-',
        ageInfo.formatted,
        rel,
        s.parentPhone || '-',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        ['No', 'NIS', 'NISN', 'Nama Siswa', 'Kelas', 'L/P', 'Tempat Lahir', 'Tgl Lahir', 'Umur', 'Agama', 'Kontak Ortu'],
      ],
      body: nominalRows,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.4, textColor: [30, 41, 59] },
      headStyles: { fillColor: [45, 55, 72], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 48, halign: 'left' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 10, halign: 'center' },
        6: { cellWidth: 26, halign: 'left' },
        7: { cellWidth: 20, halign: 'center' },
        8: { cellWidth: 24, halign: 'center' },
        9: { cellWidth: 26, halign: 'center' },
        10: { cellWidth: 28, halign: 'left' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Signature Block
  let sigY = currentY + 6;
  if (sigY + 45 > pageHeight) {
    doc.addPage();
    sigY = 20;
  }

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const city = settings.schoolCity || 'Parigi Moutong';
  const locationDateStr = `${city}, ${printDateStr}`;

  // Left column: Pembuat Laporan (Wali Kelas / Guru Mapel / Admin)
  const leftX = 25;
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui / Memeriksa,', leftX, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(signerTitle, leftX, sigY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text(signerName, leftX, sigY + 28);
  const signerWidth = Math.max(doc.getTextWidth(signerName), 45);
  doc.setLineWidth(0.35);
  doc.line(leftX, sigY + 29, leftX + signerWidth, sigY + 29);

  doc.setFont('helvetica', 'normal');
  doc.text(formatCleanNIP(signerNip), leftX, sigY + 34);

  // Right column: Kepala Sekolah
  const rightX = pageWidth - 85;
  doc.setFont('helvetica', 'normal');
  doc.text(locationDateStr, rightX, sigY);
  doc.text('Mengetahui,', rightX, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Sekolah', rightX, sigY + 9);

  const hName = headmasterName || '( ........................................ )';
  doc.setFont('helvetica', 'bold');
  doc.text(hName, rightX, sigY + 28);
  const headWidth = Math.max(doc.getTextWidth(hName), 45);
  doc.line(rightX, sigY + 29, rightX + headWidth, sigY + 29);

  doc.setFont('helvetica', 'normal');
  doc.text(formatCleanNIP(headmasterNip), rightX, sigY + 34);

  // Output action
  const safeSchool = settings.schoolName.replace(/[\s\/\\]+/g, '_');
  const safeClass = selectedClass.replace(/[\s\/\\]+/g, '_');
  const fileName = `Laporan_Data_Siswa_Umur_Agama_${safeSchool}_Kelas_${safeClass}.pdf`;

  if (directPrint) {
    doc.autoPrint();
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob, '_blank');
  } else {
    doc.save(fileName);
  }
};
