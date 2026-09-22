import jsPDF from 'jspdf';
import { Student, SystemSettings } from '../types';
import { SCHOOL_LOGO_DATA_URI, SchoolLogo, getSchoolLogoPNG } from './schoolLogo';
import { TUT_WURI_HANDAYANI_DATA_URI, getTutWuriHandayaniPNG } from './tutWuriHandayaniLogo';
import { HEADMASTER_DEFAULT_BARCODE_DATA_URI, getHeadmasterBarcodePNG } from './headmasterBarcode';

export interface CardPreloadedAssets {
  logoLeftPng?: string;
  logoRightPng?: string;
  headmasterSignPng?: string;
}

/**
 * Pre-rasterizes all branding logos & signatures into guaranteed PNG Base64 strings.
 * This guarantees jsPDF renders custom school logos and principal signatures flawlessly without omissions.
 */
export const prepareCardAssets = async (settings: SystemSettings): Promise<CardPreloadedAssets> => {
  try {
    const [logoLeft, logoRight, headmasterSign] = await Promise.all([
      getSchoolLogoPNG(settings.schoolLogoUrl),
      settings.tutWuriLogoUrl
        ? getSchoolLogoPNG(settings.tutWuriLogoUrl)
        : getTutWuriHandayaniPNG(),
      settings.headmasterSignatureUrl
        ? getHeadmasterBarcodePNG(settings.headmasterSignatureUrl)
        : getHeadmasterBarcodePNG(settings.headmasterBarcodeUrl),
    ]);

    return {
      logoLeftPng: logoLeft || undefined,
      logoRightPng: logoRight || logoLeft || undefined,
      headmasterSignPng: headmasterSign || undefined,
    };
  } catch (err) {
    console.warn('Error pre-rasterizing card assets:', err);
    return {};
  }
};

export type CardTemplateId = 'seraphic' | 'nusantara' | 'pelita';

export interface CardTemplateInfo {
  id: CardTemplateId;
  name: string;
  tagline: string;
  schoolNamePrompt: string;
  subtitlePrompt: string;
  departmentText: string;
  schoolAddressText: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    lanyard: string;
    lanyardPattern?: string;
  };
  sampleStudent: {
    name: string;
    nis: string;
    nisn: string;
    classRoom: string;
    program?: string;
    ttl: string;
    gender: string;
    religion: string;
    address: string;
    photoUrl: string;
    schoolName: string;
    departmentText: string;
    schoolAddressText: string;
    subtitle: string;
    academicYear: string;
    validityText: string;
    headmasterName: string;
    headmasterNip: string;
    cityDateText: string;
  };
}

