import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Student, AttendanceRecord, SystemSettings, Teacher } from '../types';
import { saveToCloudSync, fetchFromCloudSync, generateSyncCode } from '../utils/cloudSync';
import { exportFullBackupJSON, exportAttendanceToCSV, exportStudentsToCSV } from '../utils/csv';
import { googleSignIn, googleLogout, initAuth } from '../utils/googleAuth';
import { createGoogleSpreadsheet, exportToGoogleSheets } from '../utils/googleSheets';
import { safeSetItem, safeGetItem } from '../utils/storage';

interface CloudSyncModalProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: SystemSettings;
  teachers: Teacher[];
  onRestoreData: (restored: {
    students: Student[];
    attendanceRecords: AttendanceRecord[];
    settings: SystemSettings;
    teachers: Teacher[];
  }) => void;
  onClose: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  students,
  attendanceRecords,
  settings,
  teachers,
  onRestoreData,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'gsheets' | 'backup' | 'restore'>('sync');

  // Google Sheets state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return safeGetItem('absensi_google_spreadsheet_id') || '';
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    return safeGetItem('absensi_google_spreadsheet_url') || '';
  });
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  // Initialize Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Existing sync code or generate a new one
  const [syncCode, setSyncCode] = useState<string>(() => {
    return safeGetItem('absensi_active_sync_code') || generateSyncCode();
  });

  const [inputSyncCode, setInputSyncCode] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return safeGetItem('absensi_last_cloud_sync_time') || 'Belum pernah disinkronkan';
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoggingInGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleAccessToken(res.accessToken);
        onShowToast('Google Sign-In Berhasil', `Terhubung sebagai ${res.user.email}`, 'success');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      onShowToast('Login Gagal', err.message || 'Gagal masuk dengan akun Google.', 'error');
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  // Handle Google Logout
  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setGoogleAccessToken(null);
    onShowToast('Google Disconnect', 'Tautan akun Google telah dilepas.', 'info');
  };

  // Handle Create New Spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    if (!googleAccessToken) {
      onShowToast('Memerlukan Login', 'Silakan masuk dengan akun Google Anda terlebih dahulu.', 'warning');
      return;
    }

    setIsCreatingSheet(true);
    try {
      const title = `Rekap Absensi Siswa - ${settings.schoolName} (${settings.academicYear})`;
      const result = await createGoogleSpreadsheet(googleAccessToken, title);
      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);
      safeSetItem('absensi_google_spreadsheet_id', result.spreadsheetId);
      safeSetItem('absensi_google_spreadsheet_url', result.spreadsheetUrl);
      onShowToast('Spreadsheet Dibuat', 'Google Spreadsheet baru berhasil dibuat di Google Drive Anda!', 'success');
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      onShowToast('Gagal Membuat Sheet', err.message || 'Tidak dapat membuat Google Spreadsheet.', 'error');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Handle Export to Google Sheets
  const handleSyncToGoogleSheets = async () => {
    if (!googleAccessToken) {
      onShowToast('Memerlukan Login', 'Silakan masuk dengan akun Google terlebih dahulu.', 'warning');
      return;
    }

    if (!spreadsheetId.trim()) {
      onShowToast('Spreadsheet Belum Dipilih', 'Buat spreadsheet baru atau masukkan ID Spreadsheet.', 'warning');
      return;
    }

    const confirmSync = window.confirm(
      `Ekspor ${attendanceRecords.length} data absensi & ${students.length} data siswa ke Google Spreadsheet?`
    );
    if (!confirmSync) return;

    setIsExportingSheets(true);
    try {
      const res = await exportToGoogleSheets(
        googleAccessToken,
        spreadsheetId.trim(),
        students,
        attendanceRecords,
        settings.schoolName
      );

      if (res.success) {
        if (res.spreadsheetUrl) {
          setSpreadsheetUrl(res.spreadsheetUrl);
          safeSetItem('absensi_google_spreadsheet_url', res.spreadsheetUrl);
        }
        safeSetItem('absensi_google_spreadsheet_id', spreadsheetId.trim());
        onShowToast('Ekspor Google Sheets Berhasil!', res.message, 'success');
      } else {
        onShowToast('Gagal Ekspor Google Sheets', res.message, 'error');
      }
    } catch (err: any) {
      console.error('Error exporting to Google Sheets:', err);
      onShowToast('Gagal Ekspor', err.message || 'Terjadi masalah saat sinkronisasi Google Sheets.', 'error');
    } finally {
      setIsExportingSheets(false);
    }
  };

  // Handle Save to Cloud
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    const result = await saveToCloudSync(syncCode, {
      students,
      attendanceRecords,
      settings,
      teachers,
    });
    setIsSaving(false);

    if (result.success) {
      setLastSyncTime(result.syncedAt);
      onShowToast('Cloud Sync Berhasil', result.message, 'success');
    } else {
      onShowToast('Cloud Sync Gagal', result.message, 'error');
    }
  };

  // Handle Load from Cloud using Code
  const handleLoadFromCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSyncCode.trim()) return;

    setIsLoadingCloud(true);
    const result = await fetchFromCloudSync(inputSyncCode.trim());
    setIsLoadingCloud(false);

    if (result.success && result.payload) {
      if (
        confirm(
          `Memuat data dari Cloud (${result.payload.students.length} Siswa, ${result.payload.attendanceRecords.length} Catatan Absensi)? Data lokal Anda akan diperbarui.`
        )
      ) {
        onRestoreData({
          students: result.payload.students,
          attendanceRecords: result.payload.attendanceRecords,
          settings: result.payload.settings || settings,
          teachers: result.payload.teachers || teachers,
        });
        safeSetItem('absensi_active_sync_code', result.payload.syncCode);
        safeSetItem('absensi_last_cloud_sync_time', result.payload.lastSyncedAt);
        setSyncCode(result.payload.syncCode);
        setLastSyncTime(result.payload.lastSyncedAt);
        onShowToast('Restorasi Cloud Berhasil', result.message, 'success');
        onClose();
      }
    } else {
      onShowToast('Gagal Memuat Cloud', result.message, 'error');
    }
  };

  // Handle Restore from File JSON Upload
  const handleJSONFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.students && json.attendanceRecords) {
          if (
            confirm(
              `Restorasi database dari file JSON (${json.students.length} Siswa, ${json.attendanceRecords.length} Catatan Absensi)?`
            )
          ) {
            onRestoreData({
              students: json.students,
              attendanceRecords: json.attendanceRecords,
              settings: json.settings || settings,
              teachers: json.teachers || teachers,
            });
            onShowToast(
              'Restorasi File Berhasil',
              `Database berhasil dimuat dari file backup JSON.`,
              'success'
            );
            onClose();
          }
        } else {
          onShowToast('File Tidak Valid', 'Format file JSON backup tidak sesuai.', 'error');
        }
      } catch (err) {
        console.error('Error parsing JSON backup:', err);
        onShowToast('Gagal Membaca File', 'File terkorupsi atau bukan format JSON valid.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-scale-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 cursor-pointer rounded-full hover:bg-slate-100"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black shrink-0">
            <i className="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Cloud Sync & Backup Lintas Perangkat</h3>
            <p className="text-xs text-slate-500">
              Sinkronkan data ke Cloud, ekspor laporan Excel, dan amankan database sekolah.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'sync' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-rotate"></i>
            <span>Sinkron Cloud</span>
          </button>
          <button
            onClick={() => setActiveTab('gsheets')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'gsheets' ? 'bg-white text-emerald-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-file-csv text-emerald-600"></i>
            <span>Google Sheets</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'backup' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-file-excel"></i>
            <span>Ekspor File</span>
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'restore' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-file-import"></i>
            <span>Restorasi</span>
          </button>
        </div>

        {/* TAB GOOGLE SHEETS */}
        {activeTab === 'gsheets' && (
          <div className="space-y-4">
            {/* Google Authentication Box */}
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-2xs">
                    <i className="fa-solid fa-table"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950">Integrasi Google Sheets Realtime</h4>
                    <p className="text-[10px] text-emerald-800">Simpan otomatis rekap absensi ke Google Drive Anda</p>
                  </div>
                </div>
              </div>

              {!googleUser ? (
                <div className="pt-1">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoggingInGoogle}
                    className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isLoggingInGoogle ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {googleUser.photoURL ? (
                      <img src={googleUser.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        {googleUser.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{googleUser.displayName || 'Akun Google'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{googleUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGoogleLogout}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Spreadsheet Actions */}
            {googleUser && (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">ID Spreadsheet Google Drive:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Masukkan Spreadsheet ID (atau buat baru)"
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-medium focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleCreateNewSpreadsheet}
                      disabled={isCreatingSheet}
                      className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                      title="Buat Spreadsheet Baru"
                    >
                      <i className={`fa-solid ${isCreatingSheet ? 'fa-spinner fa-spin' : 'fa-plus'}`}></i>
                      <span>{isCreatingSheet ? 'Membuat...' : 'Buat Baru'}</span>
                    </button>
                  </div>
                </div>

                {spreadsheetUrl && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 font-medium">
                    <span className="truncate">Spreadsheet Aktif Terhubung</span>
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-extrabold text-emerald-700 hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>Buka Sheet</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    </a>
                  </div>
                )}

                <button
                  onClick={handleSyncToGoogleSheets}
                  disabled={isExportingSheets || !spreadsheetId}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <i className={`fa-solid ${isExportingSheets ? 'fa-spinner fa-spin' : 'fa-file-export'}`}></i>
                  <span>{isExportingSheets ? 'Mengekspor Data...' : 'Ekspor & Sync Data Ke Google Sheets'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: CLOUD SYNC */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Kode Sync Sekolah Anda:</span>
                <button
                  onClick={() => {
                    const newCode = generateSyncCode();
                    setSyncCode(newCode);
                  }}
                  className="text-[10px] text-indigo-700 underline font-bold hover:text-indigo-900 cursor-pointer"
                >
                  Acak Kode Baru
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-black text-indigo-700 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 tracking-wider flex-1 text-center shadow-2xs">
                  {syncCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(syncCode);
                    onShowToast('Kode Disalin', `Kode Sync ${syncCode} berhasil disalin.`, 'info');
                  }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  title="Salin Kode Sync"
                >
                  <i className="fa-solid fa-copy"></i>
                </button>
              </div>
              <p className="text-[11px] text-indigo-800">
                Gunakan Kode Sync ini untuk menghubungkan atau memuat data di laptop/HP guru lain.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
              <span>Terakhir Disinkronkan:</span>
              <span className="font-mono font-bold text-slate-800">{lastSyncTime}</span>
            </div>

            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
              <span>{isSaving ? 'Menyimpan ke Cloud...' : 'Simpan / Sinkronkan Data Sekarang'}</span>
            </button>
          </div>
        )}

        {/* TAB 2: EXPORT EXCEL & JSON */}
        {activeTab === 'backup' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Unduh laporan absensi atau daftar siswa langsung ke format file Excel (.csv) atau buat file cadangan JSON:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  exportAttendanceToCSV(attendanceRecords);
                  onShowToast('Ekspor Berhasil', 'File Excel Rekap Absensi berhasil diunduh.', 'success');
                }}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-3 transition-all cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs">
                  <i className="fa-solid fa-file-excel"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black">Unduh Excel Absensi</h4>
                  <p className="text-[10px] text-emerald-700 font-medium">Format .csv kompatibel MS Excel</p>
                </div>
              </button>

              <button
                onClick={() => {
                  exportStudentsToCSV(students);
                  onShowToast('Ekspor Berhasil', 'File Excel Data Siswa berhasil diunduh.', 'success');
                }}
                className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-blue-800 flex items-center gap-3 transition-all cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs">
                  <i className="fa-solid fa-users-gear"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black">Unduh Excel Siswa</h4>
                  <p className="text-[10px] text-blue-700 font-medium">Daftar siswa & nomor HP ortu</p>
                </div>
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <button
                onClick={() => {
                  exportFullBackupJSON(students, attendanceRecords, settings, teachers);
                  onShowToast('Backup JSON Dibuat', 'File cadangan penuh database tersimpan.', 'success');
                }}
                className="w-full p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-slate-800 flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <i className="fa-solid fa-database text-indigo-600"></i>
                  <span>Unduh File Backup Database Penuh (.json)</span>
                </div>
                <i className="fa-solid fa-download text-xs text-slate-400"></i>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: RESTORE DATA */}
        {activeTab === 'restore' && (
          <div className="space-y-4">
            {/* Quick Restore SDK Ogomojolo Banner */}
            <div className="p-3.5 bg-linear-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-base font-bold shrink-0 shadow-xs">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-emerald-950">
                      Cadangan SDK Ogomojolo Ditemukan!
                    </h4>
                    <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-mono">
                      SD-3NGT6
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-snug">
                    Tersedia cadangan awan lengkap <strong>132 Siswa</strong>, <strong>9 Guru</strong>, dan profil <strong>SDN KECIL OGOMOJOLO</strong>.
                  </p>
                  <button
                    type="button"
                    disabled={isLoadingCloud}
                    onClick={async () => {
                      setInputSyncCode('SD-3NGT6');
                      setIsLoadingCloud(true);
                      const result = await fetchFromCloudSync('SD-3NGT6');
                      setIsLoadingCloud(false);
                      if (result.success && result.payload) {
                        if (
                          confirm(
                            `Pulihkan seluruh data SDK Ogomojolo (${result.payload.students.length} Siswa, ${result.payload.teachers.length} Guru, dan Pengaturan Sekolah)?`
                          )
                        ) {
                          onRestoreData({
                            students: result.payload.students,
                            attendanceRecords: result.payload.attendanceRecords,
                            settings: result.payload.settings || settings,
                            teachers: result.payload.teachers || teachers,
                          });
                          safeSetItem('absensi_active_sync_code', 'SD-3NGT6');
                          safeSetItem('absensi_last_cloud_sync_time', result.payload.lastSyncedAt);
                          setSyncCode('SD-3NGT6');
                          setLastSyncTime(result.payload.lastSyncedAt);
                          onShowToast('Data Ogomojolo Berhasil Dipulihkan!', `Berhasil mengembalikan 132 data siswa dan profil SDN Kecil Ogomojolo.`, 'success');
                          onClose();
                        }
                      } else {
                        onShowToast('Gagal Memulihkan', result.message, 'error');
                      }
                    }}
                    className="mt-2.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <i className={`fa-solid ${isLoadingCloud ? 'fa-spinner fa-spin' : 'fa-rotate-left'}`}></i>
                    <span>{isLoadingCloud ? 'Memulihkan...' : 'Klik untuk Pulihkan Data Ogomojolo'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Restore via Sync Code */}
            <form onSubmit={handleLoadFromCloud} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Opsi 1: Muat Data dari Cloud Kode Sync
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: SD-3NGT6"
                  value={inputSyncCode}
                  onChange={(e) => setInputSyncCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isLoadingCloud}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isLoadingCloud ? 'Memuat...' : 'Tarik Data'}
                </button>
              </div>
            </form>

            <div className="relative border-t border-slate-100 pt-3">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Opsi 2: Restorasi dari File Backup (.json)
              </label>
              <label className="flex items-center justify-center gap-2 w-full p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer transition-all text-xs font-bold text-slate-700">
                <i className="fa-solid fa-file-arrow-up text-indigo-600 text-sm"></i>
                <span>Pilih File Backup Database (.json)</span>
                <input type="file" accept=".json" onChange={handleJSONFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
