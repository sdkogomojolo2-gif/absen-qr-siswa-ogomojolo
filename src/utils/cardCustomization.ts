import jsPDF from 'jspdf';
import { Student } from '../types';

export type CardThemeId = 'wave' | 'geometric' | 'classic' | 'minimalist';
export type CardColorId = 'blue' | 'emerald' | 'ruby' | 'purple' | 'amber' | 'monochrome';
export type CardFontId = 'sans' | 'rounded' | 'serif' | 'mono';

export interface CardCustomizationOptions {
  theme: CardThemeId;
  color: CardColorId;
  font: CardFontId;
}

export interface ColorDef {
  id: CardColorId;
  name: string;
  primary: string;
  primaryRgb: [number, number, number];
  secondary: string;
  secondaryRgb: [number, number, number];
  light: string;
  lightRgb: [number, number, number];
  border: string;
  borderRgb: [number, number, number];
  darkText: string;
  bgBadge: string;
  photoBorder: string;
  dotColor: string;
  bgClass: string;
}

export const CARD_COLORS: Record<CardColorId, ColorDef> = {
  blue: {
    id: 'blue',
    name: 'Biru Samudra',
    primary: '#1e40af',
    primaryRgb: [30, 64, 175],
    secondary: '#2563eb',
    secondaryRgb: [37, 99, 235],
    light: '#93c5fd',
    lightRgb: [147, 197, 253],
    border: '#1e3a8a',
    borderRgb: [30, 58, 138],
    darkText: '#172554',
    bgBadge: '#eff6ff',
    photoBorder: '#38bdf8',
    dotColor: '#2563eb',
    bgClass: 'bg-blue-600',
  },
  emerald: {
    id: 'emerald',
    name: 'Hijau Zamrud',
    primary: '#065f46',
    primaryRgb: [6, 95, 70],
    secondary: '#059669',
    secondaryRgb: [5, 150, 105],
    light: '#6ee7b7',
    lightRgb: [110, 231, 183],
    border: '#064e3b',
    borderRgb: [6, 78, 59],
    darkText: '#022c22',
    bgBadge: '#ecfdf5',
    photoBorder: '#34d399',
    dotColor: '#059669',
    bgClass: 'bg-emerald-600',
  },
  ruby: {
    id: 'ruby',
    name: 'Merah Ruby',
    primary: '#991b1b',
    primaryRgb: [153, 27, 27],
    secondary: '#dc2626',
    secondaryRgb: [220, 38, 38],
    light: '#fca5a5',
    lightRgb: [252, 165, 165],
    border: '#7f1d1d',
    borderRgb: [127, 29, 29],
    darkText: '#450a0a',
    bgBadge: '#fef2f2',
    photoBorder: '#f87171',
    dotColor: '#dc2626',
    bgClass: 'bg-rose-600',
  },
  purple: {
    id: 'purple',
    name: 'Ungu Royal',
    primary: '#5b21b6',
    primaryRgb: [91, 33, 182],
    secondary: '#7c3aed',
    secondaryRgb: [124, 58, 237],
    light: '#c4b5fd',
    lightRgb: [196, 181, 253],
    border: '#4c1d95',
    borderRgb: [76, 29, 149],
    darkText: '#2e1065',
    bgBadge: '#faf5ff',
    photoBorder: '#a78bfa',
    dotColor: '#7c3aed',
    bgClass: 'bg-purple-600',
  },
  amber: {
    id: 'amber',
    name: 'Emas Mewah',
    primary: '#92400e',
    primaryRgb: [146, 64, 14],
    secondary: '#d97706',
    secondaryRgb: [217, 119, 6],
    light: '#fcd34d',
    lightRgb: [252, 211, 77],
    border: '#78350f',
    borderRgb: [120, 53, 15],
    darkText: '#451a03',
    bgBadge: '#fffbeb',
    photoBorder: '#fbbf24',
    dotColor: '#d97706',
    bgClass: 'bg-amber-600',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Hitam Obsidian',
    primary: '#1e293b',
    primaryRgb: [30, 41, 59],
    secondary: '#475569',
    secondaryRgb: [71, 85, 105],
    light: '#cbd5e1',
    lightRgb: [203, 213, 225],
    border: '#0f172a',
    borderRgb: [15, 23, 42],
    darkText: '#020617',
    bgBadge: '#f8fafc',
    photoBorder: '#94a3b8',
    dotColor: '#475569',
    bgClass: 'bg-slate-800',
  },
};

