import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types';
import { SchoolLogo } from '../utils/schoolLogo';
import { TutWuriHandayaniLogo } from '../utils/tutWuriHandayaniLogo';
import { HeadmasterBarcode } from '../utils/headmasterBarcode';

interface CardBrandingModalProps {
  isOpen: boolean;
  settings: SystemSettings;
  onUpdateSettings: (updated: SystemSettings) => void;
  onClose: () => void;
}

/**
 * Optimizes an uploaded image file client-side (resizes to max dimension and compresses to PNG/JPEG)
 */
const processUploadedImage = (file: File, maxDim = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        return reject(new Error('Gagal membaca file'));
      }

      // If SVG, return data URL directly
      if (file.type === 'image/svg+xml') {
        return resolve(result);
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = Math.max(w, 1);
          canvas.height = Math.max(h, 1);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            // Use PNG for logos and signatures with transparency
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(result);
          }
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => reject(new Error('Format gambar tidak didukung'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas'));
    reader.readAsDataURL(file);
  });
};

export const CardBrandingModal: React.FC<CardBrandingModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(settings.schoolLogoUrl || '');
  const [tutWuriLogoUrl, setTutWuriLogoUrl] = useState(settings.tutWuriLogoUrl || '');
  const [headmasterSignatureUrl, setHeadmasterSignatureUrl] = useState(
    settings.headmasterSignatureUrl || ''
  );
  const [headmasterBarcodeUrl, setHeadmasterBarcodeUrl] = useState(
    settings.headmasterBarcodeUrl || ''
  );
  const [headmasterName, setHeadmasterName] = useState(settings.headmasterName || '');
  const [headmasterNip, setHeadmasterNip] = useState(settings.headmasterNip || '');
  const [schoolCity, setSchoolCity] = useState(settings.schoolCity || 'Ogomojolo');

  const [activeSection, setActiveSection] = useState<'logo' | 'ttd'>('logo');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const tutWuriInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      const dataUrl = await processUploadedImage(file, 400);
      setSchoolLogoUrl(dataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses gambar logo');
    }
  };

  const handleTutWuriUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      const dataUrl = await processUploadedImage(file, 400);
      setTutWuriLogoUrl(dataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses gambar');
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      const dataUrl = await processUploadedImage(file, 450);
      setHeadmasterSignatureUrl(dataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses gambar tanda tangan');
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      onUpdateSettings({
        ...settings,
        schoolLogoUrl: schoolLogoUrl.trim(),
        tutWuriLogoUrl: tutWuriLogoUrl.trim(),
        headmasterSignatureUrl: headmasterSignatureUrl.trim(),
        headmasterBarcodeUrl: headmasterBarcodeUrl.trim(),
        headmasterName: headmasterName.trim(),
        headmasterNip: headmasterNip.trim(),
        schoolCity: schoolCity.trim(),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        id="card-branding-modal"
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-6 animate-scale-up space-y-4"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
          title="Tutup"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-bold shadow-xs">
            <i className="fa-solid fa-stamp"></i>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Unggah Logo Sekolah & Tanda Tangan Kepala Sekolah
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Logo dan TTD akan langsung tampil di pratinjau kartu dan terbaca tajam saat kartu PDF diunduh/dicetak.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveSection('logo')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'logo'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fa-solid fa-shield-halved"></i>
            <span>Logo Sekolah (Kop Kartu)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('ttd')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'ttd'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fa-solid fa-file-signature"></i>
            <span>Tanda Tangan / TTE Kepsek</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: LOGO SEKOLAH                                                    */}
        {/* ========================================================================= */}
        {activeSection === 'logo' && (
          <div className="space-y-4 py-1">
            {/* Logo Utama Kiri */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fa-solid fa-shield-cat text-amber-600"></i>
                  <span>Logo Utama Sekolah (Kop Kiri)</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  {schoolLogoUrl ? 'Logo Kustom Terpasang' : 'Logo Resmi Default'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                <div className="w-20 h-20 shrink-0 bg-slate-100 rounded-xl border border-slate-200 p-2 flex items-center justify-center shadow-inner">
                  {schoolLogoUrl ? (
                    <img
                      src={schoolLogoUrl}
                      alt="Logo Sekolah Kustom"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <SchoolLogo size={56} title="Logo Default" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {schoolLogoUrl
                      ? 'Menggunakan logo khusus yang Anda unggah. Gambar ini akan otomatis disematkan ke berkas PDF kartu siswa.'
                      : 'Menggunakan logo resmi SDN Kecil Ogomojolo. Unggah file logo sekolah Anda sendiri (format PNG transparan disarankan).'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <i className="fa-solid fa-upload"></i>
                      <span>{schoolLogoUrl ? 'Ganti File Logo' : 'Unggah Logo Sekolah'}</span>
                    </button>

                    {schoolLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setSchoolLogoUrl('')}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        <span>Reset ke Default</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Pendamping Kanan (Opsional) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
                  <span>Logo Pendamping / Tut Wuri Handayani (Kop Kanan)</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  {tutWuriLogoUrl ? 'Logo Kanan Kustom' : 'Logo Tut Wuri Default'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                <div className="w-20 h-20 shrink-0 bg-slate-100 rounded-xl border border-slate-200 p-2 flex items-center justify-center shadow-inner">
                  {tutWuriLogoUrl ? (
                    <img
                      src={tutWuriLogoUrl}
                      alt="Logo Kanan Kustom"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <TutWuriHandayaniLogo size={56} />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Secara default menggunakan lambang pendidikan Tut Wuri Handayani / Lambang Pemda. Anda dapat menggantinya dengan lambang dinas setempat jika diperlukan.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={tutWuriInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleTutWuriUpload}
                    />
                    <button
                      type="button"
                      onClick={() => tutWuriInputRef.current?.click()}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <i className="fa-solid fa-upload"></i>
                      <span>{tutWuriLogoUrl ? 'Ganti Logo Kanan' : 'Unggah Logo Kanan'}</span>
                    </button>

                    {tutWuriLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setTutWuriLogoUrl('')}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        <span>Reset ke Default</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: TANDA TANGAN / TTE KEPALA SEKOLAH                              */}
        {/* ========================================================================= */}
        {activeSection === 'ttd' && (
          <div className="space-y-4 py-1">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fa-solid fa-file-signature text-emerald-600"></i>
                  <span>Tanda Tangan Basah / Stempel / Barcode TTE Kepala Sekolah</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  {headmasterSignatureUrl
                    ? 'TTD Kustom Terpasang'
                    : 'Barcode TTE Digital Default'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                <div className="w-28 h-20 shrink-0 bg-slate-100 rounded-xl border border-slate-200 p-2 flex items-center justify-center shadow-inner">
                  {headmasterSignatureUrl ? (
                    <img
                      src={headmasterSignatureUrl}
                      alt="Tanda Tangan Kustom"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <HeadmasterBarcode
                      customBarcodeUrl={headmasterBarcodeUrl}
                      size={54}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unggah hasil scan atau foto tanda tangan asli kepala sekolah (disertai stempel sekolah bila ada), atau gambar barcode TTE resmi sekolah Anda.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={signInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleSignatureUpload}
                    />
                    <button
                      type="button"
                      onClick={() => signInputRef.current?.click()}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <i className="fa-solid fa-upload"></i>
                      <span>
                        {headmasterSignatureUrl ? 'Ganti TTD / Stempel' : 'Unggah TTD / Stempel'}
                      </span>
                    </button>

                    {headmasterSignatureUrl && (
                      <button
                        type="button"
                        onClick={() => setHeadmasterSignatureUrl('')}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        <span>Reset ke Barcode TTE</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Nama & NIP Kepala Sekolah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Kepala Sekolah & Gelar
                </label>
                <input
                  type="text"
                  placeholder="Drs. H. Mulyadi, M.Pd"
                  value={headmasterName}
                  onChange={(e) => setHeadmasterName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  placeholder="19680512 199403 1 005"
                  value={headmasterNip}
                  onChange={(e) => setHeadmasterNip(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kota / Tempat Pengesahan Kartu
                </label>
                <input
                  type="text"
                  placeholder="contoh: Ogomojolo atau Palasa"
                  value={schoolCity}
                  onChange={(e) => setSchoolCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="cursor-pointer inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all"
          >
            {isSaving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i>
                <span>Terapkan ke Kartu Siswa & PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
