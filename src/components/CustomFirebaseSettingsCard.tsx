import React, { useState, useEffect } from 'react';
import {
  FirebaseConfig,
  parseFirebaseConfigInput,
  getStoredCustomFirebaseConfig,
  isCustomFirebaseEnabled,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  testCustomFirebaseConnection,
  setCustomFirebaseEnabled,
} from '../utils/customFirebaseConfig';
import { reinitializeFirebaseWithConfig, getActiveFirebaseProject } from '../firebase';
import { syncAllCurrentDataToCustomFirestore } from '../services/firestoreService';
import { Student, AttendanceRecord, SystemSettings, Teacher, ScheduledLeave, BehaviorLog } from '../types';

interface CustomFirebaseSettingsCardProps {
  students: Student[];
  teachers: Teacher[];
  settings: SystemSettings;
  attendanceRecords: AttendanceRecord[];
  scheduledLeaves?: ScheduledLeave[];
  behaviorLogs?: BehaviorLog[];
  onNotify?: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  onFirebaseUpdated?: (isCustom: boolean, projectId: string) => void;
}

export const CustomFirebaseSettingsCard: React.FC<CustomFirebaseSettingsCardProps> = ({
  students,
  teachers,
  settings,
  attendanceRecords,
  scheduledLeaves = [],
  behaviorLogs = [],
  onNotify,
  onFirebaseUpdated,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => isCustomFirebaseEnabled());
  const [configInputText, setConfigInputText] = useState<string>('');
  const [activeConfig, setActiveConfig] = useState<FirebaseConfig | null>(() => getStoredCustomFirebaseConfig());
  
  // Testing & Saving states
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    rawError?: string;
  }>({ status: 'idle', message: '' });

  // Guide accordion toggle
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Initialize input text if stored config exists
  useEffect(() => {
    const stored = getStoredCustomFirebaseConfig();
    if (stored) {
      setActiveConfig(stored);
      if (!configInputText) {
        setConfigInputText(JSON.stringify(stored, null, 2));
      }
    }
    setIsEnabled(isCustomFirebaseEnabled());
  }, []);

  // Parse current text input dynamically
  const parseResult = React.useMemo(() => {
    if (!configInputText.trim()) return null;
    return parseFirebaseConfigInput(configInputText);
  }, [configInputText]);

  // Handle Switch Toggle
  const handleToggleSwitch = async () => {
    const nextState = !isEnabled;
    if (nextState) {
      // User wants to enable custom Firebase
      if (activeConfig) {
        setCustomFirebaseEnabled(true);
        setIsEnabled(true);
        await reinitializeFirebaseWithConfig(activeConfig);
        onNotify?.(
          'Firebase Pribadi Diaktifkan',
          `Aplikasi kini terhubung ke database cloud Anda (${activeConfig.projectId}).`,
          'success'
        );
        onFirebaseUpdated?.(true, activeConfig.projectId);
      } else {
        setIsEnabled(true);
      }
    } else {
      // User toggles off -> switch back to default
      setCustomFirebaseEnabled(false);
      setIsEnabled(false);
      await reinitializeFirebaseWithConfig(null);
      const activeInfo = getActiveFirebaseProject();
      onNotify?.(
        'Kembali ke Database Default',
        'Aplikasi kini berjalan dengan database cloud bawaan sekolah.',
        'info'
      );
      onFirebaseUpdated?.(false, activeInfo.projectId);
    }
  };

  // Test Connection and Save
  const handleTestAndSave = async () => {
    if (!configInputText.trim()) {
      setTestResult({
        status: 'error',
        message: 'Silakan tempelkan konfigurasi Firebase terlebih dahulu.',
      });
      return;
    }

    const parsed = parseFirebaseConfigInput(configInputText);
    if (!parsed.config) {
      setTestResult({
        status: 'error',
        message: parsed.error || 'Format konfigurasi Firebase tidak valid.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult({ status: 'idle', message: '' });

    try {
      const result = await testCustomFirebaseConnection(parsed.config);
      if (result.success) {
        // Save to LocalStorage
        saveCustomFirebaseConfig(parsed.config, true);
        setActiveConfig(parsed.config);
        setIsEnabled(true);

        // Dynamically reinitialize the live app Firebase instance
        await reinitializeFirebaseWithConfig(parsed.config);

        setTestResult({
          status: 'success',
          message: 'Koneksi ke Firebase Berhasil! Konfigurasi tersimpan dan database cloud pribadi Anda kini aktif.',
        });

        onNotify?.(
          'Koneksi ke Firebase Berhasil!',
          `Database cloud pribadi (${parsed.config.projectId}) berhasil diverifikasi dan terhubung.`,
          'success'
        );

        onFirebaseUpdated?.(true, parsed.config.projectId);
      } else {
        setTestResult({
          status: 'error',
          message: result.message,
          rawError: result.rawError,
        });

        onNotify?.(
          'Tes Koneksi Firebase Gagal',
          result.message,
          'error'
        );
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Terjadi kesalahan tak terduga saat pengujian koneksi.';
      setTestResult({
        status: 'error',
        message: errMsg,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Reset to Default / Disconnect
  const handleResetToDefault = async () => {
    clearCustomFirebaseConfig();
    setActiveConfig(null);
    setIsEnabled(false);
    setConfigInputText('');
    setTestResult({ status: 'idle', message: '' });
    setShowDisconnectConfirm(false);

    await reinitializeFirebaseWithConfig(null);
    const activeInfo = getActiveFirebaseProject();

    onNotify?.(
      'Koneksi Diputuskan',
      'Database kustom telah dihapus. Sistem kembali ke konfigurasi cloud bawaan.',
      'info'
    );

    onFirebaseUpdated?.(false, activeInfo.projectId);
  };

  // Push current local dataset to newly connected custom Firebase
  const handleSyncCurrentDataToCloud = async () => {
    if (!activeConfig || !isEnabled) {
      alert('Harap hubungkan dan aktifkan database Firebase kustom terlebih dahulu.');
      return;
    }

    setIsSyncingData(true);
    try {
      const res = await syncAllCurrentDataToCustomFirestore({
        students,
        teachers,
        settings,
        attendanceRecords,
        leaves: scheduledLeaves,
        behaviorLogs,
      });

      if (res.success) {
        onNotify?.(
          'Sinkronisasi Berhasil',
          `Seluruh data (${students.length} siswa, ${attendanceRecords.length} presensi) berhasil disalin ke Firebase pribadi Anda.`,
          'success'
        );
      } else {
        onNotify?.(
          'Sinkronisasi Gagal',
          res.error || 'Gagal menyalin data ke Firestore.',
          'error'
        );
      }
    } catch (err: any) {
      onNotify?.(
        'Kesalahan Sinkronisasi',
        err?.message || 'Terjadi gangguan koneksi.',
        'error'
      );
    } finally {
      setIsSyncingData(false);
    }
  };

  const activeProjectInfo = getActiveFirebaseProject();

  return (
    <div className="bento-card border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a0305] space-y-4 shadow-sm">
      {/* Header section with icon and live badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center text-lg shrink-0 mt-0.5">
            <i className="fa-solid fa-cloud"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Database Cloud Pribadi (Firebase)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                BYO Database
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gunakan project Firebase milik sekolah Anda sendiri agar data terpisah, 100% mandiri, dan aman.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {isEnabled && activeConfig ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Terhubung: {activeConfig.projectId}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Mode Cloud Bawaan</span>
            </span>
          )}
        </div>
      </div>

      {/* Toggle Switch */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <div className="space-y-0.5 pr-4">
          <label htmlFor="byo-firebase-toggle" className="text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer">
            Gunakan Firebase Milik Sendiri
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Aktifkan koneksi langsung ke Firestore project pribadi Anda untuk menyimpan seluruh data siswa & presensi.
          </p>
        </div>

        <button
          id="byo-firebase-toggle"
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={handleToggleSwitch}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isEnabled ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Main Configuration Form Area */}
      <div className={`space-y-3 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-70'}`}>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Konfigurasi Firebase (JSON atau Kode JavaScript Firebase Console)</span>
            </label>
            {parseResult?.detectedType && (
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                Format Terdeteksi: {parseResult.detectedType === 'javascript' ? 'Kode JS Firebase Console' : 'JSON Object'}
              </span>
            )}
          </div>

          <textarea
            rows={6}
            value={configInputText}
            onChange={(e) => setConfigInputText(e.target.value)}
            placeholder={`// Tempelkan potongan kode dari Firebase Console di sini, contoh:
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "sekolah-anda.firebaseapp.com",
  projectId: "sekolah-anda-db",
  storageBucket: "sekolah-anda.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};`}
            className="w-full bg-slate-50 dark:bg-[#120102] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-[#1f0306] transition-all resize-y"
          ></textarea>
        </div>

        {/* Live Parsed Preview Chips */}
        {parseResult && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-microchip text-indigo-500"></i>
                <span>Hasil Ekstraksi Otomatis:</span>
              </span>
              {parseResult.config ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <i className="fa-solid fa-circle-check"></i> Parameter Lengkap
                </span>
              ) : (
                <span className="text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <i className="fa-solid fa-triangle-exclamation"></i> Parameter Belum Lengkap
                </span>
              )}
            </div>

            {parseResult.config ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[10.5px]">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[9.5px]">Project ID</span>
                  <strong className="text-slate-800 dark:text-white truncate block">{parseResult.config.projectId}</strong>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[9.5px]">Auth Domain</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate block font-mono">{parseResult.config.authDomain}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[9.5px]">API Key</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate block font-mono">
                    {parseResult.config.apiKey.substring(0, 8)}...{parseResult.config.apiKey.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-rose-600 dark:text-rose-400 leading-snug">
                {parseResult.error}
              </div>
            )}
          </div>
        )}

        {/* Test Result Alert Banner */}
        {testResult.status === 'success' && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-start gap-2.5 animate-fadeIn">
            <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 shrink-0"></i>
            <div className="space-y-0.5">
              <strong className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Koneksi ke Firebase Berhasil!
              </strong>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {testResult.message}
              </p>
            </div>
          </div>
        )}

        {testResult.status === 'error' && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-start gap-2.5 animate-fadeIn">
            <i className="fa-solid fa-circle-xmark text-rose-600 dark:text-rose-400 text-sm mt-0.5 shrink-0"></i>
            <div className="space-y-1">
              <strong className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Gagal Menghubungkan ke Firebase
              </strong>
              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                {testResult.message}
              </p>
              {testResult.rawError && (
                <span className="block font-mono text-[10px] text-rose-700/80 dark:text-rose-400/80 bg-rose-100/60 dark:bg-rose-900/40 p-1.5 rounded-lg overflow-x-auto">
                  Detail: {testResult.rawError}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleTestAndSave}
            disabled={isTesting}
            className="flex-1 min-w-[200px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isTesting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Menguji Koneksi Firestore...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-plug-circle-check"></i>
                <span>Tes Koneksi & Simpan</span>
              </>
            )}
          </button>

          {activeConfig && (
            <button
              type="button"
              onClick={() => setShowDisconnectConfirm(true)}
              className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-rotate-left"></i>
              <span>Reset ke Default / Putuskan</span>
            </button>
          )}

          {isEnabled && activeConfig && (
            <button
              type="button"
              onClick={handleSyncCurrentDataToCloud}
              disabled={isSyncingData}
              className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Salin seluruh data siswa dan absensi saat ini ke database Firebase pribadi Anda"
            >
              {isSyncingData ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Menyalin Data...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Salin Data Lokal ke Cloud Ini</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Accordion Guide: Cara Membuat Firebase Gratis */}
      <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden mt-3">
        <button
          type="button"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/70 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-question text-amber-500"></i>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Panduan Singkat: Cara Membuat Firebase Gratis (5 Menit)
            </span>
          </div>
          <i
            className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform duration-200 ${
              isGuideOpen ? 'rotate-180' : ''
            }`}
          ></i>
        </button>

        {isGuideOpen && (
          <div className="p-4 bg-white dark:bg-[#1a0305] text-xs text-slate-600 dark:text-slate-300 space-y-3.5 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-slate-900 dark:text-white">Buka Firebase Console:</strong>
                <p className="mt-0.5">
                  Buka{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 font-bold underline inline-flex items-center gap-1"
                  >
                    console.firebase.google.com <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                  </a>{' '}
                  dan login menggunakan akun Google Anda (Gratis Spark Plan).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-slate-900 dark:text-white">Buat Project Baru:</strong>
                <p className="mt-0.5">
                  Klik <strong>&quot;Add project&quot;</strong> (Tambahkan project), beri nama project sekolah Anda (misal: <em>sdn-ogomojolo-db</em>), lalu lanjutkan hingga project selesai dibuat.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-slate-900 dark:text-white">Buat Cloud Firestore:</strong>
                <p className="mt-0.5">
                  Di menu navigasi kiri, pilih <strong>Build &gt; Firestore Database</strong> &gt; Klik <strong>&quot;Create database&quot;</strong>. Pilih lokasi terdekat (misal: <code>asia-southeast2</code> Jakarta), lalu pilih <strong>&quot;Start in test mode&quot;</strong> agar izin baca/tulis terbuka.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <div>
                <strong className="text-slate-900 dark:text-white">Tambah Web App &amp; Salin Config:</strong>
                <p className="mt-0.5">
                  Klik ikon gerigi <strong>Project Settings</strong> (di samping Project Overview) &gt; Scroll ke bawah ke bagian <strong>&quot;Your apps&quot;</strong> &gt; Klik ikon Web <code>&lt;/&gt;</code> &gt; Beri nama aplikasi lalu klik <strong>Register app</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                5
              </span>
              <div>
                <strong className="text-slate-900 dark:text-white">Tempel &amp; Tes Koneksi:</strong>
                <p className="mt-0.5">
                  Salin seluruh blok kode <code>const firebaseConfig = &#123; ... &#125;;</code> yang ditampilkan, tempelkan langsung ke kotak teks di atas, lalu klik <strong>&quot;Tes Koneksi &amp; Simpan&quot;</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Putuskan Koneksi Firebase Pribadi?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Aplikasi akan kembali menggunakan database cloud bawaan. Konfigurasi kustom Anda akan dihapus dari penyimpanan lokal browser ini.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Ya, Putuskan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
