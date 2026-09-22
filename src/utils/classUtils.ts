import { AttendanceRecord, Student, Teacher } from '../types';

/**
 * Utility functions for matching, filtering, and displaying SD school classes.
 * Handles both plain grade formats ('1', 'Kelas 1', '1-A', 'Kelas 1-A') seamlessly.
 */

export const STANDARD_SD_CLASSES = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

/**
 * Normalizes class strings for safe comparison
 * e.g. "Kelas 1" -> "1", "kelas 1-A" -> "1-a", "1" -> "1"
 */
export function normalizeClass(cls?: string): string {
  if (!cls) return '';
  return cls
    .trim()
    .toLowerCase()
    .replace(/^kelas\s*/i, '')
    .replace(/\s+/g, '');
}

/**
 * Checks if a student's class matches the teacher's homeroom class.
 * Matches:
 * - "Kelas 1" === "1" === "Kelas 1"
 * - "Kelas 1" matches student in "1", "Kelas 1", "1-A", "1-B" (if homeroom is general grade 1)
 * - "1-A" strictly matches "1-A" or "Kelas 1-A"
 */
export function isHomeroomClassMatch(studentClass?: string, homeroomClass?: string): boolean {
  if (!studentClass || !homeroomClass) return false;
  if (homeroomClass === 'Semua') return true;

  const stdClean = normalizeClass(studentClass);
  const hrClean = normalizeClass(homeroomClass);

  // Exact match
  if (stdClean === hrClean) return true;

  // If homeroom is general single-digit grade (1 to 6)
  if (['1', '2', '3', '4', '5', '6'].includes(hrClean)) {
    if (stdClean === hrClean) return true;
    if (stdClean.startsWith(`${hrClean}-`) || stdClean.startsWith(`${hrClean}_`)) return true;
  }

  return false;
}

/**
 * Formats a clean display label for a class (e.g. "Kelas 1", "Kelas 1-A")
 */
export function formatClassLabel(className?: string): string {
  if (!className) return 'Kelas -';
  if (className.toLowerCase().startsWith('kelas')) return className;
  return `Kelas ${className}`;
}

/**
 * Normalizes NIP string preventing duplicate "NIP. NIP." prefixes
 */
export function formatCleanNIP(rawNip?: string): string {
  if (!rawNip) return 'NIP. ............................';
  const trimmed = rawNip.trim();
  if (!trimmed || trimmed === '-' || trimmed.includes('.....')) {
    return 'NIP. ............................';
  }
  const cleaned = trimmed.replace(/^(?:NIP[\s.:-]+)+/i, '').trim();
  if (!cleaned || cleaned === '-' || cleaned.includes('.....')) {
    return 'NIP. ............................';
  }
  return `NIP. ${cleaned}`;
}

/**
 * Finds the corresponding homeroom teacher for a class from the teachers list or active session
 */
export function findHomeroomTeacher(
  teachers: Teacher[] | undefined,
  targetClass: string,
  currentTeacher?: Teacher | null
): { name: string; nip: string; classLabel: string; isFound: boolean } {
  const isAll = !targetClass || targetClass === 'Semua';

  if (isAll) {
    if (currentTeacher?.homeroomClass) {
      return {
        name: currentTeacher.name,
        nip: formatCleanNIP(currentTeacher.nip),
        classLabel: `Wali Kelas ${formatClassLabel(currentTeacher.homeroomClass)}`,
        isFound: true,
      };
    }
    const adminOrCoord = teachers?.find((t) => t.role === 'admin' || t.teacherType === 'admin');
    if (adminOrCoord) {
      return {
        name: adminOrCoord.name,
        nip: formatCleanNIP(adminOrCoord.nip),
        classLabel: 'Koordinator Presensi / Kesiswaan',
        isFound: true,
      };
    }
    return {
      name: '( ........................................ )',
      nip: 'NIP. ............................',
      classLabel: 'Wali Kelas / Koordinator Presensi',
      isFound: false,
    };
  }

  // Look for teacher assigned to this homeroom class
  const matchedTeacher = teachers?.find((t) => {
    if (!t.homeroomClass) return false;
    return isHomeroomClassMatch(targetClass, t.homeroomClass);
  });

  if (matchedTeacher) {
    return {
      name: matchedTeacher.name,
      nip: formatCleanNIP(matchedTeacher.nip),
      classLabel: `Wali Kelas ${formatClassLabel(targetClass)}`,
      isFound: true,
    };
  }

  // Check current teacher
  if (currentTeacher?.homeroomClass && isHomeroomClassMatch(targetClass, currentTeacher.homeroomClass)) {
    return {
      name: currentTeacher.name,
      nip: formatCleanNIP(currentTeacher.nip),
      classLabel: `Wali Kelas ${formatClassLabel(targetClass)}`,
      isFound: true,
    };
  }

  // Fallback placeholder
  return {
    name: '( ........................................ )',
    nip: 'NIP. ............................',
    classLabel: `Wali Kelas ${formatClassLabel(targetClass)}`,
    isFound: false,
  };
}

/**
 * Resolves the actual teacher information for an attendance record.
 * Never returns generic placeholders like "Petugas Scanner" or "Petugas Sekolah".
 * Uses the recorded teacher if valid, or falls back to the student's Homeroom Teacher (Wali Kelas),
 * the currently active teacher, or the School Admin.
 */
