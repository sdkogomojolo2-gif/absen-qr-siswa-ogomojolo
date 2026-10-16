import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfigDefault from '../firebase-applet-config.json';
import {
  FirebaseConfig,
  getStoredCustomFirebaseConfig,
  isCustomFirebaseEnabled,
} from './utils/customFirebaseConfig';

/**
 * Returns the default system Firebase configuration (from env or json).
 */
export function getDefaultFirebaseConfig(): FirebaseConfig {
  return {
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || firebaseConfigDefault.projectId,
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || firebaseConfigDefault.appId,
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || firebaseConfigDefault.apiKey,
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigDefault.authDomain,
    firestoreDatabaseId: import.meta.env?.VITE_FIRESTORE_DATABASE_ID || (firebaseConfigDefault as any).firestoreDatabaseId,
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfigDefault as any).storageBucket,
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfigDefault as any).messagingSenderId,
  };
}

/**
 * Determine active configuration on initial app bootstrap:
 * If custom BYO database is configured and enabled in localStorage, prefer it.
 */
function resolveInitialFirebaseConfig(): { config: FirebaseConfig; isCustom: boolean } {
  if (typeof window !== 'undefined' && isCustomFirebaseEnabled()) {
    const customConfig = getStoredCustomFirebaseConfig();
    if (customConfig && customConfig.projectId && customConfig.apiKey && customConfig.appId) {
      return { config: customConfig, isCustom: true };
    }
  }
  return { config: getDefaultFirebaseConfig(), isCustom: false };
}

const initialResolution = resolveInitialFirebaseConfig();
let activeFirebaseConfig: FirebaseConfig = initialResolution.config;
let isCustomActive = initialResolution.isCustom;

// Bootstrap initial Firebase App
let appInstance: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);

function createFirestoreInstance(targetApp: FirebaseApp, databaseId?: string): Firestore {
  const dbId = databaseId?.trim() ? databaseId.trim() : undefined;
  try {
    return dbId
      ? initializeFirestore(
          targetApp,
          {
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true,
          },
          dbId
        )
      : initializeFirestore(targetApp, {
          experimentalForceLongPolling: true,
          ignoreUndefinedProperties: true,
        });
  } catch {
    return dbId ? getFirestore(targetApp, dbId) : getFirestore(targetApp);
  }
}

let firestoreInstance: Firestore = createFirestoreInstance(appInstance, activeFirebaseConfig.firestoreDatabaseId);
let authInstance: Auth = getAuth(appInstance);

export let app: FirebaseApp = appInstance;
export let db: Firestore = firestoreInstance;
export let auth: Auth = authInstance;

export function getActiveDb(): Firestore {
  return db;
}

export function getActiveAuth(): Auth {
  return auth;
}

export function isUsingCustomFirebase(): boolean {
  return isCustomActive;
}

export function getActiveFirebaseProject(): { projectId: string; isCustom: boolean } {
  return {
    projectId: activeFirebaseConfig.projectId,
    isCustom: isCustomActive,
  };
}

// Subscribers list for dynamic Firebase App swapping
type FirebaseChangeListener = (newDb: Firestore, isCustom: boolean) => void;
const changeListeners = new Set<FirebaseChangeListener>();

export function onFirebaseChange(listener: FirebaseChangeListener): () => void {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

/**
 * Dynamically reconfigures and reinitializes the primary Firebase App instance.
 * Call this when a customer connects their own database or resets back to default.
 */
export async function reinitializeFirebaseWithConfig(customConfig?: FirebaseConfig | null): Promise<boolean> {
  try {
    const existingApps = getApps();
    for (const a of existingApps) {
      try {
        await deleteApp(a);
      } catch (e) {
        console.warn('Note while closing previous Firebase app instance:', e);
      }
    }

    if (customConfig && customConfig.projectId && customConfig.apiKey && customConfig.appId) {
      activeFirebaseConfig = customConfig;
      isCustomActive = true;
    } else {
      activeFirebaseConfig = getDefaultFirebaseConfig();
      isCustomActive = false;
    }

    app = initializeApp(activeFirebaseConfig);
    db = createFirestoreInstance(app, activeFirebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);

    // Notify registered listeners (App.tsx and sync services)
    changeListeners.forEach((listener) => {
      try {
        listener(db, isCustomActive);
      } catch (listenerErr) {
        console.error('Error invoking Firebase change listener:', listenerErr);
      }
    });

    console.info(`Firebase App reinitialized successfully. Active Project ID: ${activeFirebaseConfig.projectId} (Custom: ${isCustomActive})`);
    return true;
  } catch (error) {
    console.error('Failed to reinitialize Firebase instance:', error);
    return false;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to the active Firestore server
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('failed to connect')) {
      console.info('Firestore client is connecting or in offline cache mode.');
      return false;
    }
    // Expected if 'test/connection' does not exist but server responded
    return true;
  }
}
