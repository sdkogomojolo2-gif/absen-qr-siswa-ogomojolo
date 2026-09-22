import React, { useState, useEffect } from 'react';
import { Teacher, SystemSettings } from '../types';
import { HeadmasterBarcode, HEADMASTER_DEFAULT_BARCODE_DATA_URI } from '../utils/headmasterBarcode';

interface AdminProfileModalProps {
  currentTeacher: Teacher;
  settings: SystemSettings;
  onUpdateTeacher: (updated: Teacher) => void;
  onUpdateSettings: (updated: SystemSettings) => void;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  currentTeacher,
  settings,
  onUpdateTeacher,
  onUpdateSettings,
  onClose,
}) => {
  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Admin Data Form
  const [name, setName] = useState(currentTeacher.name);
  const [nip, setNip] = useState(currentTeacher.nip || '');
  const [email, setEmail] = useState(currentTeacher.email);
  const [subject, setSubject] = useState(currentTeacher.subject);

  // School & Headmaster Data Form (for official reports / signature)
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress);
  const [schoolCity, setSchoolCity] = useState(settings.schoolCity || 'Jakarta Selatan');
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [lateCutoffTime, setLateCutoffTime] = useState(settings.lateCutoffTime);
  const [headmasterName, setHeadmasterName] = useState(settings.headmasterName || 'Drs. H. Mulyadi, M.Pd');
  const [headmasterNip, setHeadmasterNip] = useState(settings.headmasterNip || '19680512 199403 1 005');
  const [headmasterBarcodeUrl, setHeadmasterBarcodeUrl] = useState(settings.headmasterBarcodeUrl || '');
  const [defaultCardTemplate, setDefaultCardTemplate] = useState<'seraphic' | 'nusantara' | 'pelita'>(
    settings.defaultCardTemplate || 'seraphic'
  );
  const [cardValidityYear, setCardValidityYear] = useState(settings.cardValidityYear || '2026');
  const [cardProgramName, setCardProgramName] = useState(settings.cardProgramName || 'REGULER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    // Update current admin profile
    onUpdateTeacher({
      ...currentTeacher,
      name: name.trim(),
      nip: nip.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim() || 'Administrator Sekolah',
    });

    // Update School Settings
    onUpdateSettings({
      ...settings,
      schoolName: schoolName.trim() || 'SD NEGERI INDONESIA',
      schoolAddress: schoolAddress.trim(),
      schoolCity: schoolCity.trim() || 'Jakarta',
      academicYear: academicYear.trim() || '2025/2026',
      lateCutoffTime,
      headmasterName: headmasterName.trim(),
      headmasterNip: headmasterNip.trim(),
      headmasterBarcodeUrl: headmasterBarcodeUrl.trim(),
      defaultCardTemplate,
      cardValidityYear: cardValidityYear.trim() || '2026',
      cardProgramName: cardProgramName.trim() || 'REGULER',
    });

    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden"
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl relative flex flex-col animate-scale-up overflow-hidden my-auto">
        {/* Sticky Header with prominent X button */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-bold shrink-0">
              <i className="fa-solid fa-user-gear"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                Edit Profil Admin & Identitas Sekolah
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Ubah nama sekolah, alamat, semester, data kepala sekolah & admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs border border-slate-200"
            title="Tutup Jendela (Esc)"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content Body */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
            {/* Section 1: Profil Pribadi Admin */}
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved text-amber-700"></i>
              <span>Profil Pribadi Administrator</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Admin & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: MOH. FADLI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  NIP Admin (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="contoh: 199903202025211020"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Login Admin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contoh: Fadli46046@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Jabatan / Bagian
                </label>
                <input
                  type="text"
                  placeholder="contoh: Kurikulum & Administrasi / Kepala Sekolah / IT"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data Sekolah & Jadwal */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-school text-indigo-600"></i>
              <span>Identitas Sekolah & Batas Waktu Masuk</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Sekolah / Instansi
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: SD NEGERI 1 INDONESIA"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kota / Kabupaten Sekolah
                </label>
                <input
                  type="text"
                  placeholder="contoh: Jakarta Selatan / Surabaya"
                  value={schoolCity}
                  onChange={(e) => setSchoolCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  placeholder="contoh: 2025/2026"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Jam Batas Masuk (Presensi)
                </label>
                <input
                  type="time"
                  value={lateCutoffTime}
                  onChange={(e) => setLateCutoffTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alamat Sekolah
                </label>
                <input
                  type="text"
                  placeholder="contoh: Jl. Merdeka No. 10"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Data Kepala Sekolah untuk Tanda Tangan Laporan */}
          <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-file-signature text-indigo-700"></i>
              <span>Data Kepala Sekolah (Pengesahan Laporan PDF)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Kepala Sekolah & Gelar
                </label>
                <input
                  type="text"
                  placeholder="contoh: Drs. H. Mulyadi, M.Pd"
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
                  placeholder="contoh: 19680512 199403 1 005"
                  value={headmasterNip}
                  onChange={(e) => setHeadmasterNip(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Barcode Tanda Tangan Elektronik (TTE) Kepala Sekolah */}
            <div className="pt-2 border-t border-indigo-200/80">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Barcode Pengesahan / TTE Kepala Sekolah (Muncul di Kartu Siswa)
              </label>
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-indigo-200">
                <div className="shrink-0 p-1 bg-slate-50 rounded-lg border border-slate-200">
                  <HeadmasterBarcode
                    customBarcodeUrl={headmasterBarcodeUrl}
                    size={56}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-[11px] text-slate-600 font-medium leading-tight">
                    {headmasterBarcodeUrl
                      ? 'Menggunakan barcode kustom yang Anda unggah.'
                      : 'Menggunakan barcode resmi SDN Kecil Ogomojolo.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-2xs">
                      <i className="fa-solid fa-upload"></i>
                      <span>Ganti Barcode</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setHeadmasterBarcodeUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {headmasterBarcodeUrl && (
                      <button
                        type="button"
                        onClick={() => setHeadmasterBarcodeUrl('')}
                        className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        <span>Reset ke Default SDN Kecil Ogomojolo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Pilihan Desain Kartu Siswa CR80 (85,60 x 53,98 mm) */}
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-id-card-clip text-blue-700"></i>
                <span>Desain Kartu Siswa Default (Standar CR80: 85,60 × 53,98 mm)</span>
              </h4>
              <span className="text-[10px] font-black bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full">
                ISO ID-1
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              Pilih salah satu dari 3 desain kartu berikut sebagai template bawaan saat mencetak kartu presisi QR untuk siswa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Seraphic */}
              <label
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  defaultCardTemplate === 'seraphic'
                    ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white/60 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-800" />
                    <span className="text-xs font-black text-slate-900">Seraphic Modern</span>
                  </div>
                  <input
                    type="radio"
                    name="cardTemplate"
                    value="seraphic"
                    checked={defaultCardTemplate === 'seraphic'}
                    onChange={() => setDefaultCardTemplate('seraphic')}
                    className="accent-blue-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Biru Samudra & Emas Elegan, Logo Perisai SA, Kurva Ombak Modern.
                </p>
              </label>

              {/* Option 2: Nusantara */}
              <label
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  defaultCardTemplate === 'nusantara'
                    ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white/60 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-800" />
                    <span className="text-xs font-black text-slate-900">Nusantara Klasik</span>
                  </div>
                  <input
                    type="radio"
                    name="cardTemplate"
                    value="nusantara"
                    checked={defaultCardTemplate === 'nusantara'}
                    onChange={() => setDefaultCardTemplate('nusantara')}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Hijau Zamrud & Krem Hangat, Tanda Tangan Kepala Sekolah Resmi.
                </p>
              </label>

              {/* Option 3: Pelita */}
              <label
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  defaultCardTemplate === 'pelita'
                    ? 'bg-white border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                    : 'bg-white/60 border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-600" />
                    <span className="text-xs font-black text-slate-900">Pelita Kontemporer</span>
                  </div>
                  <input
                    type="radio"
                    name="cardTemplate"
                    value="pelita"
                    checked={defaultCardTemplate === 'pelita'}
                    onChange={() => setDefaultCardTemplate('pelita')}
                    className="accent-orange-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Teal & Oranye Dinamis, Logo Burung, Akses Perpustakaan & Bar Valid.
                </p>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Masa Berlaku Kartu (Teks di Bawah)
                </label>
                <input
                  type="text"
                  placeholder="contoh: 2026 atau Juni 2025"
                  value={cardValidityYear}
                  onChange={(e) => setCardValidityYear(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Label Program / Jurusan Kartu (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="contoh: REGULER / BILINGUAL IPA"
                  value={cardProgramName}
                  onChange={(e) => setCardProgramName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-10 bg-slate-50/95 backdrop-blur-xs px-5 sm:px-6 py-3.5 border-t border-slate-200 flex gap-2 shrink-0">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-check"></i>
              <span>Simpan Profil & Data Sekolah</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 active:scale-98 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