export interface ThemeDef {
  id: CardThemeId;
  name: string;
  desc: string;
  icon: string;
}

export const CARD_THEMES: Record<CardThemeId, ThemeDef> = {
  wave: {
    id: 'wave',
    name: 'Ombak Topografi',
    desc: 'Kurva dinamis & garis kontur modern',
    icon: 'fa-solid fa-water',
  },
  geometric: {
    id: 'geometric',
    name: 'Geometris Tech',
    desc: 'Sudut poligon tajam & aksen futuristik',
    icon: 'fa-solid fa-shapes',
  },
  classic: {
    id: 'classic',
    name: 'Pita Emas Kerajaan',
    desc: 'Bingkai berornamen & medali kehormatan',
    icon: 'fa-solid fa-award',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Modern Minimalis',
    desc: 'Garis strip samping & tampilan eksekutif',
    icon: 'fa-solid fa-bars-staggered',
  },
};

export interface FontDef {
  id: CardFontId;
  label: string;
  sublabel: string;
  tailwindClass: string;
  jsPdfFont: 'helvetica' | 'times' | 'courier';
}

export const CARD_FONTS: Record<CardFontId, FontDef> = {
  sans: {
    id: 'sans',
    label: 'Modern Sans',
    sublabel: 'Tegas, Bersih & Kontras Tinggi',
    tailwindClass: 'font-sans',
    jsPdfFont: 'helvetica',
  },
  rounded: {
    id: 'rounded',
    label: 'Rounded Modern',
    sublabel: 'Ramah, Segar & Dinamis',
    tailwindClass: 'font-sans tracking-tight',
    jsPdfFont: 'helvetica',
  },
  serif: {
    id: 'serif',
    label: 'Klasik Serif',
    sublabel: 'Resmi, Anggun & Berwibawa',
    tailwindClass: 'font-serif',
    jsPdfFont: 'times',
  },
  mono: {
    id: 'mono',
    label: 'Monospace Tech',
    sublabel: 'Presisi, Futuristik & Digital',
    tailwindClass: 'font-mono',
    jsPdfFont: 'courier',
  },
};

/**
 * Draw official customizable student card in jsPDF with strict coordinate bounding
 */
