import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Student, AttendanceRecord, SystemSettings, Teacher, ScheduledLeave, BehaviorLog } from '../types';
import { CloudSyncPayload } from '../utils/cloudSync';

/**
 * Sanitizes an object by converting undefined values to null or stripping them,
 * preventing Firestore "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (!obj) return obj;
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

// Collection Names
export const COLLECTIONS = {
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  TEACHERS: 'teachers',
  SETTINGS: 'settings',
  CLOUD_SYNC: 'cloud_sync',
  LEAVES: 'leaves',
  BEHAVIOR_LOGS: 'behavior_logs',
};

/**
 * Subscribes to real-time updates for Students
 */
export function subscribeToStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (err: any) => void
) {
  const path = COLLECTIONS.STUDENTS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Student[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Student);
      });
      onUpdate(items);
    },
    (error) => {
      console.warn(`Firestore real-time subscription notice (${path}):`, error?.message || error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves or updates a single student in Firestore
 */
export async function saveStudentToFirestore(student: Student): Promise<void> {
  const path = `${COLLECTIONS.STUDENTS}/${student.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(student));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a single student from Firestore
 */
export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  const path = `${COLLECTIONS.STUDENTS}/${studentId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Bulk deletes multiple students from Firestore in a batch
 */
export async function bulkDeleteStudentsFromFirestore(studentIds: string[]): Promise<void> {
  const path = COLLECTIONS.STUDENTS;
  try {
    const batch = writeBatch(db);
    studentIds.forEach((id) => {
      batch.delete(doc(db, COLLECTIONS.STUDENTS, id));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Bulk saves or overwrites students in Firestore in safe chunks (max 450 items per Firestore batch)
 */
export async function syncAllStudentsToFirestore(students: Student[]): Promise<void> {
  const path = COLLECTIONS.STUDENTS;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((std) => {
        const ref = doc(db, COLLECTIONS.STUDENTS, std.id);
        batch.set(ref, sanitizeForFirestore(std));
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Replaces all students in Firestore with a clean set, deleting orphaned students from previous schools
 */
export async function replaceFirestoreStudents(students: Student[]): Promise<void> {
  const path = COLLECTIONS.STUDENTS;
  try {
    const existingSnap = await getDocs(collection(db, path));
    const newIdSet = new Set(students.map((s) => s.id));
    const toDelete: string[] = [];

    existingSnap.forEach((docSnap) => {
      if (!newIdSet.has(docSnap.id)) {
        toDelete.push(docSnap.id);
      }
    });

    if (toDelete.length > 0) {
      const CHUNK_SIZE = 400;
      for (let i = 0; i < toDelete.length; i += CHUNK_SIZE) {
        const chunk = toDelete.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          batch.delete(doc(db, path, id));
        });
        await batch.commit();
      }
    }

    await syncAllStudentsToFirestore(students);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Bulk saves attendance records in safe chunks (max 400 per batch)
 */
export async function syncAllAttendanceToFirestore(records: AttendanceRecord[]): Promise<void> {
  const path = COLLECTIONS.ATTENDANCE;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((att) => {
        const ref = doc(db, COLLECTIONS.ATTENDANCE, att.id);
        batch.set(ref, sanitizeForFirestore(att));
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Bulk saves teachers in a single batch
 */
export async function syncAllTeachersToFirestore(teachers: Teacher[]): Promise<void> {
  const path = COLLECTIONS.TEACHERS;
  try {
    const batch = writeBatch(db);
    teachers.forEach((t) => {
      const ref = doc(db, COLLECTIONS.TEACHERS, t.id);
      batch.set(ref, sanitizeForFirestore(t));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to real-time updates for Attendance Records
 */
export function subscribeToAttendance(
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (err: any) => void
) {
  const path = COLLECTIONS.ATTENDANCE;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: AttendanceRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AttendanceRecord);
      });
      onUpdate(items);
    },
    (error) => {
      console.warn(`Firestore real-time subscription notice (${path}):`, error?.message || error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves a single attendance record
 */
export async function saveAttendanceToFirestore(record: AttendanceRecord): Promise<void> {
  const path = `${COLLECTIONS.ATTENDANCE}/${record.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ATTENDANCE, record.id), sanitizeForFirestore(record));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a single attendance record
 */
export async function deleteAttendanceFromFirestore(recordId: string): Promise<void> {
  const path = `${COLLECTIONS.ATTENDANCE}/${recordId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ATTENDANCE, recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time updates for Teachers
 */
export function subscribeToTeachers(
  onUpdate: (teachers: Teacher[]) => void,
  onError?: (err: any) => void
) {
  const path = COLLECTIONS.TEACHERS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Teacher[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Teacher);
      });
      onUpdate(items);
    },
    (error) => {
      console.warn(`Firestore real-time subscription notice (${path}):`, error?.message || error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves a teacher to Firestore
 */
export async function saveTeacherToFirestore(teacher: Teacher): Promise<void> {
  const path = `${COLLECTIONS.TEACHERS}/${teacher.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.TEACHERS, teacher.id), sanitizeForFirestore(teacher));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a teacher from Firestore
 */
export async function deleteTeacherFromFirestore(teacherId: string): Promise<void> {
  const path = `${COLLECTIONS.TEACHERS}/${teacherId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.TEACHERS, teacherId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to System Settings
 */
export function subscribeToSettings(
  onUpdate: (settings: SystemSettings) => void,
  onError?: (err: any) => void
) {
  const path = `${COLLECTIONS.SETTINGS}/school`;
  return onSnapshot(
    doc(db, COLLECTIONS.SETTINGS, 'school'),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as SystemSettings);
      }
    },
    (error) => {
      console.warn(`Firestore real-time subscription notice (${path}):`, error?.message || error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves System Settings to Firestore
 */
export async function saveSettingsToFirestore(settings: SystemSettings): Promise<void> {
  const path = `${COLLECTIONS.SETTINGS}/school`;
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'school'), sanitizeForFirestore(settings));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Cloud Sync Snapshots to Firestore (Safe for Firestore 1MB document limit)
 */
export async function saveCloudSyncToFirestore(payload: CloudSyncPayload): Promise<void> {
  const cleanCode = payload.syncCode.trim().toUpperCase();
  const path = `${COLLECTIONS.CLOUD_SYNC}/${cleanCode}`;
  try {
    // Strip large base64 strings from single snapshot document to stay well under 1MB Firestore limit
    const lightweightStudents = (payload.students || []).map((std) => {
      const c = { ...std };
      if (typeof c.photo === 'string' && c.photo.length > 1500) {
        c.photo = '';
      }
      return c;
    });

    const safePayload: CloudSyncPayload = {
      ...payload,
      students: lightweightStudents,
    };

    await setDoc(doc(db, COLLECTIONS.CLOUD_SYNC, cleanCode), sanitizeForFirestore(safePayload));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches a Cloud Sync Snapshot from Firestore
 */
export async function fetchCloudSyncFromFirestore(syncCode: string): Promise<CloudSyncPayload | null> {
  const cleanCode = syncCode.trim().toUpperCase();
  const path = `${COLLECTIONS.CLOUD_SYNC}/${cleanCode}`;
  try {
    // Direct document fetch first
    const docSnap = await getDoc(doc(db, COLLECTIONS.CLOUD_SYNC, cleanCode));
    if (docSnap.exists()) {
      return docSnap.data() as CloudSyncPayload;
    }

    // Fallback search across collection
    const snapshot = await getDocs(collection(db, COLLECTIONS.CLOUD_SYNC));
    let found: CloudSyncPayload | null = null;
    snapshot.forEach((d) => {
      if (d.id === cleanCode || (d.data() as CloudSyncPayload).syncCode === cleanCode) {
        found = d.data() as CloudSyncPayload;
      }
    });
    return found;
  } catch (error) {
    console.warn('Firestore Operation Notice (fetchCloudSync):', error);
    return null;
  }
}

/**
 * Direct recovery of all school collections directly from Firestore
 */
export async function fetchDatabaseDirectlyFromFirestore(): Promise<{
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings?: SystemSettings;
  teachers: Teacher[];
} | null> {
  try {
    const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    const attendanceSnap = await getDocs(collection(db, COLLECTIONS.ATTENDANCE));
    const teachersSnap = await getDocs(collection(db, COLLECTIONS.TEACHERS));
    const settingsDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'school'));

    const students: Student[] = [];
    studentsSnap.forEach((d) => students.push(d.data() as Student));

    const attendanceRecords: AttendanceRecord[] = [];
    attendanceSnap.forEach((d) => attendanceRecords.push(d.data() as AttendanceRecord));

    const teachers: Teacher[] = [];
    teachersSnap.forEach((d) => teachers.push(d.data() as Teacher));

    const settings = settingsDoc.exists() ? (settingsDoc.data() as SystemSettings) : undefined;

    if (students.length === 0 && attendanceRecords.length === 0) {
      return null;
    }

    return {
      students,
      attendanceRecords,
      settings,
      teachers,
    };
  } catch (err) {
    console.warn('Direct fetch from Firestore failed:', err);
    return null;
  }
}

/**
 * Subscribes to real-time updates for Scheduled Leaves
 */
export function subscribeToLeaves(
  onUpdate: (leaves: ScheduledLeave[]) => void,
  onError?: (err: any) => void
) {
  const path = COLLECTIONS.LEAVES;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: ScheduledLeave[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ScheduledLeave);
      });
      onUpdate(items);
    },
    (error) => {
      console.warn(`Firestore real-time subscription notice (${path}):`, error?.message || error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves a scheduled leave to Firestore
 */
export async function saveLeaveToFirestore(leave: ScheduledLeave): Promise<void> {
  const path = `${COLLECTIONS.LEAVES}/${leave.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.LEAVES, leave.id), sanitizeForFirestore(leave));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a scheduled leave from Firestore
 */
export async function deleteLeaveFromFirestore(leaveId: string): Promise<void> {
  const path = `${COLLECTIONS.LEAVES}/${leaveId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.LEAVES, leaveId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time updates for Student Behavior Logs
 */
export function subscribeToBehaviorLogs(
  onUpdate: (logs: BehaviorLog[]) => void,
  onError?: (err: any) => void
) {
  const path = COLLECTIONS.BEHAVIOR_LOGS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: BehaviorLog[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as BehaviorLog);
      });
      onUpdate(items);
    },
    (error) => {
      console.warn(`Firestore real-time subscription notice (${path}):`, error?.message || error);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves a behavior log to Firestore
 */
export async function saveBehaviorLogToFirestore(log: BehaviorLog): Promise<void> {
  const path = `${COLLECTIONS.BEHAVIOR_LOGS}/${log.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.BEHAVIOR_LOGS, log.id), sanitizeForFirestore(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a behavior log from Firestore
 */
export async function deleteBehaviorLogFromFirestore(logId: string): Promise<void> {
  const path = `${COLLECTIONS.BEHAVIOR_LOGS}/${logId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.BEHAVIOR_LOGS, logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Seeds initial database data if Firestore is currently completely empty
 */
export async function seedInitialFirestoreDataIfEmpty(
  initialStudents: Student[],
  initialTeachers: Teacher[],
  defaultSettings: SystemSettings,
  initialAttendance: AttendanceRecord[]
): Promise<void> {
  try {
    const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    if (studentsSnap.empty) {
      console.log('Seeding initial students to Firestore...');
      const batch = writeBatch(db);
      initialStudents.forEach((std) => {
        batch.set(doc(db, COLLECTIONS.STUDENTS, std.id), std);
      });
      initialTeachers.forEach((tch) => {
        batch.set(doc(db, COLLECTIONS.TEACHERS, tch.id), tch);
      });
      batch.set(doc(db, COLLECTIONS.SETTINGS, 'school'), defaultSettings);
      initialAttendance.forEach((att) => {
        batch.set(doc(db, COLLECTIONS.ATTENDANCE, att.id), att);
      });
      await batch.commit();
      console.log('Initial Firestore database seeded successfully!');
    }
  } catch (error) {
    console.warn('Could not check or seed Firestore (running in offline/local fallback mode):', error);
  }
}

