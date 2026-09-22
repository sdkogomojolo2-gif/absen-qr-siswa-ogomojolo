import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, SystemSettings } from '../types';
import { formatCleanNIP } from './classUtils';

export interface PDFReportOptions {
  records: AttendanceRecord[];
  dateRangeLabel: string;
  selectedClass: string;
  settings: SystemSettings;
  stats: {
    totalStudents: number;
    hadir: number;
    terlambat: number;
    izinSakit: number;
    alpa: number;
  };
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
  directPrint?: boolean;
  filterSummary?: string;
}

export const generateAttendancePDFReport = ({
  records,
  dateRangeLabel,
  selectedClass,
  settings,
  stats,
  homeroomTeacher,
  headmaster,
  signatureDate,
  directPrint = false,
  filterSummary,
}: PDFReportOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header / Kop Surat
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.schoolName.toUpperCase(), pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `LAPORAN REKAPITULASI PRESENSI SISWA - TAHUN AJARAN ${settings.academicYear}`,
    pageWidth / 2,
    16,
    { align: 'center' }
  );

  // Metadata Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  let startY = 32;
  doc.text(`Periode Laporan: ${dateRangeLabel}`, 14, startY);
  doc.text(`Kelas Filter: ${selectedClass}`, 14, startY + 5);
  doc.text(
    `Jam Masuk: ${settings.lateCutoffTime} WIB${filterSummary ? ` | ${filterSummary}` : ''}`,
    14,
    startY + 10
  );

  // Dynamic statistics from the actual exported records to prevent discrepancies
  const recHadir = records.filter((r) => r.status === 'Hadir').length;
  const recTerlambat = records.filter((r) => r.status === 'Terlambat').length;
  const recIzin = records.filter((r) => r.status === 'Izin').length;
  const recSakit = records.filter((r) => r.status === 'Sakit').length;
  const recAlpa = records.filter((r) => r.status === 'Alpa').length;
  const recIzinSakit = recIzin + recSakit;

  // Stats Box on the right
  const rightX = pageWidth - 14;
  doc.setFontSize(9);
  doc.text(
    `Hadir: ${recHadir} | Terlambat: ${recTerlambat} | Izin/Sakit: ${recIzinSakit} | Alpa: ${recAlpa}`,
    rightX,
    startY,
    { align: 'right' }
  );
  doc.text(
    `Total Data Tercetak: ${records.length} Siswa`,
    rightX,
    startY + 5,
    { align: 'right' }
  );

  // Divider Line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(14, startY + 14, pageWidth - 14, startY + 14);

  // Determine if multi-day report
  const uniqueDates = new Set(records.map((r) => r.date));
  const isMultiDay = uniqueDates.size > 1;

  // Table Columns & Rows with Guru Pengabsen
  let tableHeaders: string[][];
  let tableRows: (string | number)[][];

  if (isMultiDay) {
    tableHeaders = [['No', 'Tgl', 'Jam', 'NIS', 'Nama Siswa', 'Kelas', 'Status', 'Guru Pengabsen', 'Metode', 'Keterangan']];
    tableRows = records.map((rec, index) => [
      index + 1,
      rec.date,
      rec.time,
      rec.nis,
      rec.studentName,
      rec.classRoom,
      rec.status,
      (rec as unknown as { teacherDisplay?: string }).teacherDisplay || rec.teacherName || 'Wali Kelas',
      rec.scannedVia || 'QR Camera',
      rec.note || '-',
    ]);
  } else {
    tableHeaders = [['No', 'Jam', 'NIS', 'Nama Siswa', 'Kelas', 'Status', 'Guru Pengabsen', 'Metode', 'Keterangan']];
    tableRows = records.map((rec, index) => [
      index + 1,
      rec.time,
      rec.nis,
      rec.studentName,
      rec.classRoom,
      rec.status,
      (rec as unknown as { teacherDisplay?: string }).teacherDisplay || rec.teacherName || 'Wali Kelas',
      rec.scannedVia || 'QR Camera',
      rec.note || '-',
    ]);
  }

  autoTable(doc, {
    startY: startY + 18,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.0,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: isMultiDay
      ? {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 16, halign: 'center' },
          2: { cellWidth: 13, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 35 },
          5: { cellWidth: 12, halign: 'center' },
          6: { cellWidth: 16, halign: 'center' },
          7: { cellWidth: 30 },
          8: { cellWidth: 16, halign: 'center' },
          9: { cellWidth: 'auto' },
        }
      : {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 40 },
          4: { cellWidth: 14, halign: 'center' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 32 },
          7: { cellWidth: 18, halign: 'center' },
          8: { cellWidth: 'auto' },
        },
    didParseCell: function (data) {
      // Highlight Status column
      const statusColIndex = 6;
      if (data.section === 'body' && data.column.index === statusColIndex) {
        const val = String(data.cell.raw);
        if (val === 'Hadir') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Terlambat') {
          data.cell.styles.textColor = [217, 119, 6]; // Amber
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Alpa') {
          data.cell.styles.textColor = [225, 29, 72]; // Rose
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [79, 70, 229]; // Indigo
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Tanda Tangan / Signature Block at the end
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 120;

  // Check remaining page space for signatures (needs at least 45mm)
  let sigY = finalY + 12;
  if (sigY + 45 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    sigY = 22;
  }

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Date and location label (Right side above Kepala Sekolah)
  const now = new Date();
  const dateFormatted = signatureDate || now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const city = settings.schoolCity || 'Kota';
  const locationDateStr = `${city}, ${dateFormatted}`;

  // Left column: Wali Kelas masing-masing
  const leftX = 20;
  const waliTitle =
    homeroomTeacher?.classLabel ||
    (selectedClass !== 'Semua' ? `Wali Kelas ${selectedClass}` : 'Wali Kelas / Koordinator Presensi');
  const waliName = homeroomTeacher?.name?.trim() || '( ........................................ )';
  const waliNip = formatCleanNIP(homeroomTeacher?.nip);

  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', leftX, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(waliTitle, leftX, sigY + 10);

  // Underlined Wali Kelas Name & NIP
  doc.setFont('helvetica', 'bold');
  doc.text(waliName, leftX, sigY + 34);
  const waliTextWidth = Math.max(doc.getTextWidth(waliName), 50);
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.line(leftX, sigY + 35, leftX + waliTextWidth, sigY + 35);

  doc.setFont('helvetica', 'normal');
  doc.text(waliNip, leftX, sigY + 40);

  // Right column: Kepala Sekolah
  const sigRightX = pageWidth - 80;
  const headName =
    headmaster?.name?.trim() || settings.headmasterName?.trim() || '( ........................................ )';
  const headNip = formatCleanNIP(headmaster?.nip || settings.headmasterNip);

  doc.setFont('helvetica', 'normal');
  doc.text(locationDateStr, sigRightX, sigY);
  doc.text('Mengetahui,', sigRightX, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Sekolah', sigRightX, sigY + 10);

  // Underlined Headmaster Name & NIP
  doc.setFont('helvetica', 'bold');
  doc.text(headName, sigRightX, sigY + 34);
  const headTextWidth = Math.max(doc.getTextWidth(headName), 50);
  doc.line(sigRightX, sigY + 35, sigRightX + headTextWidth, sigY + 35);

  doc.setFont('helvetica', 'normal');
  doc.text(headNip, sigRightX, sigY + 40);

  // Save or Direct Print the PDF
  const safeSchool = settings.schoolName.replace(/[\s\/\\]+/g, '_');
  const safeRange = dateRangeLabel.replace(/[\s\/\\]+/g, '_');
  const safeClass = selectedClass.replace(/[\s\/\\]+/g, '_');
  const filename = `Laporan_Presensi_${safeSchool}_${safeRange}_Kelas_${safeClass}.pdf`;

  if (directPrint) {
    doc.autoPrint();
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob, '_blank');
  } else {
    doc.save(filename);
  }
};

export interface MonthlyStudentRecapItem {
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
  totalHari?: number;
}

export interface MonthlyPDFReportOptions {
  recaps: MonthlyStudentRecapItem[];
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
  directPrint?: boolean;
  subjectInfo?: {
    teacherName?: string;
    teacherNip?: string;
    subjectName?: string;
  };
  reportType?: 'wali_kelas' | 'guru_mapel' | 'admin';
  totalEffectiveDays?: number;
}

/**
 * Generate Monthly Student Attendance Summary PDF Report
 * Columns: No, NIS, Nama Siswa, Kelas, L/P, Hadir (H), Terlambat (T), Sakit (S), Izin (I), Alfa (A), Total Kehadiran, % Hadir
 */
export const generateMonthlyAttendancePDFReport = ({
  recaps,
  monthLabel,
  selectedClass,
  settings,
  homeroomTeacher,
  headmaster,
  signatureDate,
  directPrint = false,
  subjectInfo,
  reportType = 'wali_kelas',
  totalEffectiveDays,
}: MonthlyPDFReportOptions) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header / Kop Surat
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.schoolName.toUpperCase(), pageWidth / 2, 9, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  const mainTitle =
    reportType === 'guru_mapel' && subjectInfo?.subjectName
      ? `LAPORAN REKAPITULASI PRESENSI MAPEL ${subjectInfo.subjectName.toUpperCase()} - TA ${settings.academicYear}`
      : reportType === 'wali_kelas'
      ? `LAPORAN REKAPITULASI PRESENSI KELAS ${selectedClass} (WALI KELAS & MAPEL) - TA ${settings.academicYear}`
      : `LAPORAN REKAPITULASI PRESENSI SISWA - TAHUN AJARAN ${settings.academicYear}`;
  doc.text(mainTitle, pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  const subTitle =
    reportType === 'guru_mapel' && subjectInfo
      ? `Guru Pengampu: ${subjectInfo.teacherName || '-'} | NIP: ${formatCleanNIP(subjectInfo.teacherNip)}`
      : reportType === 'wali_kelas'
      ? `Rekapitulasi Terpadu Kehadiran Kelas ${selectedClass} (Presensi Wali Kelas & Guru Mata Pelajaran)`
      : settings.schoolAddress || 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia';
  doc.text(subTitle, pageWidth / 2, 20, { align: 'center' });

  // Metadata Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');

  const startY = 30;
  doc.text(`Bulan / Periode : ${monthLabel}`, 14, startY);
  doc.text(`Kelas : ${selectedClass === 'Semua' ? 'Semua Kelas' : `Kelas ${selectedClass}`}`, 14, startY + 5);
  const effectiveDaysStr = totalEffectiveDays ? `${totalEffectiveDays} Hari Efektif` : `${recaps[0]?.totalHari || '-'} Hari Efektif`;
  doc.text(`Total Siswa : ${recaps.length} Siswa | ${effectiveDaysStr}`, 14, startY + 10);

  // Totals calculations
  const totalHadir = recaps.reduce((sum, r) => sum + r.hadir, 0);
  const totalTerlambat = recaps.reduce((sum, r) => sum + r.terlambat, 0);
  const totalSakit = recaps.reduce((sum, r) => sum + r.sakit, 0);
  const totalIzin = recaps.reduce((sum, r) => sum + r.izin, 0);
  const totalAlpa = recaps.reduce((sum, r) => sum + r.alpa, 0);

  const rightX = pageWidth - 14;
  doc.setFontSize(9);
  doc.text(
    `Akumulasi Kelas: Hadir: ${totalHadir} | Terlambat: ${totalTerlambat} | Sakit: ${totalSakit} | Izin: ${totalIzin} | Alfa: ${totalAlpa}`,
    rightX,
    startY + 5,
    { align: 'right' }
  );

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, startY + 13, pageWidth - 14, startY + 13);

  // Table Headers
  const tableHeaders = [
    [
      'No',
      'NIS',
      'Nama Lengkap Siswa',
      'Kelas',
      'L/P',
      'Hadir (H)',
      'Terlambat (T)',
      'Sakit (S)',
      'Izin (I)',
      'Alfa (A)',
      'Total Hadir',
      '% Kehadiran',
    ],
  ];

  const tableRows: (string | number)[][] = recaps.map((r, index) => [
    index + 1,
    r.nis,
    r.name,
    r.classRoom,
    r.gender === 'Perempuan' ? 'P' : 'L',
    `${r.hadir} hr`,
    `${r.terlambat} hr`,
    `${r.sakit} hr`,
    `${r.izin} hr`,
    `${r.alpa} hr`,
    `${r.totalHadir} hr`,
    `${r.percentage}%`,
  ]);

  const avgPercentage =
    recaps.length > 0
      ? Math.round(recaps.reduce((sum, r) => sum + r.percentage, 0) / recaps.length)
      : 0;

  // Append Total Row
  tableRows.push([
    '',
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    `${totalHadir} hr`,
    `${totalTerlambat} hr`,
    `${totalSakit} hr`,
    `${totalIzin} hr`,
    `${totalAlpa} hr`,
    `${totalHadir + totalTerlambat} hr`,
    `${avgPercentage}%`,
  ]);

  autoTable(doc, {
    startY: startY + 16,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 65 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 24, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 20, halign: 'center' },
      9: { cellWidth: 20, halign: 'center' },
      10: { cellWidth: 24, halign: 'center' },
      11: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data) => {
      // Style total row
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        data.cell.styles.textColor = [15, 23, 42];
      }

      // Column highlights for body (except last total row)
      if (data.section === 'body' && data.row.index < tableRows.length - 1) {
        if (data.column.index === 5) {
          data.cell.styles.textColor = [16, 185, 129]; // green
          data.cell.styles.fontStyle = 'bold';
        } else if (data.column.index === 6) {
          data.cell.styles.textColor = [217, 119, 6]; // amber
        } else if (data.column.index === 7 || data.column.index === 8) {
          data.cell.styles.textColor = [79, 70, 229]; // indigo
        } else if (data.column.index === 9) {
          data.cell.styles.textColor = [225, 29, 72]; // red
          data.cell.styles.fontStyle = 'bold';
        } else if (data.column.index === 10) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : startY + 50;
  const pageHeight = doc.internal.pageSize.getHeight();

  let sigY = finalY + 10;
  if (sigY + 45 > pageHeight) {
    doc.addPage();
    sigY = 20;
  }

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  const now = new Date();
  const dateFormatted = signatureDate || now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const city = settings.schoolCity || 'Kota';
  const locationDateStr = `${city}, ${dateFormatted}`;

  // Left column: Wali Kelas / Guru Mapel
  const leftX = 25;
  const signerTitle =
    reportType === 'guru_mapel' && subjectInfo
      ? `Guru Mapel ${subjectInfo.subjectName || ''}`
      : homeroomTeacher?.classLabel ||
        (selectedClass !== 'Semua' ? `Wali Kelas ${selectedClass}` : 'Wali Kelas / Koordinator Presensi');
  const signerName =
    reportType === 'guru_mapel' && subjectInfo
      ? subjectInfo.teacherName || '( ........................................ )'
      : homeroomTeacher?.name?.trim() || '( ........................................ )';
  const signerNip =
    reportType === 'guru_mapel' && subjectInfo
      ? formatCleanNIP(subjectInfo.teacherNip)
      : formatCleanNIP(homeroomTeacher?.nip);

  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', leftX, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(signerTitle, leftX, sigY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text(signerName, leftX, sigY + 30);
  const signerTextWidth = Math.max(doc.getTextWidth(signerName), 50);
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.line(leftX, sigY + 31, leftX + signerTextWidth, sigY + 31);

  doc.setFont('helvetica', 'normal');
  doc.text(signerNip, leftX, sigY + 36);

  // Right column: Kepala Sekolah
  const sigRightX = pageWidth - 90;
  const headName =
    headmaster?.name?.trim() || settings.headmasterName?.trim() || '( ........................................ )';
  const headNip = formatCleanNIP(headmaster?.nip || settings.headmasterNip);

  doc.setFont('helvetica', 'normal');
  doc.text(locationDateStr, sigRightX, sigY);
  doc.text('Mengetahui,', sigRightX, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Sekolah', sigRightX, sigY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text(headName, sigRightX, sigY + 30);
  const headTextWidth = Math.max(doc.getTextWidth(headName), 50);
  doc.line(sigRightX, sigY + 31, sigRightX + headTextWidth, sigY + 31);

  doc.setFont('helvetica', 'normal');
  doc.text(headNip, sigRightX, sigY + 36);

  const safeSchool = settings.schoolName.replace(/[\s\/\\]+/g, '_');
  const safeMonth = monthLabel.replace(/[\s\/\\]+/g, '_');
  const safeClass = selectedClass.replace(/[\s\/\\]+/g, '_');
  const filename = `Rekapitulasi_Bulanan_${safeSchool}_${safeMonth}_Kelas_${safeClass}.pdf`;

  if (directPrint) {
    doc.autoPrint();
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob, '_blank');
  } else {
    doc.save(filename);
  }
};
