import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { Student, AttendanceRecord, SystemSettings, Teacher } from '../types';
import { parseQRPayload } from '../utils/qr';
import { playScanBeep } from '../utils/audio';
import { openWhatsAppNotification, copyWAMessageToClipboard } from '../utils/whatsapp';

interface ScannerTabProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: SystemSettings;
  teachers?: Teacher[];
  currentTeacher?: Teacher | null;
  onSelectTeacher?: (teacher: Teacher) => void;
  onRecordAttendance: (
    student: Student,
    scannedVia: 'QR Camera' | 'Manual Input' | 'Simulator',
    scanningTeacher?: Teacher | null
  ) => {
    record: AttendanceRecord;
    isDuplicate: boolean;
  };
}

export const ScannerTab: React.FC<ScannerTabProps> = ({
  students,
  settings,
  teachers = [],
  currentTeacher,
  onSelectTeacher,
  onRecordAttendance,
}) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>('');

  // Permission API state ('granted' | 'denied' | 'prompt')
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  // Manual payload/NIS input for testing without camera
  const [manualInput, setManualInput] = useState<string>('');

  // Scan Result Modal
  const [lastScanResult, setLastScanResult] = useState<{
    student: Student;
    record: AttendanceRecord;
    isDuplicate: boolean;
  } | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<{ [nis: string]: number }>({});
  const scannerContainerId = 'qr-reader-container';

  // Check Camera Permission quietly via Permissions API
  const checkCameraPermission = useCallback(async (): Promise<'granted' | 'denied' | 'prompt'> => {
    try {
      if (typeof window !== 'undefined' && navigator?.permissions?.query) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(result.state);
        
        result.onchange = () => {
          setPermissionState(result.state);
        };
        return result.state;
      }
    } catch {
      // Ignore permission query support errors
    }
    return 'prompt';
  }, []);

  // Process a scanned payload (from camera, file, or manual input) with scan throttling
  const processPayload = useCallback(
    (rawText: string, via: 'QR Camera' | 'Manual Input' | 'Simulator') => {
      const parsed = parseQRPayload(rawText);
      const cleanNis = parsed.nis.trim().toLowerCase();

      // Throttle camera scans for the same NIS (minimum 2.5s delay)
      if (via === 'QR Camera') {
        const lastTime = lastScannedTimeRef.current[cleanNis] || 0;
        const now = Date.now();
        if (now - lastTime < 2500) {
          return;
        }
        lastScannedTimeRef.current[cleanNis] = now;
      }

      const student = students.find(
        (s) => s.nis.toLowerCase() === cleanNis
      );

      if (!student) {
        playScanBeep(false);
        setScanError(`QR Code / NIS "${parsed.nis}" tidak ditemukan dalam database siswa.`);
        return;
      }

      setScanError('');
      const activeT =
        currentTeacher ||
        teachers.find((t) => t.role === 'admin' || t.teacherType === 'admin') ||
        teachers[0];
      const { record, isDuplicate } = onRecordAttendance(student, via, activeT);
      playScanBeep(!isDuplicate);
      setLastScanResult({ student, record, isDuplicate });
    },
    [students, onRecordAttendance, currentTeacher, teachers]
  );

  // Fetch camera devices silently without showing intrusive errors on load
  const loadCameraDevices = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !navigator?.mediaDevices) return;

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        if (!selectedCameraId) {
          setSelectedCameraId(devices[0].id);
        }
        setPermissionState('granted');
      }
    } catch {
      // Silently catch - user hasn't granted camera permissions yet
    }
  }, [selectedCameraId]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason || '');
      if (
        msg.includes('play() request was interrupted') ||
        msg.includes('media was removed from the document') ||
        msg.includes('The node to be removed is not a child')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    checkCameraPermission().then((status) => {
      if (status === 'granted') {
        loadCameraDevices();
      }
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);

      if (html5QrcodeRef.current) {
        try {
          if (html5QrcodeRef.current.isScanning) {
            html5QrcodeRef.current.stop().catch(() => {});
          }
          html5QrcodeRef.current.clear();
        } catch (e) {
          console.warn('Error during scanner cleanup:', e);
        }
        html5QrcodeRef.current = null;
      }
    };
  }, [checkCameraPermission, loadCameraDevices]);

  // Start Camera Scanning cleanly with fallbacks
  const startScanner = async () => {
    setScanError('');
    setIsStartingCamera(true);

    try {
      // Step 1: Explicitly request camera media stream first to trigger native browser prompt
      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
          setPermissionState('granted');
        } catch (userMediaErr: unknown) {
          const msg = userMediaErr instanceof Error ? userMediaErr.message : String(userMediaErr);
          if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
            setPermissionState('denied');
            setScanError('Akses kamera ditolak di browser. Mohon beri izin akses kamera di pengaturan browser Anda.');
            setIsStartingCamera(false);
            return;
          }
        }
      }

      // Step 2: Refresh camera list after permission is granted
      await loadCameraDevices();

      const containerEl = document.getElementById(scannerContainerId);
      if (!containerEl) {
        setScanError('Kontainer pemindai tidak ditemukan di layar.');
        setIsStartingCamera(false);
        return;
      }

      // Step 3: Stop & clear any existing scanner instance
      if (html5QrcodeRef.current) {
        try {
          if (html5QrcodeRef.current.isScanning) {
            await html5QrcodeRef.current.stop();
          }
          html5QrcodeRef.current.clear();
        } catch {
          // Ignore cleanup errors
        }
        html5QrcodeRef.current = null;
      }

      containerEl.innerHTML = '';

      // Step 4: Initialize Html5Qrcode
      const scanner = new Html5Qrcode(scannerContainerId);
      html5QrcodeRef.current = scanner;

      // Determine camera config with fallback options
      const cameraConfig = selectedCameraId || { facingMode: 'environment' };

      const qrConfig = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
      };

      try {
        await scanner.start(
          cameraConfig,
          qrConfig,
          (decodedText) => {
            processPayload(decodedText, 'QR Camera');
          },
          () => {}
        );
      } catch (firstErr) {
        console.warn('First camera start attempt failed, trying fallback constraint:', firstErr);
        // Fallback to basic video constraint if specific camera ID failed
        await scanner.start(
          { facingMode: 'user' },
          qrConfig,
          (decodedText) => {
            processPayload(decodedText, 'QR Camera');
          },
          () => {}
        );
      }

      setIsScanning(true);
      setPermissionState('granted');
      setScanError('');
    } catch (err: unknown) {
      console.warn('Failed to start scanner:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.toLowerCase().includes('notallowed') || errorMsg.toLowerCase().includes('denied')) {
        setPermissionState('denied');
        setScanError('Akses kamera diblokir. Izinkan akses kamera melalui ikon gembok di sebelah URL browser.');
      } else {
        setScanError(`Gagal membuka kamera (${errorMsg}). Anda dapat menggunakan fitur Unggah Gambar QR atau Input NIS Manual.`);
      }
      setIsScanning(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Stop Camera Scanning
  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn('Failed to stop scanner:', err);
      }
      html5QrcodeRef.current = null;
    }
    setIsScanning(false);

    const containerEl = document.getElementById(scannerContainerId);
    if (containerEl) {
      containerEl.innerHTML = '';
    }
  };

  // Upload & Scan QR Code from image file
  const handleQRFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanError('');

    try {
      // If camera is currently active, stop it before file scanning
      if (isScanning) {
        await stopScanner();
      }

      const tempScanner = new Html5Qrcode('qr-file-temp-container');
      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();

      if (decodedText) {
        processPayload(decodedText, 'QR Camera');
      } else {
        setScanError('Tidak dapat mendeteksi Kode QR dari gambar ini. Pastikan gambar QR terlihat jelas.');
      }
    } catch (err) {
      console.warn('Error reading QR file:', err);
      setScanError('Gagal membaca Kode QR pada file gambar. Pastikan gambar tidak buram dan fokus.');
    } finally {
      setIsProcessingFile(false);
      // Reset input value so user can re-upload same file if needed
      e.target.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processPayload(manualInput.trim(), 'Manual Input');
    setManualInput('');
  };

  return (
    <div className="space-y-6">
      {/* Hidden temporary element for file scanning */}
      <div id="qr-file-temp-container" className="hidden" />

      {/* Tab Title */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-camera-retro text-rose-600"></i>
            <span>Pemindai QR Code Presensi Siswa SD</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Arahkan Kartu QR Pelajar ke kamera, atau unggah foto QR untuk mencatat jam masuk secara otomatis.
          </p>
        </div>

        {/* Camera Selector & Start/Stop Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {cameras.length > 0 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              disabled={isScanning || isStartingCamera}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  📷 {cam.label || `Kamera ${cam.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          )}

          {!isScanning ? (
            <button
              onClick={startScanner}
              disabled={isStartingCamera}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <i className={`fa-solid ${isStartingCamera ? 'fa-spinner fa-spin' : 'fa-play'} text-xs`}></i>
              <span>{isStartingCamera ? 'Membuka Kamera...' : 'Mulai Kamera'}</span>
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <i className="fa-solid fa-stop text-xs"></i>
              <span>Hentikan Kamera</span>
            </button>
          )}

          {/* Open in new tab helper */}
          <a
            href={typeof window !== 'undefined' ? window.location.href : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all text-xs font-bold cursor-pointer"
            title="Buka Aplikasi di Tab Baru (Untuk Izin Kamera Lebih Stabil)"
          >
            <i className="fa-solid fa-up-right-from-square"></i>
          </a>
        </div>
      </div>

      {/* Active Teacher Banner */}
      {(() => {
        const activeT =
          currentTeacher ||
          teachers.find((t) => t.role === 'admin' || t.teacherType === 'admin') ||
          teachers[0];
        if (!activeT) return null;

        return (
          <div className="bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base font-bold shadow-xs shrink-0">
                <i className="fa-solid fa-chalkboard-user"></i>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Guru yang Sedang Bertugas Mengabsen:
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap mt-0.5">
                  <span>{activeT.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeT.teacherType === 'wali_kelas'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : activeT.teacherType === 'guru_mapel'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}
                  >
                    {activeT.teacherType === 'wali_kelas'
                      ? activeT.homeroomClass
                        ? `Wali ${activeT.homeroomClass}`
                        : 'Wali Kelas'
                      : activeT.teacherType === 'guru_mapel'
                      ? `Guru Mapel: ${activeT.subject}`
                      : 'Admin Sekolah'}
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Switch Teacher Selector */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {teachers && teachers.length > 0 && onSelectTeacher && (
                <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl shadow-2xs">
                  <label htmlFor="active-scanner-teacher-select" className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 whitespace-nowrap">
                    Ganti Guru:
                  </label>
                  <select
                    id="active-scanner-teacher-select"
                    value={activeT.id}
                    onChange={(e) => {
                      const selected = teachers.find((t) => t.id === e.target.value);
                      if (selected) onSelectTeacher(selected);
                    }}
                    className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                        {t.name} ({t.teacherType === 'wali_kelas' ? (t.homeroomClass ? `Wali ${t.homeroomClass}` : 'Wali Kelas') : t.teacherType === 'guru_mapel' ? `Mapel ${t.subject || ''}` : 'Admin'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interactive Scanner Area (2 Cols) */}
        <div className="lg:col-span-2 bento-card flex flex-col items-center">
          <div className="w-full max-w-md relative">
            {/* HTML5 QR Code Container Wrapper */}
            <div className="w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 min-h-[300px] flex items-center justify-center relative shadow-inner">
              {/* Dedicated empty DOM target for Html5Qrcode - React never places children inside this div */}
              <div id={scannerContainerId} className="w-full h-full min-h-[300px]" />

              {!isScanning && permissionState !== 'denied' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 z-10 bg-slate-900/95 pointer-events-auto">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-2xl border border-indigo-500/30">
                    <i className="fa-solid fa-qrcode"></i>
                  </div>
                  <h4 className="text-sm font-bold text-white">Kamera Siap Diaktifkan</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Klik tombol di bawah ini untuk memulai kamera webcam / HP Anda.
                  </p>
                  <button
                    onClick={startScanner}
                    disabled={isStartingCamera}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    <i className={`fa-solid ${isStartingCamera ? 'fa-spinner fa-spin' : 'fa-video'}`}></i>
                    <span>{isStartingCamera ? 'Memproses...' : 'Aktifkan Kamera Sekarang'}</span>
                  </button>
                </div>
              )}

              {/* Permission Denied UI Instruction Box */}
              {!isScanning && permissionState === 'denied' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 z-10 bg-slate-950/95 p-4 m-2 rounded-2xl border border-rose-500/40 pointer-events-auto">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl border border-rose-500/30 shadow-md">
                    <i className="fa-solid fa-video-slash"></i>
                  </div>
                  <h4 className="text-sm font-extrabold text-white">Izin Kamera Ditolak / Diblokir</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Browser Anda memblokir akses ke kamera web. Untuk mengaktifkannya:
                  </p>
                  <ol className="text-[11px] text-slate-400 text-left max-w-xs mx-auto space-y-1 list-decimal pl-4 font-medium">
                    <li>Klik ikon <strong>gembok / camera</strong> di sebelah kiri URL browser.</li>
                    <li>Ubah setelan <strong>Camera</strong> menjadi <strong>Allow (Izinkan)</strong>.</li>
                    <li>Klik tombol di bawah untuk mencoba ulang.</li>
                  </ol>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={startScanner}
                      disabled={isStartingCamera}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      <i className="fa-solid fa-rotate-right"></i>
                      <span>Coba Ulang Kamera</span>
                    </button>

                    <a
                      href={typeof window !== 'undefined' ? window.location.href : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Buka di Tab Baru</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Error banner */}
            {scanError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 font-medium">
                <i className="fa-solid fa-circle-exclamation text-rose-600 text-sm mt-0.5"></i>
                <div className="flex-1">
                  <span>{scanError}</span>
                  {permissionState === 'denied' && (
                    <button
                      onClick={startScanner}
                      className="block mt-1 text-xs font-bold text-rose-800 underline hover:text-rose-950 cursor-pointer"
                    >
                      Coba Ulang Akses Kamera &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Option: Upload Image File QR */}
          <div className="mt-5 w-full max-w-md bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold">
                <i className="fa-solid fa-file-image"></i>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Unggah Gambar QR / Kartu</h4>
                <p className="text-[10px] text-slate-500">Pindai dari foto galeri tanpa menggunakan kamera live</p>
              </div>
            </div>

            <label className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0">
              <i className={`fa-solid ${isProcessingFile ? 'fa-spinner fa-spin' : 'fa-upload'} text-xs`}></i>
              <span>{isProcessingFile ? 'Membaca...' : 'Pilih Foto'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleQRFileUpload}
                disabled={isProcessingFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick instructions */}
          <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-lg text-center text-xs text-slate-600">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <i className="fa-solid fa-bolt text-amber-600 text-sm mb-1 block"></i>
              <span className="font-semibold">Auto Focus QR</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <i className="fa-solid fa-bell text-emerald-600 text-sm mb-1 block"></i>
              <span className="font-semibold">Audio Beep</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <i className="fa-solid fa-shield-halved text-indigo-600 text-sm mb-1 block"></i>
              <span className="font-semibold">Anti Duplikasi</span>
            </div>
          </div>
        </div>

        {/* Alternative Manual NIS/QR Tester Box (1 Col) */}
        <div className="space-y-6">
          <div className="bento-card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">
                <i className="fa-solid fa-keyboard"></i>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Input NIS Manual (Tanpa Kamera)</h3>
                <p className="text-[11px] text-slate-500">Ketik NIS siswa untuk mencatat absensi</p>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Input Nomor Induk Siswa (NIS)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Contoh: 1001"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Proses
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                * Alternatif cepat jika webcam laptop/HP tidak tersedia.
              </p>
            </form>

            {/* List of sample NIS for fast testing */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-500 block mb-2">
                Pilih NIS Siswa SD Siap Diuji:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {students.slice(0, 6).map((std) => (
                  <button
                    key={std.id}
                    onClick={() => {
                      setManualInput(std.nis);
                      processPayload(std.nis, 'Manual Input');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-lg text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 font-bold"
                  >
                    <span>{std.nis}</span>
                    <span className="text-[9px] text-slate-400 font-normal">({std.name.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Scan Feedback Popup Modal */}
      {lastScanResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-center space-y-4 animate-scale-up">
            <button
              onClick={() => setLastScanResult(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            {/* Header Status Badge */}
            <div>
              {lastScanResult.isDuplicate ? (
                <span className="status-badge status-late">
                  <i className="fa-solid fa-triangle-exclamation"></i> SUDAH ABSEN HARI INI
                </span>
              ) : lastScanResult.record.status === 'Hadir' ? (
                <span className="status-badge status-present">
                  <i className="fa-solid fa-circle-check"></i> HADIR TEPAT WAKTU
                </span>
              ) : (
                <span className="status-badge status-late">
                  <i className="fa-solid fa-clock"></i> TERLAMBAT
                </span>
              )}
            </div>

            {/* Student Card Info */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <img
                src={lastScanResult.student.photo || lastScanResult.student.avatarUrl}
                alt={lastScanResult.student.name}
                className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-indigo-500/20 shadow-md bg-slate-200"
              />
              <div>
                <h3 className="text-lg font-black text-slate-900">{lastScanResult.student.name}</h3>
                <p className="text-xs text-slate-500 font-mono font-semibold">
                  NIS: {lastScanResult.student.nis} • Kelas {lastScanResult.student.classRoom}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl text-left text-xs border border-slate-200 shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Jam Masuk</span>
                  <span className="font-mono font-extrabold text-emerald-600">
                    {lastScanResult.record.time} WIB
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Metode</span>
                  <span className="font-semibold text-slate-700">
                    {lastScanResult.record.scannedVia}
                  </span>
                </div>
              </div>

              {/* WhatsApp Notification Action Box */}
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                <button
                  onClick={() =>
                    openWhatsAppNotification(
                      lastScanResult.student,
                      lastScanResult.record,
                      settings.schoolName
                    )
                  }
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <i className="fa-brands fa-whatsapp text-sm"></i>
                  <span>Kirim WA Notifikasi ke Orang Tua</span>
                </button>

                <button
                  onClick={async () => {
                    const ok = await copyWAMessageToClipboard(
                      lastScanResult.student,
                      lastScanResult.record,
                      settings.schoolName
                    );
                    if (ok) {
                      alert('Pesan WA berhasil disalin ke clipboard!');
                    }
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  <i className="fa-regular fa-copy mr-1"></i>
                  Salin Teks Pesan WA
                </button>
              </div>
            </div>

            <button
              onClick={() => setLastScanResult(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Lanjutkan Pemindaian
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
