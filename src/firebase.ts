import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfigDefault from '../firebase-applet-config.json';

const activeFirebaseConfig = {
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || firebaseConfigDefault.projectId,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || firebaseConfigDefault.appId,
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || firebaseConfigDefault.apiKey,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigDefault.authDomain,
  firestoreDatabaseId: import.meta.env?.VITE_FIRESTORE_DATABASE_ID || (firebaseConfigDefault as any).firestoreDatabaseId,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfigDefault as any).storageBucket,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfigDefault as any).messagingSenderId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);

const databaseId = activeFirebaseConfig.firestoreDatabaseId?.trim() ? activeFirebaseConfig.firestoreDatabaseId.trim() : undefined;

// Initialize Firestore with forced long polling for robust cloud / iframe connectivity
let firestoreInstance;
try {
  firestoreInstance = databaseId
    ? initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
          ignoreUndefinedProperties: true,
        },
        databaseId
      )
    : initializeFirestore(app, {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
      });
} catch {
  firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

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
 * Validates connection to Firestore server
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

