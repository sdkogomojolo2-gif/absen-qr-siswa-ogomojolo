import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Student, SystemSettings } from '../types';
import { createStudentQRPayload, generateQRCodeDataURL } from '../utils/qr';
import {
  CardTemplateId,
  CARD_TEMPLATES,
  CR80_WIDTH_MM,
  CR80_HEIGHT_MM,
  drawCR80CardPDF,
  prepareCardAssets,
} from '../utils/studentCardTemplates';
import { CR80StudentCard } from './CR80StudentCard';
import { CardBrandingModal } from './CardBrandingModal';

interface StudentCardModalProps {
  student: Student;
  settings: SystemSettings;
  onSaveDefaultTemplate?: (templateId: CardTemplateId) => void;
  onUpdateSettings?: (updated: SystemSettings) => void;
  onClose: () => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  student,
  settings,
  onSaveDefaultTemplate,
  onUpdateSettings,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplateId>(() => {
    return settings.defaultCardTemplate || 'seraphic';
  });
  const [showLanyard, setShowLanyard] = useState<boolean>(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  useEffect(() => {
    const payload = createStudentQRPayload(student);
    const color =
      selectedTemplate === 'pelita'
        ? '#0f172a'
        : selectedTemplate === 'seraphic'
        ? '#0b4a94'
        : '#14532d';

    generateQRCodeDataURL(payload, color).then((url) => setQrDataUrl(url));
  }, [student, selectedTemplate]);

  const handleSetDefault = () => {
    if (onSaveDefaultTemplate) {
      onSaveDefaultTemplate(selectedTemplate);
    } else {
      localStorage.setItem('absensi_default_card_template', selectedTemplate);
    }
    setToastMsg(`Template "${CARD_TEMPLATES[selectedTemplate].name}" disimpan sebagai default!`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Draw single CR80 card centered on A4 page
      const cardWidth = CR80_WIDTH_MM;
      const cardHeight = CR80_HEIGHT_MM;
      const x = (210 - cardWidth) / 2;
      const y = (297 - cardHeight) / 2;

      let photoDataUrl: string | undefined = undefined;
      const photoSrc = student.photo || student.avatarUrl;
      if (photoSrc) {
        if (photoSrc.startsWith('data:image')) {
          photoDataUrl = photoSrc;
        } else {
          try {
            photoDataUrl = await new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = 'Anonymous';
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || 200;
                canvas.height = img.naturalHeight || 240;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  resolve(canvas.toDataURL('image/jpeg', 0.9));
                } else {
                  resolve(undefined);
                }
              };
              img.onerror = () => resolve(undefined);
              img.src = photoSrc;
            });
          } catch {
            photoDataUrl = undefined;
          }
        }
      }

      // Title & note on A4
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('KARTU IDENTITAS & ABSENSI SISWA (CR80: 85,60 x 53,98 mm)', 105, y - 8, {
        align: 'center',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Desain: ${CARD_TEMPLATES[selectedTemplate].name} • Sekolah: ${settings.schoolName}`,
        105,
        y - 3,
        { align: 'center' }
      );

      // Pre-rasterize left logo, right logo, and signature to clean PNG data URLs for jsPDF
      const cardAssets = await prepareCardAssets(settings);

      drawCR80CardPDF(
        doc,
        x,
        y,
        cardWidth,
        cardHeight,
        student,
        settings,
        photoDataUrl,
        qrDataUrl,
        selectedTemplate,
        false,
        cardAssets
      );

      // Scissors cutting guide
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Gunting mengikuti garis tepi kartu sesuai ukuran standar kartu PVC ISO CR80.', 105, y + cardHeight + 6, {
        align: 'center',
      });

      const safeName = student.name.replace(/\s+/g, '_');
      doc.save(`Kartu_CR80_${student.nis}_${safeName}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Gagal mengekspor PDF kartu.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${student.nis}_${student.name.replace(/\s+/g, '_')}.png`;
    link.click();
  };

  const isCurrentDefault = (settings.defaultCardTemplate || 'seraphic') === selectedTemplate;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl relative my-auto animate-scale-up overflow-hidden max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-lg font-bold shadow-sm shadow-indigo-600/20">
              <i className="fa-solid fa-id-card"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Kartu Siswa Standar CR80 Landscape
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  85,60 × 53,98 mm (Landscape)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format landscape dengan QR Code besar & tajam agar instan discan untuk <strong>{student.name}</strong> ({student.classRoom}).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Tutup"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* 3 Templates Switcher Bar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto flex-1">
              {/* Option 1: Seraphic */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('seraphic')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedTemplate === 'seraphic'
                    ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-600 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-blue-800 shrink-0" />
                <span className="truncate">1. Standar Nasional (Biru)</span>
              </button>

              {/* Option 2: Nusantara */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('nusantara')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedTemplate === 'nusantara'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-600 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-800 shrink-0" />
                <span className="truncate">2. Klasik Hijau Zamrud</span>
              </button>

              {/* Option 3: Pelita */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('pelita')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedTemplate === 'pelita'
                    ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-500 text-cyan-950 dark:text-cyan-200 ring-2 ring-cyan-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-slate-900 shrink-0" />
                <span className="truncate">3. Smart Card Kontemporer</span>
              </button>
            </div>

            {/* Set As Default & Branding buttons */}
            <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsBrandingModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Unggah logo sekolah dan tanda tangan / barcode kepala sekolah"
              >
                <i className="fa-solid fa-stamp text-amber-600 dark:text-amber-400" />
                <span>Upload Logo & TTD</span>
              </button>

              {isCurrentDefault ? (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <i className="fa-solid fa-star text-amber-500" />
                  Default Aktif
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSetDefault}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Jadikan template yang dipilih sebagai default cetak seluruh siswa"
                >
                  <i className="fa-regular fa-star text-amber-500" />
                  <span>Jadikan Default</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowLanyard(!showLanyard)}
                className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-750 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                title="Tampilkan / sembunyikan tali lanyard"
              >
                <i className="fa-solid fa-ribbon mr-1" />
                {showLanyard ? 'Tali ON' : 'Tali OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in no-print">
            <i className="fa-solid fa-circle-check" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Card View Area */}
        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center overflow-y-auto flex-1">
          {/* Printable container styling for browser print */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #single-cr80-card-printable,
              #single-cr80-card-printable * {
                visibility: visible;
              }
              #single-cr80-card-printable {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                margin: 0;
                padding: 0;
                background: white !important;
              }
              #single-cr80-card-printable .cr80-card {
                width: 430px !important;
                height: 272px !important;
                transform: scale(0.752) !important;
                transform-origin: center center !important;
                border: 0.5px solid #cbd5e1 !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
            }
          `}</style>

          <div id="single-cr80-card-printable" className="flex flex-col items-center">
            <CR80StudentCard
              templateId={selectedTemplate}
              student={student}
              settings={settings}
              qrUrl={qrDataUrl}
              photoUrl={student.photo || student.avatarUrl}
              showLanyard={showLanyard}
              useSamplePromptData={false}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-download text-indigo-600 dark:text-indigo-400"></i>
              <span>Unduh File QR</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBrandingModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-700 transition-all cursor-pointer shadow-2xs"
              title="Unggah Logo Sekolah, Tut Wuri Handayani, dan TTD Kepala Sekolah agar muncul jelas di hasil download PDF"
            >
              <i className="fa-solid fa-stamp text-amber-600 dark:text-amber-400"></i>
              <span>Upload Logo & TTD</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <i className={`fa-solid ${isExportingPDF ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
              <span>{isExportingPDF ? 'Membuat PDF...' : 'Unduh PDF (CR80)'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <i className="fa-solid fa-print"></i>
              <span>Cetak Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Upload Logo & Tanda Tangan Kepsek */}
      {isBrandingModalOpen && (
        <CardBrandingModal
          isOpen={isBrandingModalOpen}
          settings={settings}
          onUpdateSettings={(updated) => {
            if (onUpdateSettings) {
              onUpdateSettings(updated);
            }
            setToastMsg('Logo & TTD Kepsek berhasil diperbarui!');
            setTimeout(() => setToastMsg(''), 3000);
          }}
          onClose={() => setIsBrandingModalOpen(false)}
        />
      )}
    </div>
  );
};