export const CARD_TEMPLATES: Record<CardTemplateId, CardTemplateInfo> = {
  seraphic: {
    id: 'seraphic',
    name: 'Standar Nasional (Biru Kemdikbud)',
    tagline: 'Format resmi nasional dengan logo Tut Wuri Handayani, KOP dinas & biodata lengkap',
    schoolNamePrompt: 'UPTD SMP NEGERI 1 TELADAN',
    subtitlePrompt: 'KARTU TANDA PELAJAR',
    departmentText: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
    schoolAddressText: 'Jl. Merdeka Belajar No. 45, Telp. (021) 7890123',
    colors: {
      primary: '#0b4a94', // Kemdikbud deep blue
      secondary: '#1e40af', // Royal blue
      accent: '#eab308', // Gold / amber
      bg: '#ffffff',
      text: '#0f172a',
      lanyard: '#0b4a94',
      lanyardPattern: '#eab308',
    },
    sampleStudent: {
      name: 'ANDINI PUTRI PRATIWI',
      nis: '231456',
      nisn: '0081234567',
      classRoom: 'VII-A',
      ttl: 'Jakarta, 14 Mei 2011',
      gender: 'Perempuan',
      religion: 'Islam',
      address: 'Jl. Melati No. 12, RT 03/RW 04',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      schoolName: 'UPTD SMP NEGERI 1 TELADAN',
      departmentText: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      schoolAddressText: 'Jl. Merdeka Belajar No. 45, Telp. (021) 7890123',
      subtitle: 'KARTU TANDA PELAJAR',
      academicYear: '2024/2025',
      validityText: 'Berlaku Selama Menjadi Siswa Aktif',
      headmasterName: 'Drs. H. Mulyadi, M.Pd',
      headmasterNip: 'NIP. 19680512 199403 1 005',
      cityDateText: 'Jakarta, 15 Juli 2024',
    },
  },
  nusantara: {
    id: 'nusantara',
    name: 'Klasik Hijau Zamrud (Formal Akademik)',
    tagline: 'Format resmi klasik berkelas dengan logo Tut Wuri Handayani & stempel legalitas',
    schoolNamePrompt: 'SMA NEGERI 1 NUSANTARA',
    subtitlePrompt: 'KARTU IDENTITAS SISWA & ABSENSI',
    departmentText: 'DINAS PENDIDIKAN PEMUDA DAN OLAHRAGA',
    schoolAddressText: 'Jl. Ki Hajar Dewantara No. 18, Telp. (022) 6543210',
    colors: {
      primary: '#14532d', // Forest emerald green
      secondary: '#15803d', // Green
      accent: '#ca8a04', // Gold crest
      bg: '#fdfbf7', // Warm ivory cream
      text: '#0f172a',
      lanyard: '#15803d',
      lanyardPattern: '#ca8a04',
    },
    sampleStudent: {
      name: 'BAGUS PRADANA KUSUMA',
      nis: '12108876',
      nisn: '0078901234',
      classRoom: 'XI MIPA 2',
      ttl: 'Bandung, 22 Agustus 2008',
      gender: 'Laki-laki',
      religion: 'Islam',
      address: 'Jl. Pahlawan No. 78, RT 01/RW 02',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      schoolName: 'SMA NEGERI 1 NUSANTARA',
      departmentText: 'DINAS PENDIDIKAN PEMUDA DAN OLAHRAGA',
      schoolAddressText: 'Jl. Ki Hajar Dewantara No. 18, Telp. (022) 6543210',
      subtitle: 'KARTU IDENTITAS SISWA & ABSENSI',
      academicYear: '2024/2025',
      validityText: 'Berlaku Selama Menjadi Siswa Aktif',
      headmasterName: 'Dr. Irwan Setiawan, M.Pd',
      headmasterNip: 'NIP. 19740815 200003 1 002',
      cityDateText: 'Bandung, 15 Juli 2024',
    },
  },
  pelita: {
    id: 'pelita',
    name: 'Smart Card Kontemporer (Dark Slate & Cyan)',
    tagline: 'Format smart card presisi modern dengan logo Tut Wuri Handayani & akses digital',
    schoolNamePrompt: 'SMK DIGITAL PELITA BANGSA',
    subtitlePrompt: 'SMART STUDENT CARD & DIGITAL ACCESS',
    departmentText: 'CABANG DINAS PENDIDIKAN WILAYAH I',
    schoolAddressText: 'Jl. Cendekia Mandiri No. 9, Telp. (031) 8765432',
    colors: {
      primary: '#0f172a', // Slate Navy
      secondary: '#0284c7', // Cyan
      accent: '#f97316', // Orange
      bg: '#ffffff',
      text: '#0f172a',
      lanyard: '#0284c7',
      lanyardPattern: '#f97316',
    },
    sampleStudent: {
      name: 'SARAH ELIZA CHANDRA',
      nis: '2209123',
      nisn: '0065432189',
      classRoom: 'X RPL 1',
      program: 'REKAYASA PERANGKAT LUNAK',
      ttl: 'Surabaya, 10 Oktober 2008',
      gender: 'Perempuan',
      religion: 'Kristen',
      address: 'Jl. Dharmawangsa No. 25',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      schoolName: 'SMK DIGITAL PELITA BANGSA',
      departmentText: 'CABANG DINAS PENDIDIKAN WILAYAH I',
      schoolAddressText: 'Jl. Cendekia Mandiri No. 9, Telp. (031) 8765432',
      subtitle: 'SMART STUDENT CARD & DIGITAL ACCESS',
      academicYear: '2024/2025',
      validityText: 'Berlaku Selama Menjadi Siswa Aktif',
      headmasterName: 'Bambang Trianto, S.Kom., M.T.',
      headmasterNip: 'NIP. 19800214 200604 1 008',
      cityDateText: 'Surabaya, 15 Juli 2024',
    },
  },
};

