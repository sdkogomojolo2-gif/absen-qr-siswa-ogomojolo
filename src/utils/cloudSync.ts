import { Student, AttendanceRecord, SystemSettings, Teacher } from '../types';
import {
  saveCloudSyncToFirestore,
  fetchCloudSyncFromFirestore,
  syncAllStudentsToFirestore,
  syncAllAttendanceToFirestore,
  syncAllTeachersToFirestore,
  saveSettingsToFirestore,
} from '../services/firestoreService';
import { safeSetItem, safeGetItem } from './storage';

export interface CloudSyncPayload {
  syncCode: string;
  lastSyncedAt: string;
  schoolName: string;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: SystemSettings;
  teachers: Teacher[];
}

const CLOUD_STORAGE_KEY_PREFIX = 'absensi_cloud_sync_code_';

/**
 * Generates a clean 6-digit uppercase Cloud Sync ID for the school
 */
export const generateSyncCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SD-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Saves current local database to Cloud/Sync Storage and Firestore
 */
export const saveToCloudSync = async (
  syncCode: string,
  data: {
    students: Student[];
    attendanceRecords: AttendanceRecord[];
    settings: SystemSettings;
    teachers: Teacher[];
  }
): Promise<{ success: boolean; syncedAt: string; message: string }> => {
  try {
    const cleanCode = (syncCode || generateSyncCode()).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') || generateSyncCode();
    
    const syncedAt = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const payload: CloudSyncPayload = {
      syncCode: cleanCode,
      lastSyncedAt: syncedAt,
      schoolName: data.settings?.schoolName || 'SD Negeri',
      students: Array.isArray(data.students) ? data.students : [],
      attendanceRecords: Array.isArray(data.attendanceRecords) ? data.attendanceRecords : [],
      settings: data.settings || {
        lateCutoffTime: '07:00',
        schoolName: 'SD Negeri',
        schoolAddress: '',
        academicYear: '2024/2025',
      },
      teachers: Array.isArray(data.teachers) ? data.teachers : [],
    };

    // Store in browser local storage as cache (safely handled against quota)
    safeSetItem(`${CLOUD_STORAGE_KEY_PREFIX}${payload.syncCode}`, JSON.stringify(payload));
    safeSetItem('absensi_active_sync_code', payload.syncCode);
    safeSetItem('absensi_last_cloud_sync_time', syncedAt);

    // Save snapshot to Firestore Cloud Database
    let firestoreSuccess = false;
    try {
      await saveCloudSyncToFirestore(payload);
      
      // Propagate data in parallel high-speed batches to main Firestore collections
      const syncTasks: Promise<void>[] = [];

      if (payload.students.length > 0) {
        syncTasks.push(syncAllStudentsToFirestore(payload.students));
      }
      if (payload.settings) {
        syncTasks.push(saveSettingsToFirestore(payload.settings));
      }
      if (payload.teachers.length > 0) {
        syncTasks.push(syncAllTeachersToFirestore(payload.teachers));
      }
      if (payload.attendanceRecords.length > 0) {
        syncTasks.push(syncAllAttendanceToFirestore(payload.attendanceRecords));
      }

      await Promise.all(syncTasks);
      firestoreSuccess = true;
    } catch (fsErr) {
      console.warn('Firestore primary sync warning:', fsErr);
    }

    return {
      success: true,
      syncedAt,
      message: firestoreSuccess
        ? `Sinkronisasi Cloud Berhasil! (${payload.students.length} Siswa, ${payload.attendanceRecords.length} Rekap Absensi tersimpan ke Firestore dengan Kode Sync: ${payload.syncCode})`
        : `Data tersimpan ke penyimpanan sinkronisasi lokal & siap terhubung ke Cloud (Kode: ${payload.syncCode})`,
    };
  } catch (err: any) {
    console.error('Cloud sync failed:', err);
    return {
      success: false,
      syncedAt: '',
      message: `Gagal melakukan sinkronisasi cloud: ${err?.message || 'Periksa koneksi internet Anda.'}`,
    };
  }
};

/**
 * Fetches database from Cloud/Sync Storage (Firestore first, localStorage fallback)
 */
export const fetchFromCloudSync = async (
  syncCode: string
): Promise<{ success: boolean; payload?: CloudSyncPayload; message: string }> => {
  const cleanCode = syncCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  if (!cleanCode) {
    return {
      success: false,
      message: 'Kode Sync tidak boleh kosong.',
    };
  }

  // Try Firestore first
  try {
    const firestorePayload = await fetchCloudSyncFromFirestore(cleanCode);
    if (firestorePayload && Array.isArray(firestorePayload.students)) {
      return {
        success: true,
        payload: firestorePayload,
        message: `Berhasil memuat data dari Firebase Cloud (${firestorePayload.students.length} Siswa, ${firestorePayload.attendanceRecords?.length || 0} Catatan Absensi)`,
      };
    }
  } catch (fsErr) {
    console.warn('Firestore fetch notice, checking local backup:', fsErr);
  }

  // Fallback to local storage
  try {
    const raw = safeGetItem(`${CLOUD_STORAGE_KEY_PREFIX}${cleanCode}`);
    if (!raw) {
      return {
        success: false,
        message: `Kode Sync "${cleanCode}" tidak ditemukan di Firebase Cloud Storage. Pastikan kode sudah benar.`,
      };
    }

    const payload: CloudSyncPayload = JSON.parse(raw);
    if (!payload.students || !payload.attendanceRecords) {
      return {
        success: false,
        message: 'Format data Cloud Sync tidak valid atau terkorupsi.',
      };
    }

    return {
      success: true,
      payload,
      message: `Berhasil memuat data dari Cadangan Lokal (${payload.students.length} Siswa, ${payload.attendanceRecords.length} Catatan Absensi)`,
    };
  } catch (err: any) {
    console.error('Failed to load from cloud:', err);
    return {
      success: false,
      message: `Gagal memproses data dari Cloud Sync: ${err?.message || 'Format tidak valid'}`,
    };
  }
};