export function resolveRecordTeacher(
  record: AttendanceRecord,
  teachersList: Teacher[] | undefined,
  studentsList: Student[] | undefined,
  activeTeacher?: Teacher | null
): { name: string; type: 'wali_kelas' | 'guru_mapel' | 'admin'; subject: string } {
  // 1. Check by teacherId first! If teacherId matches any teacher in teachersList
  if (record.teacherId && teachersList && teachersList.length > 0) {
    const matched = teachersList.find((t) => t.id === record.teacherId);
    if (matched) {
      const type = matched.teacherType || (matched.role === 'admin' ? 'admin' : matched.homeroomClass ? 'wali_kelas' : 'guru_mapel');
      const subject =
        type === 'guru_mapel'
          ? (matched.subject || record.teacherSubject || 'Guru Mapel')
          : type === 'wali_kelas'
          ? (matched.homeroomClass ? `Wali ${matched.homeroomClass}` : 'Wali Kelas')
          : (matched.subject || 'Administrator Sekolah');
      return {
        name: matched.name,
        type,
        subject,
      };
    }
  }

  // 2. If record already has a valid specific teacher name (not generic placeholder)
  const rawName = (record.teacherName || '').trim();
  const isGeneric =
    !rawName ||
    rawName.toLowerCase() === 'petugas scanner' ||
    rawName.toLowerCase() === 'petugas sekolah' ||
    rawName.toLowerCase() === 'wali kelas / sistem' ||
    rawName.toLowerCase() === 'sistem' ||
    rawName.toLowerCase() === 'petugas';

  if (!isGeneric) {
    // Check if name matches any registered teacher
    const matchedByName = teachersList?.find(
      (t) => t.name.toLowerCase().trim() === rawName.toLowerCase().trim()
    );
    if (matchedByName) {
      const type = matchedByName.teacherType || (matchedByName.role === 'admin' ? 'admin' : matchedByName.homeroomClass ? 'wali_kelas' : 'guru_mapel');
      const subject =
        type === 'guru_mapel'
          ? (matchedByName.subject || record.teacherSubject || 'Guru Mapel')
          : type === 'wali_kelas'
          ? (matchedByName.homeroomClass ? `Wali ${matchedByName.homeroomClass}` : 'Wali Kelas')
          : (matchedByName.subject || 'Administrator Sekolah');
      return {
        name: matchedByName.name,
        type,
        subject,
      };
    }

    // Teacher not found by name in list, preserve the recorded type and subject accurately
    const inferredType: 'wali_kelas' | 'guru_mapel' | 'admin' =
      record.teacherType ||
      (record.teacherRole === 'admin'
        ? 'admin'
        : record.teacherSubject && !record.teacherSubject.toLowerCase().includes('wali')
        ? 'guru_mapel'
        : 'wali_kelas');

    let inferredSubject = record.teacherSubject;
    if (!inferredSubject) {
      if (inferredType === 'wali_kelas') {
        inferredSubject = record.classRoom ? `Wali ${record.classRoom}` : 'Wali Kelas';
      } else if (inferredType === 'guru_mapel') {
        inferredSubject = 'Guru Mapel';
      } else {
        inferredSubject = 'Administrator Sekolah';
      }
    }

    return {
      name: rawName,
      type: inferredType,
      subject: inferredSubject,
    };
  }

  // 3. If currently active teacher is present (e.g. scanner or manual input currently operated by teacher)
  if (activeTeacher?.name && activeTeacher.name.trim()) {
    const type = activeTeacher.teacherType || (activeTeacher.role === 'admin' ? 'admin' : activeTeacher.homeroomClass ? 'wali_kelas' : 'guru_mapel');
    return {
      name: activeTeacher.name,
      type,
      subject:
        type === 'guru_mapel'
          ? (activeTeacher.subject || 'Guru Mapel')
          : type === 'wali_kelas'
          ? (activeTeacher.homeroomClass ? `Wali ${activeTeacher.homeroomClass}` : 'Wali Kelas')
          : (activeTeacher.subject || 'Administrator Sekolah'),
    };
  }

  // 4. Identify student's class
  const student = studentsList?.find((s) => s.id === record.studentId || s.nis === record.nis);
  const classRoom = record.classRoom || student?.classRoom || '';

  // 5. Find homeroom teacher matching this class
  const homeroom = teachersList?.find(
    (t) => t.homeroomClass && isHomeroomClassMatch(classRoom, t.homeroomClass)
  );

  if (homeroom) {
    return {
      name: homeroom.name,
      type: 'wali_kelas',
      subject: formatClassLabel(classRoom),
    };
  }

  // 6. Check if there is an Admin teacher in the teachers list
  const adminTeacher = teachersList?.find((t) => t.role === 'admin' || t.teacherType === 'admin');
  if (adminTeacher?.name) {
    return {
      name: adminTeacher.name,
      type: 'admin',
      subject: adminTeacher.subject || 'Admin Sekolah',
    };
  }

  // 7. First teacher in list
  if (teachersList && teachersList.length > 0 && teachersList[0].name) {
    return {
      name: teachersList[0].name,
      type: teachersList[0].teacherType || 'wali_kelas',
      subject: teachersList[0].subject || (teachersList[0].homeroomClass ? formatClassLabel(teachersList[0].homeroomClass) : 'Wali Kelas'),
    };
  }

  // 8. Ultimate fallback to school admin name (MOH. FADLI)
  return {
    name: 'MOH. FADLI',
    type: 'admin',
    subject: 'Administrator Sekolah',
  };
}
