import React from 'react';
import { Student, SystemSettings } from '../types';
import { CardTemplateId, CARD_TEMPLATES } from '../utils/studentCardTemplates';
import { SchoolLogo } from '../utils/schoolLogo';
import { TutWuriHandayaniLogo } from '../utils/tutWuriHandayaniLogo';
import { HeadmasterBarcode } from '../utils/headmasterBarcode';

interface CR80StudentCardProps {
  templateId: CardTemplateId;
  student?: Student;
  settings: SystemSettings;
  qrUrl?: string;
  photoUrl?: string;
  useSamplePromptData?: boolean;
  showLanyard?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  showCheckbox?: boolean;
  className?: string;
}

export const CR80StudentCard: React.FC<CR80StudentCardProps> = ({
  templateId,
  student,
  settings,
  qrUrl,
  photoUrl,
  useSamplePromptData = false,
  showLanyard = true,
  isSelected = true,
  onToggleSelect,
  showCheckbox = false,
  className = '',
}) => {
  const template = CARD_TEMPLATES[templateId] || CARD_TEMPLATES.seraphic;

  // Resolve values: Sample Prompt vs Real School Data
  const sample = template.sampleStudent;
  const isSample = useSamplePromptData || !student;

  const displayName = isSample ? sample.name : student.name.toUpperCase();
  const displayNis = isSample ? sample.nis : student.nis;
  const displayNisn = isSample
    ? sample.nisn
    : student.nisn || (student.nis ? `008${student.nis.slice(0, 7)}` : '0081234567');
  const displayClass = isSample ? sample.classRoom : student.classRoom;
  const displaySchool = isSample
    ? sample.schoolName
    : settings.schoolName?.toUpperCase() || 'SDN KECIL OGOMOJOLO';
  const displayDepartment = isSample
    ? sample.departmentText
    : settings.schoolCity
    ? `DINAS PENDIDIKAN DAN KEBUDAYAAN KABUPATEN ${settings.schoolCity.toUpperCase()}`
    : 'DINAS PENDIDIKAN DAN KEBUDAYAAN KAB. PARIGI MOUTONG';
  const displaySchoolAddress = isSample
    ? sample.schoolAddressText
    : settings.schoolAddress || 'Desa Ogomojolo, Kec. Palasa, Kab. Parigi Moutong';
  const displayYear = isSample ? sample.academicYear : settings.academicYear;
  const displayPhoto = isSample
    ? sample.photoUrl
    : photoUrl || student?.photo || student?.avatarUrl || sample.photoUrl;
  const displayHeadmaster = isSample
    ? sample.headmasterName
    : settings.headmasterName || 'Drs. H. Mulyadi, M.Pd';
  const displayHeadmasterNip = isSample
    ? sample.headmasterNip
    : settings.headmasterNip || 'NIP. 19750810 200501 1 008';
  const displayCityDate = isSample
    ? sample.cityDateText
    : `${settings.schoolCity || 'Ogomojolo'}, 15 Juli 2024`;
  const displayTTL = isSample
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
  const displayGender = isSample
    ? sample.gender
    : student.gender || 'Perempuan';
  const displayReligion = isSample
    ? sample.religion
    : student.religion || 'Islam';
  const displayAddress = isSample
    ? sample.address
    : student.address || 'Desa Ogomojolo, Kec. Palasa';
  const displayValidity = isSample
    ? sample.validityText
    : settings.cardValidityYear
    ? `Berlaku s/d: ${settings.cardValidityYear}`
    : 'Berlaku Selama Menjadi Siswa Aktif';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 0. Optional Lanyard Strap & Clip (Matching Colors from Prompt) */}
      {showLanyard && (
        <div className="flex flex-col items-center -mb-2 z-20 pointer-events-none no-print">
          {/* Lanyard Fabric Loop */}
          <div
            className="w-10 h-7 shadow-inner flex items-center justify-center relative overflow-hidden rounded-t-xs"
            style={{
              backgroundColor: template.colors.lanyard,
            }}
          >
            {template.colors.lanyardPattern && (
              <div
                className="w-2 h-full opacity-80"
                style={{ backgroundColor: template.colors.lanyardPattern }}
              />
            )}
          </div>
          {/* Metallic Clip & Punch Slot */}
          <div className="w-6 h-2.5 bg-gradient-to-b from-slate-200 via-slate-400 to-slate-300 rounded-xs shadow-xs border border-slate-400 -mt-0.5 z-10 flex items-center justify-center">
            <div className="w-3 h-0.5 bg-slate-600 rounded-full" />
          </div>
        </div>
      )}

      {/* 1. Base CR80 Card (Physical ISO 7810 ID-1: 85.60 x 53.98 mm - Landscape) */}
      <div
        className="cr80-card relative bg-white text-slate-900 border border-slate-300/90 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between"
        style={{
          width: '430px',
          height: '272px', // Physical CR80 aspect ratio 85.60mm x 53.98mm
          maxWidth: '100%',
        }}
      >
        {/* Checkbox Selector (Non-Printable) */}
        {showCheckbox && onToggleSelect && (
          <button
            type="button"
            onClick={onToggleSelect}
            className="absolute top-2.5 right-2.5 z-40 w-6 h-6 rounded-lg bg-white/95 border border-slate-300 flex items-center justify-center text-xs cursor-pointer shadow-md no-print hover:bg-white transition-transform active:scale-95"
            title={isSelected ? 'Batalkan cetak siswa ini' : 'Pilih siswa ini'}
          >
            {isSelected && (
              <i
                className="fa-solid fa-check font-black"
                style={{ color: template.colors.primary }}
              />
            )}
          </button>
        )}

        {/* ========================================================================= */}
        {/* TEMPLATE 1: STANDAR NASIONAL (BIRU KEMDIKBUD + TUT WURI HANDAYANI)       */}
        {/* ========================================================================= */}
        {templateId === 'seraphic' && (
          <div className="w-full h-full flex flex-col justify-between relative bg-white p-2 overflow-hidden">
            {/* Watermark Logo Resmi Sekolah di Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
              <SchoolLogo size={180} />
            </div>

            {/* Top Navy & Gold Accent Borders */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-950 via-blue-800 to-amber-500 z-10" />

            {/* KOP RESMI SEKOLAH (LANDSCAPE) */}
            <div className="relative z-10 pt-0.5 pb-1">
              <div className="flex items-center justify-between gap-2 px-1">
                {/* Logo Resmi Sekolah */}
                <div className="shrink-0 flex items-center justify-center">
                  {settings.schoolLogoUrl ? (
                    <img
                      src={settings.schoolLogoUrl}
                      alt="Logo Sekolah"
                      className="w-8 h-8 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <SchoolLogo size={32} title="Logo Resmi SDN Kecil Ogomojolo" />
                  )}
                </div>

                {/* Teks KOP Instansi */}
                <div className="flex-1 text-center min-w-0 px-1">
                  <h6 className="text-[7px] font-bold text-slate-600 tracking-wider uppercase leading-none">
                    {displayDepartment}
                  </h6>
                  <h4 className="text-[10.5px] font-black text-blue-950 uppercase tracking-tight leading-tight mt-0.5 truncate">
                    {displaySchool}
                  </h4>
                  <p className="text-[6.5px] text-slate-500 font-medium leading-tight truncate">
                    {displaySchoolAddress}
                  </p>
                </div>

                {/* Logo Tut Wuri Handayani / Kanan */}
                <div className="shrink-0 flex items-center justify-center">
                  {settings.tutWuriLogoUrl ? (
                    <img
                      src={settings.tutWuriLogoUrl}
                      alt="Logo Pendamping"
                      className="w-8 h-8 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <TutWuriHandayaniLogo size={32} />
                  )}
                </div>
              </div>

              {/* Garis KOP Ganda (Tebal & Tipis) */}
              <div className="mt-1 space-y-0.5 px-1">
                <div className="w-full h-[1.5px] bg-blue-950" />
                <div className="w-full h-[0.5px] bg-amber-500" />
              </div>
            </div>

            {/* BANNER JUDUL KARTU */}
            <div className="relative z-10 mx-1 py-0.5 px-2 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white rounded text-center flex items-center justify-between shadow-2xs">
              <h5 className="text-[8px] font-black tracking-wider uppercase">
                KARTU TANDA PELAJAR & PRESENSI DIGITAL
              </h5>
              <span className="text-[6.5px] text-amber-300 font-bold uppercase tracking-wider">
                TA {displayYear}
              </span>
            </div>

            {/* 3-COLUMN BODY: FOTO (LEFT) - BIODATA & TTD (CENTER) - HUGE QR (RIGHT) */}
            <div className="relative z-10 flex items-stretch gap-2.5 px-1 py-1 flex-1">
              {/* KOLOM 1: Pasfoto Formal 3x4 dengan Stempel & NIS */}
              <div className="shrink-0 flex flex-col items-center justify-start w-[76px]">
                <div className="relative p-0.5 bg-white border-2 border-blue-900 rounded-md shadow-xs overflow-hidden">
                  <div className="w-[68px] h-[86px] bg-slate-100 rounded-xs overflow-hidden flex items-center justify-center">
                    {displayPhoto ? (
                      <img
                        src={displayPhoto}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <i className="fa-solid fa-user text-2xl text-slate-400" />
                    )}
                  </div>

                  {/* STEMPEL RESMI BASAH */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-indigo-700/80 bg-indigo-500/10 backdrop-blur-[0.5px] flex flex-col items-center justify-center pointer-events-none rotate-[-12deg]">
                    <div className="w-8 h-8 rounded-full border border-dashed border-indigo-700/80 flex flex-col items-center justify-center text-center p-0.5">
                      <span className="text-[3.5px] font-black text-indigo-900 tracking-tighter uppercase leading-none">
                        SEKOLAH
                      </span>
                      <i className="fa-solid fa-star text-[3.5px] text-indigo-700 my-0.5" />
                      <span className="text-[3.5px] font-black text-indigo-900 tracking-tighter uppercase leading-none">
                        RESMI
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge NIS & Status di Bawah Foto */}
                <div className="mt-1 w-full text-center bg-slate-100 rounded border border-slate-200 py-0.5">
                  <div className="text-[7.5px] font-bold font-mono text-blue-950 leading-tight">
                    NIS: {displayNis}
                  </div>
                  <div className="text-[6px] font-black text-emerald-700 uppercase leading-none">
                    SISWA AKTIF
                  </div>
                </div>
              </div>

              {/* KOLOM 2: Biodata Siswa & Pengesahan Kepala Sekolah */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                {/* Tabel Biodata Siswa */}
                <div className="space-y-0.5 text-[7.5px] text-slate-800 leading-tight">
                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-slate-600">NIS/NISN</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-mono font-bold text-blue-950 truncate">
                      {displayNis} / {displayNisn}
                    </span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-slate-600">Nama</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-black text-[8px] text-slate-950 uppercase truncate">
                      {displayName}
                    </span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-slate-600">TTL</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-medium truncate">{displayTTL}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-slate-600">J. Kelamin</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-medium">{displayGender}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-slate-600">Agama</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-medium">{displayReligion}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-slate-600">Kelas</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-bold text-blue-900">{displayClass}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-slate-600">Alamat</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-[7px] truncate">{displayAddress}</span>
                  </div>
                </div>

                {/* Pengesahan Kepala Sekolah di Bawah Biodata */}
                <div className="mt-1 pt-1 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[6px] text-slate-500 font-medium">{displayCityDate}</p>
                    <p className="text-[6.5px] font-bold text-slate-800">Kepala Sekolah,</p>
                    <p className="text-[7px] font-black text-slate-950 underline leading-tight truncate max-w-[140px] mt-2">
                      {displayHeadmaster}
                    </p>
                    <p className="text-[6px] font-mono text-slate-500 leading-none">
                      {displayHeadmasterNip}
                    </p>
                  </div>

                  {/* TTE Barcode / TTD Kepsek */}
                  <div className="shrink-0 flex flex-col items-center pl-1">
                    {settings.headmasterSignatureUrl ? (
                      <div className="h-6.5 max-w-[52px] flex items-center justify-center">
                        <img
                          src={settings.headmasterSignatureUrl}
                          alt="TTD Kepala Sekolah"
                          className="max-h-6.5 max-w-[52px] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <HeadmasterBarcode
                        customBarcodeUrl={settings.headmasterBarcodeUrl}
                        size={26}
                      />
                    )}
                    <span className="text-[5px] font-bold text-blue-900 mt-0.5">
                      {settings.headmasterSignatureUrl ? 'TTD RESMI' : 'TTE RESMI'}
                    </span>
                  </div>
                </div>
              </div>

              {/* KOLOM 3: HUGE SCANNABLE QR CODE & SCAN BADGE */}
              <div className="shrink-0 flex flex-col items-center justify-center w-[105px]">
                <div className="p-1.5 bg-white border-2 border-blue-900 rounded-xl shadow-md">
                  <div className="w-[92px] h-[92px] bg-white flex items-center justify-center overflow-hidden">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR ${displayName}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400 font-bold">
                        QR Code
                      </div>
                    )}
                  </div>
                </div>

                {/* Scan Button / Badge */}
                <div className="mt-1.5 w-full py-1 bg-blue-900 text-white rounded-md text-center shadow-xs flex items-center justify-center gap-1">
                  <i className="fa-solid fa-qrcode text-[8px] text-amber-300"></i>
                  <span className="text-[7px] font-black tracking-wider uppercase">
                    PINDAI ABSENSI
                  </span>
                </div>
              </div>
            </div>

            {/* KETENTUAN TATA TERTIB & FOOTER */}
            <div className="relative z-10 px-1 pt-0.5 border-t border-slate-200 flex items-center justify-between text-[6.5px]">
              <span className="text-slate-500">
                Kartu sah presensi digital siswa SDN Kecil Ogomojolo. Wajib dibawa setiap hari sekolah.
              </span>
              <span className="font-bold text-blue-950 shrink-0">{displayValidity}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TEMPLATE 2: KLASIK HIJAU ZAMRUD (FORMAL AKADEMIK + EMERALD)              */}
        {/* ========================================================================= */}
        {templateId === 'nusantara' && (
          <div className="w-full h-full flex flex-col justify-between relative bg-[#fcfcf9] p-2 overflow-hidden border-2 border-emerald-900/20">
            {/* Watermark Lambang Sekolah di Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
              <SchoolLogo size={180} />
            </div>

            {/* Top Emerald Header Ribbon */}
            <div className="relative z-10 -mx-2 -mt-2 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-2 py-1.5 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="shrink-0 p-0.5 bg-white/10 rounded border border-amber-300/40 flex items-center justify-center">
                  {settings.schoolLogoUrl ? (
                    <img
                      src={settings.schoolLogoUrl}
                      alt="Logo Sekolah"
                      className="w-7 h-7 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <SchoolLogo size={30} title="Logo Resmi SDN Kecil Ogomojolo" />
                  )}
                </div>

                <div className="flex-1 text-center min-w-0 px-1">
                  <h6 className="text-[6.5px] font-bold text-emerald-200 uppercase tracking-wider leading-none">
                    {displayDepartment}
                  </h6>
                  <h4 className="text-[10px] font-black text-amber-300 uppercase tracking-tight leading-tight mt-0.5 truncate">
                    {displaySchool}
                  </h4>
                  <p className="text-[6px] text-emerald-100 font-normal leading-tight truncate">
                    {displaySchoolAddress}
                  </p>
                </div>

                <div className="shrink-0 p-0.5 bg-white/10 rounded border border-amber-300/40 flex items-center justify-center">
                  {settings.tutWuriLogoUrl ? (
                    <img
                      src={settings.tutWuriLogoUrl}
                      alt="Logo Pendamping"
                      className="w-7 h-7 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <TutWuriHandayaniLogo size={30} />
                  )}
                </div>
              </div>

              {/* Gold Divider */}
              <div className="mt-1 flex items-center justify-center gap-1">
                <div className="flex-1 h-[0.5px] bg-amber-400/60" />
                <i className="fa-solid fa-diamond text-[3.5px] text-amber-300" />
                <div className="flex-1 h-[0.5px] bg-amber-400/60" />
              </div>
            </div>

            {/* Sub-banner */}
            <div className="relative z-10 mx-1 my-0.5 px-2 py-0.5 bg-emerald-100 border border-emerald-300 rounded flex items-center justify-between text-emerald-950">
              <h5 className="text-[7.5px] font-black uppercase tracking-wider">
                KARTU IDENTITAS & PRESENSI DIGITAL SISWA
              </h5>
              <span className="text-[6.5px] font-bold text-emerald-800 uppercase">
                TP {displayYear}
              </span>
            </div>

            {/* 3-Column Body */}
            <div className="relative z-10 flex items-stretch gap-2.5 px-1 py-1 flex-1">
              {/* Kolom 1: Foto */}
              <div className="shrink-0 flex flex-col items-center justify-start w-[76px]">
                <div className="relative p-0.5 bg-white border-2 border-emerald-900 rounded-md shadow-xs overflow-hidden">
                  <div className="w-[68px] h-[86px] bg-slate-100 rounded-xs overflow-hidden flex items-center justify-center">
                    {displayPhoto ? (
                      <img
                        src={displayPhoto}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <i className="fa-solid fa-user text-2xl text-slate-400" />
                    )}
                  </div>

                  {/* Stempel Hijau Nusantara */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-emerald-800/80 bg-emerald-500/10 backdrop-blur-[0.5px] flex flex-col items-center justify-center pointer-events-none rotate-[-10deg]">
                    <div className="w-8 h-8 rounded-full border border-dashed border-emerald-800/80 flex flex-col items-center justify-center text-center p-0.5">
                      <span className="text-[3.5px] font-black text-emerald-950 uppercase leading-none">
                        SAH
                      </span>
                      <i className="fa-solid fa-star text-[3.5px] text-amber-500 my-0.5" />
                      <span className="text-[3.5px] font-black text-emerald-950 uppercase leading-none">
                        RESMI
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-1 w-full text-center bg-emerald-50 rounded border border-emerald-200 py-0.5">
                  <div className="text-[7.5px] font-bold font-mono text-emerald-950 leading-tight">
                    NIS: {displayNis}
                  </div>
                  <div className="text-[6px] font-black text-emerald-800 uppercase leading-none">
                    TERVERIFIKASI
                  </div>
                </div>
              </div>

              {/* Kolom 2: Biodata & Kepsek */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="space-y-0.5 text-[7.5px] text-slate-800 leading-tight">
                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-emerald-900">NIS/NISN</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-mono font-bold text-emerald-950 truncate">
                      {displayNis} / {displayNisn}
                    </span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-emerald-900">Nama</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-black text-[8px] text-slate-950 uppercase truncate">
                      {displayName}
                    </span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-emerald-900">TTL</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-medium truncate">{displayTTL}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-emerald-900">J. Kelamin</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-medium">{displayGender}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-emerald-900">Agama</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-medium">{displayReligion}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-emerald-900">Kelas</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-bold text-emerald-900">{displayClass}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-emerald-900">Alamat</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-[7px] truncate">{displayAddress}</span>
                  </div>
                </div>

                <div className="mt-1 pt-1 border-t border-emerald-200/80 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[6px] text-slate-500 font-medium">{displayCityDate}</p>
                    <p className="text-[6.5px] font-bold text-emerald-950">Kepala Sekolah,</p>
                    <p className="text-[7px] font-black text-slate-950 underline leading-tight truncate max-w-[140px] mt-2">
                      {displayHeadmaster}
                    </p>
                    <p className="text-[6px] font-mono text-slate-500 leading-none">
                      {displayHeadmasterNip}
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col items-center pl-1">
                    {settings.headmasterSignatureUrl ? (
                      <div className="h-6.5 max-w-[52px] flex items-center justify-center">
                        <img
                          src={settings.headmasterSignatureUrl}
                          alt="TTD Kepala Sekolah"
                          className="max-h-6.5 max-w-[52px] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <HeadmasterBarcode
                        customBarcodeUrl={settings.headmasterBarcodeUrl}
                        size={26}
                      />
                    )}
                    <span className="text-[5px] font-bold text-emerald-900 mt-0.5">
                      {settings.headmasterSignatureUrl ? 'TTD RESMI' : 'TTE DIGITAL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kolom 3: HUGE QR CODE */}
              <div className="shrink-0 flex flex-col items-center justify-center w-[105px]">
                <div className="p-1.5 bg-white border-2 border-emerald-900 rounded-xl shadow-md">
                  <div className="w-[92px] h-[92px] bg-white flex items-center justify-center overflow-hidden">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR ${displayName}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400 font-bold">
                        QR Code
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-1.5 w-full py-1 bg-emerald-900 text-white rounded-md text-center shadow-xs flex items-center justify-center gap-1">
                  <i className="fa-solid fa-qrcode text-[8px] text-amber-300"></i>
                  <span className="text-[7px] font-black tracking-wider uppercase">
                    PINDAI ABSENSI
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 px-1 pt-0.5 border-t border-emerald-200 flex items-center justify-between text-[6.5px]">
              <span className="text-slate-500">
                Wajib dibawa saat presensi & perpustakaan sekolah. Bila hilang lapor TU.
              </span>
              <span className="font-bold text-emerald-950 shrink-0">{displayValidity}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TEMPLATE 3: SMART CARD KONTEMPORER (DARK SLATE & CYAN)                    */}
        {/* ========================================================================= */}
        {templateId === 'pelita' && (
          <div className="w-full h-full flex flex-col justify-between relative bg-white p-2 overflow-hidden border border-slate-300">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
              <SchoolLogo size={180} />
            </div>

            {/* Top Dark Slate Banner */}
            <div className="relative z-10 -mx-2 -mt-2 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 text-white px-2 py-1.5 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="shrink-0 p-0.5 bg-white/10 rounded border border-cyan-400/40 flex items-center justify-center">
                  {settings.schoolLogoUrl ? (
                    <img
                      src={settings.schoolLogoUrl}
                      alt="Logo Sekolah"
                      className="w-7 h-7 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <SchoolLogo size={30} title="Logo Resmi SDN Kecil Ogomojolo" />
                  )}
                </div>

                <div className="flex-1 text-center min-w-0 px-1">
                  <h6 className="text-[6.5px] font-extrabold text-cyan-300 uppercase tracking-widest leading-none">
                    {displayDepartment}
                  </h6>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight leading-tight mt-0.5 truncate">
                    {displaySchool}
                  </h4>
                  <p className="text-[6px] text-slate-300 font-light leading-tight truncate">
                    {displaySchoolAddress}
                  </p>
                </div>

                <div className="shrink-0 p-0.5 bg-white/10 rounded border border-cyan-400/40 flex items-center justify-center">
                  {settings.tutWuriLogoUrl ? (
                    <img
                      src={settings.tutWuriLogoUrl}
                      alt="Logo Pendamping"
                      className="w-7 h-7 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <TutWuriHandayaniLogo size={30} />
                  )}
                </div>
              </div>

              {/* Cyan Accent Line */}
              <div className="mt-1 h-[1.5px] bg-gradient-to-r from-cyan-400 via-blue-500 to-orange-500" />
            </div>

            {/* Sub-banner */}
            <div className="relative z-10 mx-1 my-0.5 px-2 py-0.5 bg-slate-900 text-white rounded flex items-center justify-between">
              <span className="text-[7.5px] font-black uppercase tracking-wider text-cyan-400">
                SMART STUDENT ID & DIGITAL ATTENDANCE
              </span>
              <span className="text-[6px] font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                ACTIVE
              </span>
            </div>

            {/* 3-Column Body */}
            <div className="relative z-10 flex items-stretch gap-2.5 px-1 py-1 flex-1">
              {/* Kolom 1: Foto + Smart Chip */}
              <div className="shrink-0 flex flex-col items-center justify-start w-[76px]">
                <div className="relative p-0.5 bg-white border-2 border-cyan-700 rounded-md shadow-xs overflow-hidden">
                  <div className="w-[68px] h-[86px] bg-slate-100 rounded-xs overflow-hidden flex items-center justify-center">
                    {displayPhoto ? (
                      <img
                        src={displayPhoto}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <i className="fa-solid fa-user text-2xl text-slate-400" />
                    )}
                  </div>

                  {/* Golden Smart Chip Icon */}
                  <div className="absolute top-1 left-1 w-3.5 h-3 rounded-xs bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border border-amber-700/60 flex items-center justify-center shadow-2xs pointer-events-none opacity-90">
                    <div className="w-2 h-1.5 border border-amber-800/40 rounded-3xs" />
                  </div>

                  {/* Stempel Bulat */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2 border-cyan-800/80 bg-cyan-500/10 backdrop-blur-[0.5px] flex flex-col items-center justify-center pointer-events-none rotate-[-8deg]">
                    <div className="w-8 h-8 rounded-full border border-dashed border-cyan-800/80 flex flex-col items-center justify-center text-center p-0.5">
                      <span className="text-[3.5px] font-black text-cyan-950 uppercase leading-none">
                        SMART
                      </span>
                      <i className="fa-solid fa-qrcode text-[3.5px] text-cyan-800 my-0.5" />
                      <span className="text-[3.5px] font-black text-cyan-950 uppercase leading-none">
                        VALID
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-1 w-full text-center bg-cyan-50 rounded border border-cyan-200 py-0.5">
                  <div className="text-[7.5px] font-bold font-mono text-cyan-950 leading-tight">
                    NIS: {displayNis}
                  </div>
                  <div className="text-[6px] font-black text-cyan-700 uppercase leading-none">
                    E-CARD VERIFIED
                  </div>
                </div>
              </div>

              {/* Kolom 2: Biodata & Kepsek */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="space-y-0.5 text-[7.5px] text-slate-800 leading-tight">
                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-cyan-900">NIS/NISN</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-mono font-bold text-slate-900 truncate">
                      {displayNis} / {displayNisn}
                    </span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-cyan-900">Nama</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-black text-[8px] text-slate-950 uppercase truncate">
                      {displayName}
                    </span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-cyan-900">TTL</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-medium truncate">{displayTTL}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-cyan-900">J. Kelamin</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-medium">{displayGender}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-cyan-900">Agama</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-medium">{displayReligion}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-cyan-900">Kelas</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-bold text-cyan-800">{displayClass}</span>
                  </div>

                  <div className="grid grid-cols-[48px_6px_1fr] items-baseline">
                    <span className="font-semibold text-cyan-900">Alamat</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-[7px] truncate">{displayAddress}</span>
                  </div>
                </div>

                <div className="mt-1 pt-1 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[6px] text-slate-500 font-medium">{displayCityDate}</p>
                    <p className="text-[6.5px] font-bold text-slate-800">Kepala Sekolah,</p>
                    <p className="text-[7px] font-black text-slate-950 underline leading-tight truncate max-w-[140px] mt-2">
                      {displayHeadmaster}
                    </p>
                    <p className="text-[6px] font-mono text-slate-500 leading-none">
                      {displayHeadmasterNip}
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col items-center pl-1">
                    {settings.headmasterSignatureUrl ? (
                      <div className="h-6.5 max-w-[52px] flex items-center justify-center">
                        <img
                          src={settings.headmasterSignatureUrl}
                          alt="TTD Kepala Sekolah"
                          className="max-h-6.5 max-w-[52px] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <HeadmasterBarcode
                        customBarcodeUrl={settings.headmasterBarcodeUrl}
                        size={26}
                      />
                    )}
                    <span className="text-[5px] font-bold text-cyan-900 mt-0.5">
                      {settings.headmasterSignatureUrl ? 'TTD RESMI' : 'TTE DIGITAL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kolom 3: HUGE QR CODE */}
              <div className="shrink-0 flex flex-col items-center justify-center w-[105px]">
                <div className="p-1.5 bg-white border-2 border-cyan-800 rounded-xl shadow-md">
                  <div className="w-[92px] h-[92px] bg-white flex items-center justify-center overflow-hidden">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR ${displayName}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400 font-bold">
                        QR Code
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-1.5 w-full py-1 bg-cyan-700 text-white rounded-md text-center shadow-xs flex items-center justify-center gap-1">
                  <i className="fa-solid fa-qrcode text-[8px] text-amber-300"></i>
                  <span className="text-[7px] font-black tracking-wider uppercase">
                    PINDAI ABSENSI
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 px-1 pt-0.5 border-t border-slate-200 flex items-center justify-between text-[6.5px]">
              <span className="text-slate-500">
                Official Digital Identity Card SDN Kecil Ogomojolo.
              </span>
              <span className="font-bold text-cyan-900 shrink-0">{displayValidity}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
