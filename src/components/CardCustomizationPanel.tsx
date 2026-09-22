import React from 'react';
import {
  CardCustomizationOptions,
  CARD_COLORS,
  CARD_THEMES,
  CARD_FONTS,
  CardColorId,
  CardThemeId,
  CardFontId,
} from '../utils/cardCustomization';

interface CardCustomizationPanelProps {
  options: CardCustomizationOptions;
  onChange: (newOptions: CardCustomizationOptions) => void;
}

export const CardCustomizationPanel: React.FC<CardCustomizationPanelProps> = ({
  options,
  onChange,
}) => {
  const handleColorChange = (color: CardColorId) => {
    onChange({ ...options, color });
  };

  const handleThemeChange = (theme: CardThemeId) => {
    onChange({ ...options, theme });
  };

  const handleFontChange = (font: CardFontId) => {
    onChange({ ...options, font });
  };

  return (
    <div className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 no-print space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
            <i className="fa-solid fa-palette"></i>
          </div>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Kustomisasi Desain Kartu (Sebelum Cetak / Unduh)
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Perubahan langsung diterapkan pada pratinjau & hasil PDF
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Tema Desain Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-2xl p-2.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-500 text-xs"></i>
              Tema Desain Kartu:
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold">
              {CARD_THEMES[options.theme]?.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(CARD_THEMES) as CardThemeId[]).map((themeKey) => {
              const th = CARD_THEMES[themeKey];
              const isActive = options.theme === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => handleThemeChange(themeKey)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <i className={`${th.icon} text-[11px] ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}></i>
                  <span className="truncate text-[11px]">{th.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Pilihan Warna Palet */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-2xl p-2.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-droplet text-blue-500 text-xs"></i>
              Skema Warna:
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold">
              {CARD_COLORS[options.color]?.name}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(CARD_COLORS) as CardColorId[]).map((colorKey) => {
              const clr = CARD_COLORS[colorKey];
              const isActive = options.color === colorKey;
              return (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => handleColorChange(colorKey)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-900 dark:border-white text-slate-900 dark:text-white ring-2 ring-indigo-500/30'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                  title={clr.name}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white/40"
                    style={{ backgroundColor: clr.primary }}
                  />
                  <span className="truncate text-[10px]">{clr.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Pilihan Jenis Tulisan (Font) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-2xl p-2.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-font text-amber-500 text-xs"></i>
              Jenis Tulisan (Font):
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold">
              {CARD_FONTS[options.font]?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(CARD_FONTS) as CardFontId[]).map((fontKey) => {
              const fn = CARD_FONTS[fontKey];
              const isActive = options.font === fontKey;
              return (
                <button
                  key={fontKey}
                  type="button"
                  onClick={() => handleFontChange(fontKey)}
                  className={`flex flex-col px-2.5 py-1 rounded-xl text-left transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className={`text-[11px] font-bold truncate ${fn.tailwindClass}`}>
                    {fn.label}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-400 truncate">
                    {fn.sublabel.split('&')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
