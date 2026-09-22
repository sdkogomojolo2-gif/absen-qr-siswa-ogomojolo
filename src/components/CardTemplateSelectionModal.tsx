import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Student, SystemSettings } from '../types';
import {
  CardTemplateId,
  CARD_TEMPLATES,
  CR80_WIDTH_MM,
  CR80_HEIGHT_MM,
  drawCR80CardPDF,
  prepareCardAssets,
} from '../utils/studentCardTemplates';
import { CR80StudentCard } from './CR80StudentCard';
import { createStudentQRPayload, generateQRCodeDataURL } from '../utils/qr';

interface CardTemplateSelectionModalProps {
  currentDefaultTemplate?: CardTemplateId;
  settings: SystemSettings;
  sampleStudents?: Student[];
  onSaveDefault?: (templateId: CardTemplateId) => void;
  onSaveDefaultTemplate?: (templateId: CardTemplateId) => void;
  onClose: () => void;
}

export const CardTemplateSelectionModal: React.FC<CardTemplateSelectionModalProps> = ({
  currentDefaultTemplate,
  settings,
  sampleStudents = [],
  onSaveDefault,
  onSaveDefaultTemplate,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplateId>(
    currentDefaultTemplate || settings.defaultCardTemplate || 'seraphic'
  );
  const [previewMode, setPreviewMode] = useState<'sample' | 'real'>('sample');
  const [showLanyards, setShowLanyards] = useState<boolean>(true);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  const firstRealStudent = sampleStudents[0] || {
    id: 'demo-1',
    nis: '1001',
    name: 'AHMAD ZAKI FIRDAUS',
    classRoom: 'Kelas 4',
    gender: 'Laki-laki',
    parentPhone: '08123456789',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  };

  // Generate demo QRs
  useEffect(() => {
    const generateDemoQRs = async () => {
      const qrs: Record<string, string> = {};
      const templateKeys: CardTemplateId[] = ['seraphic', 'nusantara', 'pelita'];

      for (const tKey of templateKeys) {
        const tmpl = CARD_TEMPLATES[tKey];
        const payloadText = JSON.stringify({
          app: 'AbsensiSiswaQR',
          nis: previewMode === 'sample' ? tmpl.sampleStudent.nis : firstRealStudent.nis,
          name: previewMode === 'sample' ? tmpl.sampleStudent.name : firstRealStudent.name,
          classRoom: previewMode === 'sample' ? tmpl.sampleStudent.classRoom : firstRealStudent.classRoom,
        });

        const qrColor = tKey === 'pelita' ? '#0f172a' : tKey === 'seraphic' ? '#0b4a94' : '#14532d';
        const url = await generateQRCodeDataURL(payloadText, qrColor);
        qrs[tKey] = url;
      }
      setQrMap(qrs);
    };

    generateDemoQRs();
  }, [previewMode, firstRealStudent]);

  const handleSetDefault = (tId: CardTemplateId) => {
    setSelectedTemplate(tId);
    if (onSaveDefault) {
      onSaveDefault(tId);
    } else if (onSaveDefaultTemplate) {
      onSaveDefaultTemplate(tId);
    }
    setToastMsg(`Template "${CARD_TEMPLATES[tId].name}" berhasil dijadikan Default!`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Export 3 Cards into a single A4 PDF for test printing
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Place 3 landscape cards vertically on A4 (CR80: 85.60 x 53.98 mm)
      const cardW = CR80_WIDTH_MM; // 85.60 mm
      const cardH = CR80_HEIGHT_MM; // 53.98 mm
      const cardX = (210 - cardW) / 2; // 62.2 mm (horizontally centered)
      const templates: CardTemplateId[] = ['seraphic', 'nusantara', 'pelita'];

      // Title on A4 page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('3 CONTOH KARTU PRESENSI SISWA STANDAR CR80 LANDSCAPE (85,60 x 53,98 mm)', 105, 16, {
        align: 'center',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Template Default Aktif: ${CARD_TEMPLATES[selectedTemplate].name} | ${settings.schoolName}`,
        105,
        22,
        { align: 'center' }
      );

      const startY = 32;
      const gapY = 22;

      // Pre-rasterize left logo, right logo, and signature to clean PNG data URLs for jsPDF
      const cardAssets = await prepareCardAssets(settings);

      for (let i = 0; i < templates.length; i++) {
        const tKey = templates[i];
        const cardY = startY + i * (cardH + gapY);

        drawCR80CardPDF(
          doc,
          cardX,
          cardY,
          cardW,
          cardH,
          firstRealStudent,
          settings,
          undefined,
          qrMap[tKey],
          tKey,
          previewMode === 'sample',
          cardAssets
        );

        // Label above each card
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        const label =
          i === 0
            ? 'CONTOH 1: STANDAR NASIONAL (BIRU KEMDIKBUD)'
            : i === 1
            ? 'CONTOH 2: KLASIK HIJAU ZAMRUD'
            : 'CONTOH 3: SMART CARD KONTEMPORER';
        doc.text(label, 105, cardY - 2.5, { align: 'center' });

        if (tKey === selectedTemplate) {
          doc.setTextColor(22, 163, 74);
          doc.setFontSize(7.5);
          doc.text('★ TEMPLATE DEFAULT AKTIF SEKOLAH ★', 105, cardY + cardH + 4, { align: 'center' });
        }
      }

      // Bottom Cutting note
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Gunting mengikuti garis tepi kartu sesuai ukuran standar kartu PVC ISO CR80 Landscape.',
        105,
        286,
        { align: 'center' }
      );

      doc.save(`3_Contoh_Desain_Kartu_CR80_Landscape_${settings.schoolName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Gagal mengekspor PDF contoh kartu.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-7xl w-full flex flex-col shadow-2xl relative my-auto animate-scale-up overflow-hidden max-h-[96vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-850 no-print">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-600/20">
              <i className="fa-solid fa-id-card-clip" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Pilih Template Kartu Siswa & Absensi Standar CR80 Landscape (85,60 × 53,98 mm)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black tracking-wide border border-emerald-300 dark:border-emerald-700">
                  CR80 LANDSCAPE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih salah satu dari 3 desain kartu landscape berikut dengan QR code ekstra besar untuk kemudahan scan absensi di sekolah Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Preview Data */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPreviewMode('sample')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  previewMode === 'sample'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-wand-magic-sparkles mr-1.5" />
                Contoh Desain (Sesuai Prompt)
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('real')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  previewMode === 'real'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-school mr-1.5" />
                Data Siswa Sekolah Ini
              </button>
            </div>

            {/* Toggle Lanyard preview */}
            <button
              type="button"
              onClick={() => setShowLanyards(!showLanyards)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showLanyards
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-600 dark:text-slate-400'
              }`}
              title="Tampilkan / Sembunyikan Gantungan Tali Lanyard"
            >
              <i className="fa-solid fa-ribbon mr-1" />
              Tali {showLanyards ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Tutup"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in no-print">
            <i className="fa-solid fa-circle-check text-sm" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 3 Cards Showcase Canvas */}
        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex-1 overflow-y-auto">
          {/* Print specific stylesheet */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #cards-showcase-printable,
              #cards-showcase-printable * {
                visibility: visible;
              }
              #cards-showcase-printable {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 10mm;
                background: white !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
            }
          `}</style>

          <div
            id="cards-showcase-printable"
            className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 items-start justify-center max-w-7xl mx-auto"
          >
            {/* ======================================================== */}
            {/* 1. KARTU KIRI: SERAPHIC ACADEMY                          */}
            {/* ======================================================== */}
            <div
              className={`flex flex-col items-center bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-md ${
                selectedTemplate === 'seraphic'
                  ? 'border-blue-600 ring-4 ring-blue-500/20 shadow-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Badge & Info Header */}
              <div className="w-full flex items-center justify-between mb-3 no-print">
                <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[11px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                  Desain 1 (Biru Kemdikbud)
                </span>
                {selectedTemplate === 'seraphic' ? (
                  <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    <i className="fa-solid fa-circle-check text-xs" />
                    DEFAULT AKTIF
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Opsi 1</span>
                )}
              </div>

              <div className="text-center mb-4 no-print">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Standar Nasional (Biru Kemdikbud)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Logo Tut Wuri Handayani • KOP Dinas & Biodata Lengkap
                </p>
              </div>

              {/* Render Card 1 */}
              <CR80StudentCard
                templateId="seraphic"
                student={firstRealStudent}
                settings={settings}
                qrUrl={qrMap['seraphic']}
                useSamplePromptData={previewMode === 'sample'}
                showLanyard={showLanyards}
              />

              {/* Action Button: Set As Default */}
              <div className="w-full mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 no-print">
                {selectedTemplate === 'seraphic' ? (
                  <div className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
                    <i className="fa-solid fa-star text-amber-500 text-sm" />
                    <span>Sudah Dijadikan Default</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetDefault('seraphic')}
                    className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-98"
                  >
                    <i className="fa-solid fa-check" />
                    <span>Jadikan Default Cetak</span>
                  </button>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 2. KARTU TENGAH: SMA NUSANTARA 1                        */}
            {/* ======================================================== */}
            <div
              className={`flex flex-col items-center bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-md ${
                selectedTemplate === 'nusantara'
                  ? 'border-emerald-600 ring-4 ring-emerald-500/20 shadow-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Badge & Info Header */}
              <div className="w-full flex items-center justify-between mb-3 no-print">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
                  Desain 2 (Klasik Hijau)
                </span>
                {selectedTemplate === 'nusantara' ? (
                  <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    <i className="fa-solid fa-circle-check text-xs" />
                    DEFAULT AKTIF
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Opsi 2</span>
                )}
              </div>

              <div className="text-center mb-4 no-print">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Klasik Hijau Zamrud
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Logo Tut Wuri Handayani • Stempel Dinas & TTD Kepala Sekolah
                </p>
              </div>

              {/* Render Card 2 */}
              <CR80StudentCard
                templateId="nusantara"
                student={firstRealStudent}
                settings={settings}
                qrUrl={qrMap['nusantara']}
                useSamplePromptData={previewMode === 'sample'}
                showLanyard={showLanyards}
              />

              {/* Action Button: Set As Default */}
              <div className="w-full mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 no-print">
                {selectedTemplate === 'nusantara' ? (
                  <div className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
                    <i className="fa-solid fa-star text-amber-500 text-sm" />
                    <span>Sudah Dijadikan Default</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetDefault('nusantara')}
                    className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
                  >
                    <i className="fa-solid fa-check" />
                    <span>Jadikan Default Cetak</span>
                  </button>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 3. KARTU KANAN: PELITA BANGSA HIGH SCHOOL               */}
            {/* ======================================================== */}
            <div
              className={`flex flex-col items-center bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-md ${
                selectedTemplate === 'pelita'
                  ? 'border-cyan-500 ring-4 ring-cyan-500/20 shadow-cyan-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Badge & Info Header */}
              <div className="w-full flex items-center justify-between mb-3 no-print">
                <span className="px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-300 text-[11px] font-black uppercase tracking-wider border border-cyan-300 dark:border-cyan-800">
                  Desain 3 (Smart Card)
                </span>
                {selectedTemplate === 'pelita' ? (
                  <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    <i className="fa-solid fa-circle-check text-xs" />
                    DEFAULT AKTIF
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Opsi 3</span>
                )}
              </div>

              <div className="text-center mb-4 no-print">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Smart Card Kontemporer
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Logo Tut Wuri Handayani • Dark Slate & Akses Presensi Digital
                </p>
              </div>

              {/* Render Card 3 */}
              <CR80StudentCard
                templateId="pelita"
                student={firstRealStudent}
                settings={settings}
                qrUrl={qrMap['pelita']}
                useSamplePromptData={previewMode === 'sample'}
                showLanyard={showLanyards}
              />

              {/* Action Button: Set As Default */}
              <div className="w-full mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 no-print">
                {selectedTemplate === 'pelita' ? (
                  <div className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
                    <i className="fa-solid fa-star text-amber-500 text-sm" />
                    <span>Sudah Dijadikan Default</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetDefault('pelita')}
                    className="w-full py-2.5 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-all cursor-pointer active:scale-98"
                  >
                    <i className="fa-solid fa-check" />
                    <span>Jadikan Default Cetak</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 no-print">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <i className="fa-solid fa-circle-info text-blue-500" />
            <span>
              Ukuran fisik kartu: <strong>85,60 mm × 53,98 mm</strong> (Standar Kartu ID Pelajar ISO/IEC 7810 ID-1).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <i className={`fa-solid ${isExportingPDF ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`} />
              <span>{isExportingPDF ? 'Menyiapkan PDF...' : 'Unduh PDF 3 Contoh (A4)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <i className="fa-solid fa-print" />
              <span>Cetak Pratinjau Ini</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