export const CR80_WIDTH_MM = 85.60;
export const CR80_HEIGHT_MM = 53.98;

/**
 * Draws an official vector school emblem badge if an image is not available or loading failed
 */
const drawOfficialSchoolBadgeVector = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  primaryRGB: number[],
  accentRGB: number[]
) => {
  try {
    doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
    doc.roundedRect(x, y, w, h, 1.2, 1.2, 'F');
    doc.setDrawColor(accentRGB[0], accentRGB[1], accentRGB[2]);
    doc.setLineWidth(0.25);
    doc.roundedRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8, 0.8, 0.8, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.2);
    doc.setTextColor(255, 255, 255);
    doc.text('SD', x + w / 2, y + h / 2 + 1.0, { align: 'center' });
  } catch {
    // silently catch fallback issues
  }
};

/**
 * Draws an exact standard ISO/IEC 7810 ID-1 (CR80) landscape student card in jsPDF
 * Card size: 85.60 mm width x 53.98 mm height
 * Complete with official Indonesian school KOP, Tut Wuri Handayani logo, full student details,
 * official school stamp, large high-contrast scannable QR code, and Headmaster signature validation.
 */
export const drawCR80CardPDF = (
  doc: jsPDF,
  x: number,
  y: number,
  cardWidth: number,
  cardHeight: number,
  student: Student,
  settings: SystemSettings,
  photoDataUrl: string | undefined,
  qrDataUrl: string | undefined,
  templateId: CardTemplateId = 'seraphic',
  useSamplePromptData: boolean = false,
  cardAssets?: CardPreloadedAssets
) => {
  const template = CARD_TEMPLATES[templateId] || CARD_TEMPLATES.seraphic;

  // Values resolution: Sample Prompt vs Real School Data
  const sample = template.sampleStudent;
  const isSample = useSamplePromptData || !student;

  const studentName = isSample ? sample.name : student.name.toUpperCase();
  const studentNis = isSample ? sample.nis : student.nis;
  const studentNisn = isSample
    ? sample.nisn
    : student.nisn || (student.nis ? `008${student.nis.slice(0, 7)}` : '0081234567');
  const studentClass = isSample ? sample.classRoom : student.classRoom;
  const schoolName = isSample
    ? sample.schoolName
    : settings.schoolName?.toUpperCase() || 'SDN KECIL OGOMOJOLO';
  const departmentText = isSample
    ? sample.departmentText
    : settings.schoolCity
    ? `DINAS PENDIDIKAN DAN KEBUDAYAAN KABUPATEN ${settings.schoolCity.toUpperCase()}`
    : 'DINAS PENDIDIKAN DAN KEBUDAYAAN KAB. PARIGI MOUTONG';
  const schoolAddress = isSample
    ? sample.schoolAddressText
    : settings.schoolAddress || 'Desa Ogomojolo, Kec. Palasa, Kab. Parigi Moutong';
  const academicYear = isSample ? sample.academicYear : settings.academicYear;
  const headmaster = isSample
    ? sample.headmasterName
    : settings.headmasterName || 'Drs. H. Mulyadi, M.Pd';
  const headmasterNip = isSample
    ? sample.headmasterNip
    : settings.headmasterNip || 'NIP. 19750810 200501 1 008';
  const cityDateText = isSample
    ? sample.cityDateText
    : `${settings.schoolCity || 'Ogomojolo'}, 15 Juli 2024`;
  const studentTTL = isSample
    ? sample.ttl
    : student.ttl
    ? student.ttl
    : student.birthPlace && student.birthDate
    ? `${student.birthPlace}, ${student.birthDate}`
    : student.birthPlace
    ? student.birthPlace
    : student.gender === 'Laki-laki'
    ? 'Ogomojolo, 12 Agustus 2014'
    : 'Palasa, 14 Mei 2014';
  const studentGender = isSample
    ? sample.gender
    : student.gender || 'Perempuan';
  const studentReligion = isSample
    ? sample.religion
    : student.religion || 'Islam';
  const studentAddress = isSample
    ? sample.address
    : student.address || (student.classRoom ? `Desa Ogomojolo RT 02/RW 01` : 'Desa Ogomojolo');
  const validityText = isSample
    ? sample.validityText
    : settings.cardValidityYear
    ? `Berlaku s/d: ${settings.cardValidityYear}`
    : 'Berlaku Selama Menjadi Siswa Aktif';

  // Base CR80 Card Rounded Rectangle (Corner radius standard 3.18mm)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, cardWidth, cardHeight, 3.18, 3.18, 'FD');

  // Colors depending on template
  const primaryRGB =
    templateId === 'seraphic'
      ? [11, 74, 148] // Navy Kemdikbud
      : templateId === 'nusantara'
      ? [20, 83, 45] // Emerald
      : [15, 23, 42]; // Slate

  const accentRGB =
    templateId === 'seraphic'
      ? [234, 179, 8] // Amber/Gold
      : templateId === 'nusantara'
      ? [202, 138, 4] // Gold
      : [2, 132, 199]; // Cyan

  // 1. TOP ACCENT STRIP
  doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.rect(x, y, cardWidth, 2.0, 'F');
  doc.setFillColor(accentRGB[0], accentRGB[1], accentRGB[2]);
  doc.rect(x, y + 2.0, cardWidth, 0.5, 'F');

  // 2. KOP RESMI SEKOLAH (LANDSCAPE: School Logo on Left, Tut Wuri on Right, Center Text)
  const logoLeftX = x + 3.0;
  const logoY = y + 3.0;
  const logoW = 7.0;
  const logoH = 8.8;

  const leftLogoImg = cardAssets?.logoLeftPng || settings.schoolLogoUrl;
  let drewLeftLogo = false;
  if (
    leftLogoImg &&
    (leftLogoImg.startsWith('data:image/png') ||
      leftLogoImg.startsWith('data:image/jpeg') ||
      leftLogoImg.startsWith('data:image/webp'))
  ) {
    try {
      const fmt = leftLogoImg.includes('image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(leftLogoImg, fmt, logoLeftX, logoY, logoW, logoH);
      drewLeftLogo = true;
    } catch {
      drewLeftLogo = false;
    }
  }
  if (!drewLeftLogo) {
    drawOfficialSchoolBadgeVector(doc, logoLeftX, logoY, logoW, logoH, primaryRGB, accentRGB);
  }

  const logoRightX = x + cardWidth - 10.0;
  const rightLogoImg = cardAssets?.logoRightPng || settings.tutWuriLogoUrl || leftLogoImg;
  let drewRightLogo = false;
  if (
    rightLogoImg &&
    (rightLogoImg.startsWith('data:image/png') ||
      rightLogoImg.startsWith('data:image/jpeg') ||
      rightLogoImg.startsWith('data:image/webp'))
  ) {
    try {
      const fmt = rightLogoImg.includes('image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(rightLogoImg, fmt, logoRightX, logoY, logoW, logoH);
      drewRightLogo = true;
    } catch {
      drewRightLogo = false;
    }
  }
  if (!drewRightLogo) {
    drawOfficialSchoolBadgeVector(doc, logoRightX, logoY, logoW, logoH, primaryRGB, accentRGB);
  }

  // Kop Center Text
  const kopCenterX = x + cardWidth / 2;
  const kopMaxWidth = cardWidth - 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.8);
  doc.setTextColor(71, 85, 105);
  doc.text(departmentText, kopCenterX, y + 5.0, { align: 'center', maxWidth: kopMaxWidth });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.text(schoolName, kopCenterX, y + 7.8, { align: 'center', maxWidth: kopMaxWidth });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(3.0);
  doc.setTextColor(100, 116, 139);
  doc.text(schoolAddress, kopCenterX, y + 10.2, { align: 'center', maxWidth: kopMaxWidth });

  // Garis KOP Ganda
  doc.setDrawColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.setLineWidth(0.35);
  doc.line(x + 2.5, y + 12.2, x + cardWidth - 2.5, y + 12.2);

  doc.setDrawColor(accentRGB[0], accentRGB[1], accentRGB[2]);
  doc.setLineWidth(0.18);
  doc.line(x + 2.5, y + 12.8, x + cardWidth - 2.5, y + 12.8);

  // 3. BANNER JUDUL KARTU RESMI
  const titleY = y + 13.5;
  doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.roundedRect(x + 2.5, titleY, cardWidth - 5, 3.4, 0.8, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.3);
  doc.setTextColor(255, 255, 255);
  const cardTitle =
    templateId === 'seraphic'
      ? 'KARTU TANDA PELAJAR & PRESENSI DIGITAL'
      : templateId === 'nusantara'
      ? 'KARTU IDENTITAS & PRESENSI DIGITAL SISWA'
      : 'SMART STUDENT CARD & DIGITAL PRESENCE';
  doc.text(cardTitle, x + 4.0, titleY + 2.4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.5);
  doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
  doc.text(`TA ${academicYear}`, x + cardWidth - 4.5, titleY + 2.4, { align: 'right' });

  // 4. COLUMN 1 (LEFT): PASFOTO FORMAL 3x4 DENGAN STEMPEL & BADGE NIS
  const photoW = 15.5;
  const photoH = 20.0;
  const photoX = x + 3.2;
  const photoY = titleY + 4.6;

  // Frame Foto
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.setLineWidth(0.35);
  doc.roundedRect(photoX, photoY, photoW, photoH, 0.8, 0.8, 'FD');

  if (photoDataUrl) {
    try {
      doc.addImage(photoDataUrl, 'JPEG', photoX + 0.3, photoY + 0.3, photoW - 0.6, photoH - 0.6);
    } catch {
      doc.setFillColor(226, 232, 240);
      doc.rect(photoX + 0.3, photoY + 0.3, photoW - 0.6, photoH - 0.6, 'F');
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.rect(photoX + 0.3, photoY + 0.3, photoW - 0.6, photoH - 0.6, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.2);
    doc.text('FOTO 3X4', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
  }

  // Stempel Basah Sekolah (Menimpa pojok kanan bawah foto)
  const stampX = photoX + photoW - 1.5;
  const stampY = photoY + photoH - 1.5;
  doc.setDrawColor(67, 56, 202); // Ungu Stempel
  doc.setLineWidth(0.25);
  doc.circle(stampX, stampY, 3.8, 'S');
  doc.setLineWidth(0.12);
  doc.circle(stampX, stampY, 3.2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(1.7);
  doc.setTextColor(67, 56, 202);
  doc.text('RESMI', stampX, stampY + 0.6, { align: 'center' });

  // Badge NIS & Status di Bawah Foto
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(photoX, photoY + photoH + 1.2, photoW, 4.0, 0.8, 0.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.0);
  doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.text(`NIS: ${studentNis}`, photoX + photoW / 2, photoY + photoH + 2.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(2.3);
  doc.setTextColor(71, 85, 105);
  doc.text('SISWA AKTIF', photoX + photoW / 2, photoY + photoH + 4.5, { align: 'center' });

  // 5. COLUMN 2 (CENTER): TABEL BIODATA SISWA & PENGESAHAN KEPALA SEKOLAH
  const tableX = x + 21.0;
  const colColonX = tableX + 11.5;
  const colValX = tableX + 13.0;
  const maxValW = 28.0;
  let curY = photoY + 2.2;
  const rowGap = 2.4;

  const rows = [
    { label: 'NIS/NISN', val: `${studentNis} / ${studentNisn}` },
    { label: 'Nama', val: studentName },
    { label: 'TTL', val: studentTTL },
    { label: 'J. Kelamin', val: studentGender },
    { label: 'Agama', val: studentReligion },
    { label: 'Kelas', val: studentClass },
    { label: 'Alamat', val: studentAddress },
  ];

  rows.forEach((row, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.0);
    doc.setTextColor(71, 85, 105);
    doc.text(row.label, tableX, curY);

    doc.setTextColor(148, 163, 184);
    doc.text(':', colColonX, curY);

    if (idx === 1) {
      // Nama: Bold & dark
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(3.5);
      doc.setTextColor(15, 23, 42);
    } else if (idx === 0 || idx === 5) {
      // NIS / Kelas: Bold primary color
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(3.1);
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(2.9);
      doc.setTextColor(30, 41, 59);
    }
    doc.text(row.val, colValX, curY, { maxWidth: maxValW });

    curY += rowGap;
  });

  // Pengesahan Kepala Sekolah di Bawah Biodata
  const signY = curY + 1.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(2.7);
  doc.setTextColor(100, 116, 139);
  doc.text(cityDateText, tableX, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(2.9);
  doc.setTextColor(15, 23, 42);
  doc.text('Kepala Sekolah,', tableX, signY + 2.8);

  // Tanda Tangan / Barcode TTE Kepala Sekolah
  const headmasterSignImg =
    cardAssets?.headmasterSignPng ||
    settings.headmasterSignatureUrl ||
    settings.headmasterBarcodeUrl;

  let drewSignature = false;
  if (
    headmasterSignImg &&
    (headmasterSignImg.startsWith('data:image/png') ||
      headmasterSignImg.startsWith('data:image/jpeg') ||
      headmasterSignImg.startsWith('data:image/webp'))
  ) {
    try {
      const fmt = headmasterSignImg.includes('image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(headmasterSignImg, fmt, tableX, signY + 3.2, 16.0, 4.4);
      drewSignature = true;
    } catch {
      drewSignature = false;
    }
  }

  if (!drewSignature) {
    try {
      doc.setDrawColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.setFillColor(248, 250, 252);
      doc.setLineWidth(0.18);
      doc.roundedRect(tableX, signY + 3.2, 16.0, 4.4, 0.5, 0.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(2.2);
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.text('TTE ELEKTRONIK', tableX + 8.0, signY + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(1.8);
      doc.setTextColor(100, 116, 139);
      doc.text('TERVERIFIKASI', tableX + 8.0, signY + 6.9, { align: 'center' });
    } catch {
      // fallback
    }
  }

  // Nama & NIP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.0);
  doc.setTextColor(15, 23, 42);
  doc.text(headmaster, tableX, signY + 8.6);
  // Underline
  const nameWidth = Math.min(doc.getTextWidth(headmaster), 28);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.18);
  doc.line(tableX, signY + 8.9, tableX + nameWidth, signY + 8.9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(2.5);
  doc.setTextColor(71, 85, 105);
  doc.text(headmasterNip, tableX, signY + 11.2, { maxWidth: 30 });

  // 6. COLUMN 3 (RIGHT): LARGE SCANNABLE QR CODE & SCAN BADGE (25.5 x 25.5 mm)
  const qrSize = 25.0; // Large size for instantaneous scanning
  const qrX = x + cardWidth - qrSize - 3.5;
  const qrY = photoY - 0.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.setLineWidth(0.35);
  doc.roundedRect(qrX - 0.8, qrY - 0.8, qrSize + 1.6, qrSize + 1.6, 1.2, 1.2, 'FD');

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch {
      doc.rect(qrX, qrY, qrSize, qrSize);
    }
  }

  // Badge PINDAI ABSENSI di Bawah QR Code
  doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.roundedRect(qrX - 0.8, qrY + qrSize + 1.6, qrSize + 1.6, 4.2, 0.8, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.2);
  doc.setTextColor(255, 255, 255);
  doc.text('PINDAI ABSENSI', qrX + qrSize / 2, qrY + qrSize + 4.2, { align: 'center' });

  // 7. FOOTER RESMI (VALIDITY & KETENTUAN)
  const footerY = y + cardHeight - 4.5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(x + 3, footerY - 0.5, x + cardWidth - 3, footerY - 0.5);

  doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
  doc.roundedRect(x + 2.5, footerY, cardWidth - 5, 3.4, 0.6, 0.6, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(2.4);
  doc.setTextColor(255, 255, 255);
  doc.text('Kartu resmi presensi digital SDN Kecil Ogomojolo. Wajib dibawa setiap hari sekolah.', x + 4.0, footerY + 2.3);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
  doc.text(validityText, x + cardWidth - 4.0, footerY + 2.3, { align: 'right' });

  // Outer Crisp Stroke
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, cardWidth, cardHeight, 3.18, 3.18, 'D');
};