export const drawCustomizedCardPDF = (
  doc: jsPDF,
  x: number,
  y: number,
  cardWidth: number,
  cardHeight: number,
  student: Student,
  schoolName: string,
  photoDataUrl: string | undefined,
  qrDataUrl: string | undefined,
  options: CardCustomizationOptions
) => {
  const colorDef = CARD_COLORS[options.color] || CARD_COLORS.blue;
  const fontDef = CARD_FONTS[options.font] || CARD_FONTS.sans;
  const theme = options.theme || 'wave';

  const [prR, prG, prB] = colorDef.primaryRgb;
  const [scR, scG, scB] = colorDef.secondaryRgb;
  const [ltR, ltG, ltB] = colorDef.lightRgb;
  const [bdR, bdG, bdB] = colorDef.borderRgb;

  // 1. Base Card White Rectangle & Border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, 'FD');

  // 2. Theme Graphic Accents
  if (theme === 'wave') {
    // Wave Corner Shapes
    const cornerW = 20;
    const cornerH = 16;

    // Top-Left Wave Layers
    doc.setFillColor(prR, prG, prB);
    doc.triangle(x, y, x + cornerW, y, x, y + cornerH, 'F');
    doc.setFillColor(scR, scG, scB);
    doc.triangle(x, y, x + cornerW * 0.7, y, x, y + cornerH * 0.7, 'F');
    doc.setFillColor(ltR, ltG, ltB);
    doc.triangle(x, y, x + cornerW * 0.4, y, x, y + cornerH * 0.4, 'F');

    doc.setDrawColor(ltR, ltG, ltB);
    doc.setLineWidth(0.2);
    doc.line(x + 2, y + cornerH, x + cornerW * 1.1, y + 2);
    doc.line(x + 5, y + cornerH * 1.15, x + cornerW * 1.25, y + 4);

    // Top-Right Wave Layers
    doc.setFillColor(prR, prG, prB);
    doc.triangle(x + cardWidth, y, x + cardWidth - cornerW, y, x + cardWidth, y + cornerH, 'F');
    doc.setFillColor(scR, scG, scB);
    doc.triangle(x + cardWidth, y, x + cardWidth - cornerW * 0.7, y, x + cardWidth, y + cornerH * 0.7, 'F');
    doc.setFillColor(ltR, ltG, ltB);
    doc.triangle(x + cardWidth, y, x + cardWidth - cornerW * 0.4, y, x + cardWidth, y + cornerH * 0.4, 'F');

    doc.setDrawColor(ltR, ltG, ltB);
    doc.setLineWidth(0.2);
    doc.line(x + cardWidth - 2, y + cornerH, x + cardWidth - cornerW * 1.1, y + 2);

    // Bottom-Left Wave Layers
    doc.setFillColor(prR, prG, prB);
    doc.triangle(x, y + cardHeight, x + cornerW, y + cardHeight, x, y + cardHeight - cornerH, 'F');
    doc.setFillColor(scR, scG, scB);
    doc.triangle(x, y + cardHeight, x + cornerW * 0.7, y + cardHeight, x, y + cardHeight - cornerH * 0.7, 'F');
    doc.setFillColor(ltR, ltG, ltB);
    doc.triangle(x, y + cardHeight, x + cornerW * 0.4, y + cardHeight, x, y + cardHeight - cornerH * 0.4, 'F');
    doc.setDrawColor(ltR, ltG, ltB);
    doc.line(x + 2, y + cardHeight - cornerH, x + cornerW * 1.1, y + cardHeight - 2);
  } else if (theme === 'geometric') {
    // Sharp Polygon Cuts & Tech Diagonal Lines
    const corner = 18;
    // Top-Left Polygon
    doc.setFillColor(prR, prG, prB);
    doc.triangle(x, y, x + corner, y, x, y + corner, 'F');
    doc.setFillColor(scR, scG, scB);
    doc.rect(x, y, 4, corner + 2, 'F');
    doc.setFillColor(ltR, ltG, ltB);
    doc.circle(x + corner + 3, y + 3, 1, 'F');
    doc.circle(x + corner + 6, y + 3, 0.6, 'F');

    // Top-Right Polygon
    doc.setFillColor(prR, prG, prB);
    doc.triangle(x + cardWidth, y, x + cardWidth - corner, y, x + cardWidth, y + corner, 'F');
    doc.setFillColor(scR, scG, scB);
    doc.rect(x + cardWidth - 4, y, 4, corner + 2, 'F');

    // Bottom Band
    doc.setFillColor(prR, prG, prB);
    doc.rect(x, y + cardHeight - 3, cardWidth, 3, 'F');
    doc.setFillColor(scR, scG, scB);
    doc.rect(x + 10, y + cardHeight - 4, cardWidth - 20, 1, 'F');
  } else if (theme === 'classic') {
    // Royal Classic Border & Corner Medallions
    doc.setDrawColor(prR, prG, prB);
    doc.setLineWidth(0.6);
    doc.roundedRect(x + 2, y + 2, cardWidth - 4, cardHeight - 4, 1.8, 1.8, 'D');

    doc.setDrawColor(ltR, ltG, ltB);
    doc.setLineWidth(0.2);
    doc.roundedRect(x + 2.8, y + 2.8, cardWidth - 5.6, cardHeight - 5.6, 1.4, 1.4, 'D');

    // Top & Bottom Gold Ribbon Bars
    doc.setFillColor(prR, prG, prB);
    doc.rect(x + 16, y + 1.2, cardWidth - 32, 1.6, 'F');
    doc.setFillColor(scR, scG, scB);
    doc.rect(x + 22, y + 1.6, cardWidth - 44, 0.8, 'F');

    doc.setFillColor(prR, prG, prB);
    doc.rect(x + 16, y + cardHeight - 2.8, cardWidth - 32, 1.6, 'F');
  } else if (theme === 'minimalist') {
    // Clean Left Accent Pillar & Subtle Modern Dividers
    doc.setFillColor(prR, prG, prB);
    doc.roundedRect(x, y, 3.5, cardHeight, 1.2, 1.2, 'F');
    doc.setFillColor(scR, scG, scB);
    doc.rect(x + 3.5, y, 1.2, cardHeight, 'F');

    // Top Micro Line
    doc.setFillColor(ltR, ltG, ltB);
    doc.rect(x + 6, y + 1, cardWidth - 12, 0.5, 'F');
  }

  // 3. Header Section (Emblem, Authenticity Seal, School Name, Subtitle)
  const headerCenterY = y + 3;

  // School Logo Vector
  doc.setFillColor(bdR, bdG, bdB);
  doc.triangle(
    x + cardWidth / 2 - 8,
    headerCenterY + 4,
    x + cardWidth / 2 - 5,
    headerCenterY,
    x + cardWidth / 2 - 2,
    headerCenterY + 4,
    'F'
  );
  doc.triangle(
    x + cardWidth / 2 - 5,
    headerCenterY + 4,
    x + cardWidth / 2 - 2,
    headerCenterY + 1,
    x + cardWidth / 2 + 1,
    headerCenterY + 4,
    'F'
  );

  // Authenticity Seal
  doc.setFillColor(234, 179, 8); // Gold
  doc.setDrawColor(202, 138, 4);
  doc.roundedRect(x + cardWidth / 2 + 3, headerCenterY, 4, 4, 0.8, 0.8, 'FD');
  doc.setFillColor(20, 184, 166); // Teal center
  doc.circle(x + cardWidth / 2 + 5, headerCenterY + 2, 1.1, 'F');

  // School Name (Custom Font)
  doc.setTextColor(bdR, bdG, bdB);
  doc.setFontSize(8);
  doc.setFont(fontDef.jsPdfFont, 'bold');
  doc.text(schoolName.toUpperCase(), x + cardWidth / 2, y + 10.5, {
    align: 'center',
    maxWidth: cardWidth - 36,
  });

  // Subtitle
  doc.setFontSize(4.5);
  doc.setFont(fontDef.jsPdfFont, 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('KARTU PRESENSI QR RESMI PELAJAR', x + cardWidth / 2, y + 13.5, {
    align: 'center',
  });

  // 4. Left Column: Student Details & Bottom Pill
  const leftX = x + (theme === 'minimalist' ? 6.5 : 4);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont(fontDef.jsPdfFont, 'normal');
  doc.text('Nama:', leftX, y + 18.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont(fontDef.jsPdfFont, 'bold');
  doc.text(student.name.toUpperCase(), leftX, y + 23, {
    maxWidth: cardWidth * 0.32,
  });

  doc.setFontSize(6);
  doc.setFont(fontDef.jsPdfFont, 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`NIS:  ${student.nis}`, leftX, y + 29.5);
  doc.text(
    `Kelas: ${student.classRoom} ${student.gender === 'Laki-laki' ? 'L' : 'P'}`,
    leftX,
    y + 34.5
  );

  // Bottom-Left Pill Badge
  const pillY = y + cardHeight - 8.5;
  const pillW = 30;
  const pillH = 4.8;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(bdR, bdG, bdB);
  doc.setLineWidth(0.35);
  doc.roundedRect(leftX, pillY, pillW, pillH, pillH / 2, pillH / 2, 'FD');
  doc.setFontSize(4.2);
  doc.setFont(fontDef.jsPdfFont, 'bold');
  doc.setTextColor(bdR, bdG, bdB);
  doc.text('PINDAI SAAT PRESENSI', leftX + pillW / 2, pillY + 3.3, {
    align: 'center',
  });

  // 5. Middle Column: Pasfoto
  const photoW = 18;
  const photoH = 24;
  const photoX = x + cardWidth * 0.39;
  const photoY = y + 16.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(scR, scG, scB);
  doc.setLineWidth(0.35);
  doc.roundedRect(
    photoX - 0.6,
    photoY - 0.6,
    photoW + 1.2,
    photoH + 1.2,
    1.2,
    1.2,
    'FD'
  );

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(ltR, ltG, ltB);
  doc.setLineWidth(0.2);
  doc.roundedRect(photoX, photoY, photoW, photoH, 0.8, 0.8, 'FD');

  const photoSrc = photoDataUrl || student.photo || student.avatarUrl;
  if (photoSrc) {
    try {
      doc.addImage(photoSrc, 'JPEG', photoX, photoY, photoW, photoH);
    } catch {
      // Photo error fallback
    }
  }

  doc.setFontSize(4);
  doc.setFont(fontDef.jsPdfFont, 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PASFOTO', photoX + photoW / 2, photoY + photoH + 3.2, {
    align: 'center',
  });

  // 6. Right Column: High-Contrast QR Code
  const qrSize = 25;
  const qrX = x + cardWidth - qrSize - 4;
  const qrY = y + 16;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(scR, scG, scB);
  doc.setLineWidth(0.35);
  doc.roundedRect(
    qrX - 0.8,
    qrY - 0.8,
    qrSize + 1.6,
    qrSize + 1.6,
    1.5,
    1.5,
    'FD'
  );

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  doc.setFontSize(4);
  doc.setFont(fontDef.jsPdfFont, 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('SCAN UNTUK PRESENSI', qrX + qrSize / 2, qrY + qrSize + 3.6, {
    align: 'center',
  });

  // 7. Outer stroke card border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, 'D');
};
