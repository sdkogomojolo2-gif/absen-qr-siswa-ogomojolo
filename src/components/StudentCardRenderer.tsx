import React from 'react';
import { Student, SystemSettings } from '../types';
import {
  CardCustomizationOptions,
  CARD_COLORS,
  CARD_FONTS,
} from '../utils/cardCustomization';

interface StudentCardRendererProps {
  student: Student;
  settings: SystemSettings;
  options: CardCustomizationOptions;
  qrUrl?: string;
  photoUrl?: string;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  showCheckbox?: boolean;
}

export const StudentCardRenderer: React.FC<StudentCardRendererProps> = ({
  student,
  settings,
  options,
  qrUrl,
  photoUrl,
  isSelected = true,
  onToggleSelect,
  showCheckbox = false,
}) => {
  const colorDef = CARD_COLORS[options.color] || CARD_COLORS.blue;
  const fontDef = CARD_FONTS[options.font] || CARD_FONTS.sans;
  const theme = options.theme || 'wave';

  const photoSrc = photoUrl || student.photo || student.avatarUrl;

  return (
    <div
      className={`card-item bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-md relative overflow-hidden transition-all select-none ${fontDef.tailwindClass}`}
      style={{ minHeight: '190px' }}
    >
      {/* 1. Theme-Specific Background Accents */}
      {theme === 'wave' && (
        <>
          {/* Top-Left Topographic Wave Accent */}
          <div className="absolute top-0 left-0 w-32 h-28 pointer-events-none z-0 overflow-hidden">
            <svg className="w-full h-full opacity-90" viewBox="0 0 120 100" fill="none">
              <path d="M-10 -10 C30 -5, 60 20, 50 65 C45 85, 20 95, -10 100 Z" fill={colorDef.primary} />
              <path d="M-10 -10 C20 0, 45 15, 38 50 C32 70, 10 80, -10 85 Z" fill={colorDef.secondary} />
              <path d="M-10 -10 C10 5, 25 12, 22 35 C18 50, 0 60, -10 65 Z" fill={colorDef.light} />
              <path d="M-5 25 C15 35, 45 30, 65 15" stroke={colorDef.light} strokeWidth="1" fill="none" opacity="0.6" />
              <path d="M-5 45 C20 55, 55 45, 75 25" stroke={colorDef.light} strokeWidth="1" fill="none" opacity="0.5" />
            </svg>
          </div>

          {/* Top-Right Topographic Wave Accent */}
          <div className="absolute top-0 right-0 w-32 h-28 pointer-events-none z-0 overflow-hidden">
            <svg className="w-full h-full opacity-90" viewBox="0 0 120 100" fill="none">
              <path d="M130 -10 C90 -5, 60 20, 70 65 C75 85, 100 95, 130 100 Z" fill={colorDef.primary} />
              <path d="M130 -10 C100 0, 75 15, 82 50 C88 70, 110 80, 130 85 Z" fill={colorDef.secondary} />
              <path d="M130 -10 C110 5, 95 12, 98 35 C102 50, 120 60, 130 65 Z" fill={colorDef.light} />
              <path d="M125 25 C105 35, 75 30, 55 15" stroke={colorDef.light} strokeWidth="1" fill="none" opacity="0.6" />
            </svg>
          </div>

          {/* Bottom-Left Wave Accent */}
          <div className="absolute bottom-0 left-0 w-36 h-24 pointer-events-none z-0 overflow-hidden">
            <svg className="w-full h-full opacity-90" viewBox="0 0 140 90" fill="none">
              <path d="M-10 100 C35 95, 65 75, 55 35 C50 15, 20 5, -10 0 Z" fill={colorDef.primary} />
              <path d="M-10 100 C20 90, 45 75, 40 50 C35 30, 10 20, -10 15 Z" fill={colorDef.secondary} />
              <path d="M-5 65 C25 55, 75 60, 105 85" stroke={colorDef.light} strokeWidth="1" fill="none" opacity="0.6" />
            </svg>
          </div>
        </>
      )}

      {theme === 'geometric' && (
        <>
          {/* Top-Left Polygon & Tech Cyber Accent */}
          <div className="absolute top-0 left-0 w-28 h-28 pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <polygon points="0,0 70,0 0,70" fill={colorDef.primary} />
              <polygon points="0,0 45,0 0,45" fill={colorDef.secondary} />
              <polygon points="0,0 20,0 0,20" fill={colorDef.light} />
              <circle cx="78" cy="12" r="3" fill={colorDef.secondary} />
              <circle cx="90" cy="12" r="2" fill={colorDef.light} />
            </svg>
          </div>

          {/* Top-Right Polygon */}
          <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <polygon points="100,0 30,0 100,70" fill={colorDef.primary} />
              <polygon points="100,0 55,0 100,45" fill={colorDef.secondary} />
              <polygon points="100,0 80,0 100,20" fill={colorDef.light} />
            </svg>
          </div>

          {/* Bottom Modern Tech Bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2 pointer-events-none z-0"
            style={{ backgroundColor: colorDef.primary }}
          />
          <div
            className="absolute bottom-2 left-6 right-6 h-0.5 pointer-events-none z-0"
            style={{ backgroundColor: colorDef.secondary }}
          />
        </>
      )}

      {theme === 'classic' && (
        <>
          {/* Dual Ornamental Borders */}
          <div
            className="absolute inset-1.5 rounded-2xl border-2 pointer-events-none z-0"
            style={{ borderColor: colorDef.primary }}
          />
          <div
            className="absolute inset-2.5 rounded-xl border pointer-events-none z-0"
            style={{ borderColor: colorDef.light }}
          />

          {/* Gold / Royal Ribbon Bar Top */}
          <div className="absolute top-1 left-12 right-12 flex items-center justify-center pointer-events-none z-0">
            <div
              className="h-1.5 w-full rounded-full"
              style={{ backgroundColor: colorDef.primary }}
            />
          </div>

          {/* Gold / Royal Ribbon Bar Bottom */}
          <div className="absolute bottom-1.5 left-12 right-12 flex items-center justify-center pointer-events-none z-0">
            <div
              className="h-1.5 w-full rounded-full"
              style={{ backgroundColor: colorDef.primary }}
            />
          </div>
        </>
      )}

      {theme === 'minimalist' && (
        <>
          {/* Vertical Color Pillar on Left */}
          <div
            className="absolute top-0 bottom-0 left-0 w-3 pointer-events-none z-0"
            style={{ backgroundColor: colorDef.primary }}
          />
          <div
            className="absolute top-0 bottom-0 left-3 w-1 pointer-events-none z-0"
            style={{ backgroundColor: colorDef.secondary }}
          />
          {/* Top Thin Divider */}
          <div
            className="absolute top-0 left-6 right-6 h-0.5 pointer-events-none z-0"
            style={{ backgroundColor: colorDef.light }}
          />
        </>
      )}

      {/* Checkbox Selector for toggling on-screen (Non-Printable) */}
      {showCheckbox && onToggleSelect && (
        <button
          type="button"
          onClick={onToggleSelect}
          className="absolute top-2.5 right-2.5 z-30 w-6 h-6 rounded-lg bg-white/95 border border-slate-300 flex items-center justify-center text-xs cursor-pointer shadow-md no-print hover:bg-white transition-transform active:scale-95"
          title={isSelected ? 'Batalkan cetak siswa ini' : 'Pilih siswa ini'}
        >
          {isSelected && (
            <i
              className="fa-solid fa-check font-black"
              style={{ color: colorDef.primary }}
            ></i>
          )}
        </button>
      )}

      {/* Card Body Content (Relative z-10 for layered depth) */}
      <div className={`relative z-10 p-3 sm:p-4 ${theme === 'minimalist' ? 'pl-6 sm:pl-7' : ''}`}>
        {/* Header: School Emblem + Authenticity Seal + School Name + Subtitle */}
        <div className="flex flex-col items-center text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            {/* School Logo Vector */}
            <div
              className="w-7 h-7 flex items-center justify-center"
              style={{ color: colorDef.border }}
            >
              <svg className="w-6 h-6 drop-shadow-xs" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L2 8.5L12 14L20.5 9.3V16H22.5V8.5L12 3ZM5 12.18V16.5C5 19.5 8.13 22 12 22C15.87 22 19 19.5 19 16.5V12.18L12 16L5 12.18Z" />
              </svg>
            </div>

            {/* Authenticity Seal Hologram */}
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-300 via-emerald-400 to-indigo-500 p-0.5 shadow-xs flex items-center justify-center rotate-3">
              <div className="w-full h-full rounded-xs bg-gradient-to-tr from-amber-200/90 via-teal-300/80 to-purple-300/90 flex items-center justify-center">
                <i className="fa-solid fa-certificate text-[9px] text-amber-900/70"></i>
              </div>
            </div>
          </div>

          <h4
            className="font-black text-xs sm:text-sm tracking-wide uppercase max-w-[280px] leading-tight"
            style={{ color: colorDef.border }}
          >
            {settings.schoolName}
          </h4>
          <p className="text-[8px] sm:text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">
            KARTU PRESENSI QR RESMI PELAJAR
          </p>
        </div>

        {/* Card Main Columns (Left Info + Pill, Middle Pasfoto, Right QR) */}
        <div className="flex items-center justify-between gap-2.5 pt-1">
          {/* 1. Student Details Left */}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Nama:</span>
              <h5 className="font-black text-xs sm:text-sm text-slate-950 uppercase tracking-tight leading-tight truncate">
                {student.name}
              </h5>

              <div className="mt-1 space-y-0.5 text-[11px] font-bold text-slate-800">
                <div>
                  <span className="text-slate-500 font-medium">NIS: </span>
                  <span className="font-mono text-slate-900">{student.nis}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Kelas: </span>
                  <span>
                    {student.classRoom} {student.gender === 'Laki-laki' ? 'L' : 'P'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom-left Pill: PINDAI SAAT PRESENSI */}
            <div className="mt-2.5">
              <span
                className="inline-flex items-center px-2.5 py-0.8 rounded-full bg-white border-2 text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs"
                style={{
                  borderColor: colorDef.border,
                  color: colorDef.border,
                }}
              >
                PINDAI SAAT PRESENSI
              </span>
            </div>
          </div>

          {/* 2. Middle: Pasfoto with Themed Border */}
          <div className="shrink-0 flex flex-col items-center">
            <div
              className="p-0.5 rounded-xl border-2 bg-white shadow-xs"
              style={{ borderColor: colorDef.photoBorder }}
            >
              <div
                className="w-14 sm:w-16 h-18 sm:h-20 rounded-lg overflow-hidden border bg-slate-100 flex items-center justify-center relative"
                style={{ borderColor: colorDef.light }}
              >
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={student.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 text-center p-1">
                    <i className="fa-solid fa-user text-xl text-slate-400 mb-0.5"></i>
                    <span className="text-[7.5px] font-bold text-slate-500">FOTO</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">
              PASFOTO
            </span>
          </div>

          {/* 3. Right: QR Code Box + Scan Instruction */}
          <div className="shrink-0 flex flex-col items-center">
            <div
              className="p-1 rounded-xl border-2 bg-white shadow-xs flex items-center justify-center"
              style={{ borderColor: colorDef.photoBorder }}
            >
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR Code ${student.name}`}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-md bg-white p-0.5"
                />
              ) : (
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-md bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                  Memuat QR...
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1 mt-1 text-slate-800">
              <i className="fa-solid fa-mobile-screen-button text-[9px] text-slate-700"></i>
              <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-tight text-slate-800">
                SCAN UNTUK PRESENSI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Cutting Guide Line (Non-Printable) */}
      <div className="border-b-2 border-dashed border-slate-300 relative no-print">
        <span className="absolute right-2 -bottom-2.5 bg-white px-1 text-[8px] text-slate-400 flex items-center gap-0.5">
          <i className="fa-solid fa-scissors"></i> Gunting di sini
        </span>
      </div>
    </div>
  );
};
