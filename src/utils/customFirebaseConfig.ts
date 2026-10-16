import { initializeApp, deleteApp } from 'firebase/app';
import {
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { safeGetItem, safeSetItem, safeRemoveItem } from './storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
  measurementId?: string;
}

export interface ParsedConfigResult {
  config: FirebaseConfig | null;
  error: string | null;
  missingFields: string[];
  detectedType: 'javascript' | 'json' | 'manual' | null;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  rawError?: string;
  projectId?: string;
}

export const BYO_FIREBASE_STORAGE_KEYS = {
  CONFIG: 'absensi_byo_firebase_config_v2',
  ENABLED: 'absensi_byo_firebase_enabled_v2',
};

/**
 * Intelligent parser that extracts Firebase configuration from:
 * 1. Pure JSON: { "apiKey": "...", "projectId": "..." }
 * 2. Firebase Console JavaScript snippet:
 *    const firebaseConfig = {
 *      apiKey: "AIzaSy...",
 *      authDomain: "my-school.firebaseapp.com",
 *      projectId: "my-school",
 *      ...
 *    };
 * 3. Loose JS object syntax with single quotes, trailing commas, and unquoted keys.
 */
export function parseFirebaseConfigInput(rawInput: string): ParsedConfigResult {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      config: null,
      error: 'Teks konfigurasi tidak boleh kosong.',
      missingFields: ['apiKey', 'projectId', 'appId'],
      detectedType: null,
    };
  }

  const cleanText = rawInput
    // Remove single line comments // ...
    .replace(/\/\/[^\n\r]*/g, '')
    // Remove multi-line comments /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  let detectedType: 'javascript' | 'json' | 'manual' | null = null;
  if (/const\s+firebaseConfig|var\s+firebaseConfig|let\s+firebaseConfig/i.test(cleanText)) {
    detectedType = 'javascript';
  } else if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
    detectedType = 'json';
  } else {
    detectedType = 'manual';
  }

  // Regex extractor for Firebase config properties
  // Handles keys with or without quotes, followed by colon, and single or double-quoted values
  const extractField = (fieldName: string): string => {
    const patterns = [
      // Standard key: "value" or key: 'value'
      new RegExp(`["']?${fieldName}["']?\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, 'i'),
      // Fallback for unquoted simple strings
      new RegExp(`["']?${fieldName}["']?\\s*:\\s*([a-zA-Z0-9_-]+)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  };

  // Try JSON parse if possible
  let jsonParsed: any = null;
  try {
    // Attempt to isolate object enclosed in { ... }
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const objectString = cleanText.substring(firstBrace, lastBrace + 1);
      // Normalize unquoted keys to valid JSON format
      const normalizedJson = objectString
        .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
        .replace(/:\s*['`]([^'`]*)['`]/g, ':"$1"')
        .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
      jsonParsed = JSON.parse(normalizedJson);
    }
  } catch {
    // If JSON parsing fails, regex fallback handles it reliably
  }

  const apiKey = jsonParsed?.apiKey || extractField('apiKey');
  const authDomain = jsonParsed?.authDomain || extractField('authDomain');
  const projectId = jsonParsed?.projectId || extractField('projectId');
  const storageBucket = jsonParsed?.storageBucket || extractField('storageBucket');
  const messagingSenderId = jsonParsed?.messagingSenderId || extractField('messagingSenderId');
  const appId = jsonParsed?.appId || extractField('appId');
  const firestoreDatabaseId = jsonParsed?.firestoreDatabaseId || extractField('firestoreDatabaseId') || extractField('databaseId');
  const measurementId = jsonParsed?.measurementId || extractField('measurementId');

  const missingFields: string[] = [];
  if (!apiKey) missingFields.push('apiKey');
  if (!projectId) missingFields.push('projectId');
  if (!appId) missingFields.push('appId');

  if (missingFields.length > 0) {
    return {
      config: null,
      error: `Konfigurasi belum lengkap. Parameter penting berikut tidak ditemukan: ${missingFields.join(', ')}. Pastikan Anda menyalin seluruh baris konfigurasi Firebase.`,
      missingFields,
      detectedType,
    };
  }

  const finalConfig: FirebaseConfig = {
    apiKey: apiKey.trim(),
    authDomain: (authDomain || `${projectId.trim()}.firebaseapp.com`).trim(),
    projectId: projectId.trim(),
    storageBucket: storageBucket ? storageBucket.trim() : `${projectId.trim()}.firebasestorage.app`,
    messagingSenderId: messagingSenderId ? messagingSenderId.trim() : undefined,
    appId: appId.trim(),
    firestoreDatabaseId: firestoreDatabaseId ? firestoreDatabaseId.trim() : undefined,
    measurementId: measurementId ? measurementId.trim() : undefined,
  };

  return {
    config: finalConfig,
    error: null,
    missingFields: [],
    detectedType,
  };
}

/**
 * Retrieves the stored custom Firebase configuration from localStorage.
 */
export function getStoredCustomFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = safeGetItem(BYO_FIREBASE_STORAGE_KEYS.CONFIG);
    if (!raw) return null;
    const parsed: FirebaseConfig = JSON.parse(raw);
    if (parsed && parsed.apiKey && parsed.projectId && parsed.appId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if the custom BYO Firebase configuration is active and enabled.
 */
export function isCustomFirebaseEnabled(): boolean {
  try {
    const enabled = safeGetItem(BYO_FIREBASE_STORAGE_KEYS.ENABLED);
    return enabled === 'true' && getStoredCustomFirebaseConfig() !== null;
  } catch {
    return false;
  }
}

/**
 * Saves custom Firebase configuration to localStorage.
 */
export function saveCustomFirebaseConfig(config: FirebaseConfig, enable: boolean = true): void {
  safeSetItem(BYO_FIREBASE_STORAGE_KEYS.CONFIG, JSON.stringify(config));
  safeSetItem(BYO_FIREBASE_STORAGE_KEYS.ENABLED, enable ? 'true' : 'false');
}

/**
 * Sets whether custom Firebase is active.
 */
export function setCustomFirebaseEnabled(enabled: boolean): void {
  safeSetItem(BYO_FIREBASE_STORAGE_KEYS.ENABLED, enabled ? 'true' : 'false');
}

/**
 * Completely clears custom Firebase configuration from localStorage and resets to default.
 */
export function clearCustomFirebaseConfig(): void {
  safeRemoveItem(BYO_FIREBASE_STORAGE_KEYS.CONFIG);
  safeRemoveItem(BYO_FIREBASE_STORAGE_KEYS.ENABLED);
}

/**
 * Tests connection to the custom Firestore database by writing and verifying a test ping document.
 * This directly checks:
 * 1. API Key validity
 * 2. Project ID existence
 * 3. Firestore Database provisioned status
 * 4. Read & Write Security Rules permission
 */
export async function testCustomFirebaseConnection(config: FirebaseConfig): Promise<ConnectionTestResult> {
  const testAppName = `byo-test-app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let testApp: any = null;

  try {
    testApp = initializeApp(
      {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      },
      testAppName
    );

    const testDb = config.firestoreDatabaseId
      ? initializeFirestore(
          testApp,
          {
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true,
          },
          config.firestoreDatabaseId
        )
      : initializeFirestore(testApp, {
          experimentalForceLongPolling: true,
          ignoreUndefinedProperties: true,
        });

    // Write a test document to test write permission
    const pingRef = doc(testDb, '_byo_test_connection', 'ping');
    const testTimestamp = new Date().toISOString();
    await setDoc(pingRef, {
      ping: true,
      time: testTimestamp,
      client: 'Aplikasi Absensi Siswa - BYO Database Tester',
      projectId: config.projectId,
    });

    // Read it back to test read permission
    const snap = await getDoc(pingRef);
    if (!snap.exists()) {
      throw new Error('Gagal membaca kembali data verifikasi dari Firestore.');
    }

    // Clean up test document
    try {
      await deleteDoc(pingRef);
    } catch {
      // Non-fatal if delete fails
    }

    return {
      success: true,
      message: 'Koneksi ke Firebase Berhasil! Database terverifikasi siap digunakan.',
      projectId: config.projectId,
    };
  } catch (err: any) {
    const rawError = err instanceof Error ? err.message : String(err);
    console.warn('BYO Firebase test connection failed:', rawError);

    let friendlyMessage = 'Gagal terhubung ke database Firebase.';

    const lower = rawError.toLowerCase();
    if (lower.includes('api-key-not-valid') || lower.includes('api key not valid') || lower.includes('invalid-api-key')) {
      friendlyMessage = 'API Key salah atau tidak valid. Silakan periksa kembali nilai "apiKey" dari Firebase Console.';
    } else if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
      friendlyMessage =
        'Rules Firestore belum diizinkan (Permission Denied). Buka tab Firestore Database > Rules di Firebase Console Anda, lalu atur rules menjadi: allow read, write: if true; (mode testing).';
    } else if (lower.includes('not-found') || lower.includes('project does not exist')) {
      friendlyMessage =
        'Project Firebase tidak ditemukan. Pastikan "projectId" Anda benar dan project belum dihapus.';
    } else if (
      lower.includes('unavailable') ||
      lower.includes('failed-precondition') ||
      lower.includes('database does not exist') ||
      lower.includes('the database (default) does not exist')
    ) {
      friendlyMessage =
        'Cloud Firestore belum diaktifkan pada project ini. Silakan buka Firebase Console > Build > Firestore Database > Klik tombol "Create Database".';
    } else if (lower.includes('network') || lower.includes('offline') || lower.includes('failed to fetch')) {
      friendlyMessage =
        'Koneksi internet bermasalah atau terhalang firewall/proxy. Periksa jaringan Anda dan coba lagi.';
    } else {
      friendlyMessage = `Terjadi kesalahan saat menguji Firebase: ${rawError}`;
    }

    return {
      success: false,
      message: friendlyMessage,
      rawError,
      projectId: config.projectId,
    };
  } finally {
    if (testApp) {
      try {
        await deleteApp(testApp);
      } catch {
        // App cleanup notice
      }
    }
  }
}
