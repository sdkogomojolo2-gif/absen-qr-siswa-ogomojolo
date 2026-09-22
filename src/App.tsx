import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Student,
  AttendanceRecord,
  SystemSettings,
  ActiveTab,
  AttendanceStatus,
  ToastMessage,
  Teacher,
  ScheduledLeave,
  BehaviorLog,
} from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  DEFAULT_SETTINGS,
  getTodayDateString,
  generateInitialAttendance,
} from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { DashboardTab } from './components/DashboardTab';
import { ScannerTab } from './components/ScannerTab';
import { StudentsTab } from './components/StudentsTab';
import { SimulatorTab } from './components/SimulatorTab';
import { LoginModal } from './components/LoginModal';
import { TeacherManagementModal } from './components/TeacherManagementModal';
import { AdminProfileModal } from './components/AdminProfileModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { DapodikAnnouncementModal, CURRENT_ANNOUNCEMENT_VERSION } from './components/DapodikAnnouncementModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/OfflineIndicator';
import { testFirestoreConnection } from './firebase';
import {
  subscribeToStudents,
  subscribeToAttendance,
  subscribeToTeachers,
  subscribeToSettings,
  subscribeToLeaves,
  subscribeToBehaviorLogs,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  bulkDeleteStudentsFromFirestore,
  syncAllStudentsToFirestore,
  saveAttendanceToFirestore,
  deleteAttendanceFromFirestore,
  saveTeacherToFirestore,
  deleteTeacherFromFirestore,
  saveSettingsToFirestore,
  saveLeaveToFirestore,
  deleteLeaveFromFirestore,
  saveBehaviorLogToFirestore,
  deleteBehaviorLogFromFirestore,
  seedInitialFirestoreDataIfEmpty,
} from './services/firestoreService';
import { safeSetItem, safeGetItem, safeRemoveItem, cleanStaleLocalStorage } from './utils/storage';
import { isHomeroomClassMatch, resolveRecordTeacher } from './utils/classUtils';

const LOCAL_STORAGE_KEYS = {
  STUDENTS: 'absensi_siswa_students_v2',
  ATTENDANCE: 'absensi_siswa_attendance_v2',
  SETTINGS: 'absensi_siswa_settings_v1',
  TEACHERS: 'absensi_siswa_teachers_v2',
  CURRENT_TEACHER: 'absensi_siswa_current_teacher_v2',
  LEAVES: 'absensi_siswa_leaves_v1',
  BEHAVIOR_LOGS: 'absensi_siswa_behavior_logs_v1',
};

export default function App() {
  const todayStr = getTodayDateString();
  const isInitialMount = useRef(true);

  // Run cleanup once on startup to remove legacy keys and reclaim quota space
  useEffect(() => {
    cleanStaleLocalStorage();
  }, []);

  // Settings state with safe JSON parse
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('Failed to parse settings from localStorage:', e);
      return DEFAULT_SETTINGS;
    }
  });

  // Students state with safe JSON parse
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      if (safeGetItem('absensi_siswa_students_v1')) {
        safeRemoveItem('absensi_siswa_students_v1');
        safeRemoveItem('absensi_siswa_attendance_v1');
      }

      const saved = safeGetItem(LOCAL_STORAGE_KEYS.STUDENTS);
      const parsed: Student[] = saved ? JSON.parse(saved) : INITIAL_STUDENTS;

      const filtered = parsed.filter(
        (s) => !['std-1001', 'std-1002', 'std-1003', 'std-1004', 'std-1005', 'std-1006', 'std-1007', 'std-1008', 'std-1009', 'std-1010', 'std-1011', 'std-1012', 'std-1013', 'std-1014'].includes(s.id)
      );

      const seenIds = new Set<string>();
      return filtered.map((s, index) => {
        let uniqueId = s.id;
        if (!uniqueId || seenIds.has(uniqueId)) {
          uniqueId = `std-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 8)}`;
        }
        seenIds.add(uniqueId);
        return { ...s, id: uniqueId };
      });
    } catch (e) {
      console.warn('Failed to parse students from localStorage:', e);
      return INITIAL_STUDENTS;
    }
  });

  // Attendance Records state with safe JSON parse
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.ATTENDANCE);
      const parsed: AttendanceRecord[] = saved ? JSON.parse(saved) : generateInitialAttendance(todayStr);
      return parsed.filter(
        (r) => !['std-1001', 'std-1002', 'std-1003', 'std-1004', 'std-1005', 'std-1006', 'std-1007', 'std-1008', 'std-1009', 'std-1010', 'std-1011', 'std-1012', 'std-1013', 'std-1014'].includes(r.studentId)
      );
    } catch (e) {
      console.warn('Failed to parse attendance from localStorage:', e);
      return generateInitialAttendance(todayStr);
    }
  });

  // Teachers state with safe JSON parse
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      if (safeGetItem('absensi_siswa_teachers_v1')) {
        safeRemoveItem('absensi_siswa_teachers_v1');
        safeRemoveItem('absensi_siswa_current_teacher_v1');
      }

      const saved = safeGetItem(LOCAL_STORAGE_KEYS.TEACHERS);
      if (!saved) return INITIAL_TEACHERS;

      const parsed: Teacher[] = JSON.parse(saved);
      const filtered = parsed.filter(
        (t) => !['tch-1', 'tch-2', 'tch-3', 'tch-4', 'tch-5', 'tch-6', 'tch-7', 'tch-8'].includes(t.id)
      );

      if (filtered.length === 0) return INITIAL_TEACHERS;

      return filtered.map((t) => {
        if (t.id === 'tch-admin' && (t.name === 'Budi Santoso, S.Pd.SD' || !t.name)) {
          return INITIAL_TEACHERS[0];
        }
        return t;
      });
    } catch (e) {
      console.warn('Failed to parse teachers from localStorage:', e);
      return INITIAL_TEACHERS;
    }
  });

  // Scheduled Leaves (Izin / Sakit Terjadwal) state
  const [scheduledLeaves, setScheduledLeaves] = useState<ScheduledLeave[]>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.LEAVES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse leaves from localStorage:', e);
      return [];
    }
  });

  // Student Behavior & Character Logs state
  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLog[]>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.BEHAVIOR_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse behavior logs from localStorage:', e);
      return [];
    }
  });

  // Currently logged-in Teacher (defaults to admin MOH. FADLI if not explicitly logged in)
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER);
      if (saved) {
        const parsed: Teacher = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
      return INITIAL_TEACHERS[0] || null;
    } catch (e) {
      console.warn('Failed to parse current teacher from localStorage:', e);
      return INITIAL_TEACHERS[0] || null;
    }
  });

  // Modals for Teacher Login, Management, Admin Profile, Guide, and Cloud Sync
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isAdminProfileModalOpen, setIsAdminProfileModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dapodik-style Announcement Pop-up on initial enter
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState<boolean>(() => {
    try {
      const acknowledgedVersion = safeGetItem('dapodik_announcement_acknowledged');
      return acknowledgedVersion !== CURRENT_ANNOUNCEMENT_VERSION;
    } catch {
      return true;
    }
  });

  // Dark / Light Theme Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = safeGetItem('app_theme_mode');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply dark mode class to <html> root
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        safeSetItem('app_theme_mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        safeSetItem('app_theme_mode', 'light');
      }
    } catch (e) {
      console.warn('Failed to sync theme class:', e);
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Navigation & Date
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast helper
  const addToast = useCallback(
    (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      setToasts((prev) => [...prev, { id, title, message, type }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleCloseAnnouncement = useCallback((dontShowAgain: boolean) => {
    setIsAnnouncementOpen(false);
    if (dontShowAgain) {
      const targetVer = settings.announcementVersion || CURRENT_ANNOUNCEMENT_VERSION;
      safeSetItem('dapodik_announcement_acknowledged', targetVer);
    }
  }, [settings.announcementVersion]);

  const handleOpenAnnouncement = useCallback(() => {
    setIsAnnouncementOpen(true);
  }, []);

  const handleResetAnnouncementStatus = useCallback(() => {
    safeRemoveItem('dapodik_announcement_acknowledged');
    addToast(
      'Pop-up Direset',
      'Pemberitahuan ala Dapodik akan otomatis muncul kembali saat membuka beranda.',
      'info'
    );
  }, [addToast]);

  // Save to LocalStorage whenever states update (fast local cache with quota management)
  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.LEAVES, JSON.stringify(scheduledLeaves));
  }, [scheduledLeaves]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.BEHAVIOR_LOGS, JSON.stringify(behaviorLogs));
  }, [behaviorLogs]);

  useEffect(() => {
    if (currentTeacher) {
      safeSetItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER, JSON.stringify(currentTeacher));
    } else {
      safeRemoveItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER);
    }
  }, [currentTeacher]);

  // Real-time Firestore synchronization & Initial Connection
  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      console.warn('Firestore connection notice:', err);
    });

    // Seed initial data to Firestore if completely empty
    seedInitialFirestoreDataIfEmpty(
      INITIAL_STUDENTS,
      INITIAL_TEACHERS,
      DEFAULT_SETTINGS,
      generateInitialAttendance(todayStr)
    ).catch((err) => {
      console.warn('Firestore initial data check notice:', err);
    });

    // Subscribe to Firestore collections in real-time
    const unsubStudents = subscribeToStudents((fsStudents) => {
      if (fsStudents && fsStudents.length > 0) {
        setStudents(fsStudents);
      }
    });

    const unsubAttendance = subscribeToAttendance((fsRecords) => {
      if (fsRecords && fsRecords.length > 0) {
        const enriched = fsRecords.map((r) => {
          const raw = (r.teacherName || '').trim().toLowerCase();
          if (
            !r.teacherName ||
            raw === 'petugas scanner' ||
            raw === 'petugas sekolah' ||
            raw === 'wali kelas / sistem' ||
            raw === 'sistem'
          ) {
            const resolved = resolveRecordTeacher(r, teachers, students, currentTeacher);
            return {
              ...r,
              teacherName: resolved.name,
              teacherType: resolved.type,
              teacherSubject: resolved.subject,
            };
          }
          return r;
        });
        setAttendanceRecords(enriched);
      }
    });

    const unsubTeachers = subscribeToTeachers((fsTeachers) => {
      if (fsTeachers && fsTeachers.length > 0) {
        setTeachers(fsTeachers);
      }
    });

    const unsubSettings = subscribeToSettings((fsSettings) => {
      if (fsSettings && fsSettings.schoolName) {
        setSettings(fsSettings);
      }
    });

    const unsubLeaves = subscribeToLeaves((fsLeaves) => {
      if (fsLeaves) {
        setScheduledLeaves(fsLeaves);
      }
    });

    const unsubBehavior = subscribeToBehaviorLogs((fsLogs) => {
      if (fsLogs) {
        setBehaviorLogs(fsLogs);
      }
    });

    return () => {
      unsubStudents();
      unsubAttendance();
      unsubTeachers();
      unsubSettings();
      unsubLeaves();
      unsubBehavior();
    };
  }, [todayStr]);

  // Update Settings in State and Firestore
  const handleUpdateSettings = useCallback(
    (newSettings: SystemSettings) => {
      setSettings(newSettings);
      saveSettingsToFirestore(newSettings).catch((err) =>
        console.warn('Failed to sync settings to Firestore:', err)
      );
    },
    []
  );

  // Teacher Login Handler
  const handleTeacherLogin = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setIsLoginModalOpen(false);
    addToast(
      'Login Berhasil',
      `Selamat datang, ${teacher.name} (${teacher.role === 'admin' ? 'Admin' : teacher.subject})`,
      'success'
    );
  };

  // Teacher Logout Handler
  const handleTeacherLogout = () => {
    const prevName = currentTeacher?.name || 'Pengguna';
    setCurrentTeacher(null);
    safeRemoveItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER);
    addToast('Berhasil Keluar', `Anda telah keluar dari akun ${prevName}.`, 'info');
  };

  // Add Teacher Handler (by Admin)
  const handleAddTeacher = (newTeacherData: Omit<Teacher, 'id'>) => {
    const exists = teachers.some((t) => t.email.toLowerCase() === newTeacherData.email.toLowerCase());
    if (exists) {
      addToast('Email Terdaftar', `Email ${newTeacherData.email} sudah terdaftar!`, 'error');
      return;
    }

    const newTeacher: Teacher = {
      ...newTeacherData,
      id: `tch-${Date.now()}`,
    };

    setTeachers((prev) => [...prev, newTeacher]);
    saveTeacherToFirestore(newTeacher).catch((err) =>
      console.warn('Failed to save teacher to Firestore:', err)
    );
    addToast('Guru Mapel Ditambahkan', `Akun ${newTeacher.name} (${newTeacher.subject}) berhasil disimpan.`, 'success');
  };

  // Update Teacher / Admin Handler
  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers((prev) => prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t)));
    if (currentTeacher?.id === updatedTeacher.id) {
      setCurrentTeacher(updatedTeacher);
    }
    saveTeacherToFirestore(updatedTeacher).catch((err) =>
      console.warn('Failed to update teacher in Firestore:', err)
    );
    addToast(
      'Data Diperbarui',
      `Profil ${updatedTeacher.name} (${updatedTeacher.role === 'admin' ? 'Admin' : updatedTeacher.subject}) berhasil disimpan.`,
      'success'
    );
  };

  // Delete Teacher Handler
  const handleDeleteTeacher = (id: string) => {
    const teacher = teachers.find((t) => t.id === id);
    if (!teacher) return;

    setTeachers((prev) => prev.filter((t) => t.id !== id));
    if (currentTeacher?.id === id) {
      setCurrentTeacher(teachers.find((t) => t.id !== id) || null);
    }
    deleteTeacherFromFirestore(id).catch((err) =>
      console.warn('Failed to delete teacher from Firestore:', err)
    );
    addToast('Akun Dihapus', `Akun guru ${teacher.name} telah dihapus.`, 'info');
  };

  // Calculate late status based on cutoff time
  const calculateLateStatus = (
    timeStr: string,
    cutoffStr: string
  ): AttendanceStatus => {
    const [h, m] = timeStr.split(':').map(Number);
    const [cutH, cutM] = cutoffStr.split(':').map(Number);

    const currentTimeMin = h * 60 + m;
    const cutoffTimeMin = cutH * 60 + cutM;

    return currentTimeMin > cutoffTimeMin ? 'Terlambat' : 'Hadir';
  };

  // Record attendance via QR Camera / Manual / Simulator
  const handleRecordAttendance = useCallback(
    (
      student: Student,
      scannedVia: 'QR Camera' | 'Manual Input' | 'Simulator',
      assignedTeacherOverride?: Teacher | null
    ): { record: AttendanceRecord; isDuplicate: boolean } => {
      const currentDate = getTodayDateString();
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // Check duplicate on same date
      const existing = attendanceRecords.find(
        (r) => r.studentId === student.id && r.date === currentDate
      );

      if (existing) {
        addToast(
          'Absensi Duplikat',
          `${student.name} sudah melakukan absensi hari ini jam ${existing.time} WIB.`,
          'warning'
        );
        return { record: existing, isDuplicate: true };
      }

      // Determine status (Hadir vs Terlambat)
      const status = calculateLateStatus(timeStr, settings.lateCutoffTime);
      const note =
        status === 'Terlambat'
          ? `Terlambat (Masuk ${timeStr} WIB, Batas ${settings.lateCutoffTime})`
          : 'Hadir Tepat Waktu';

      // Teacher tracking information - faithfully preserving Guru Mapel / Wali Kelas
      const homeroom = teachers.find(
        (t) => t.homeroomClass && isHomeroomClassMatch(student.classRoom, t.homeroomClass)
      );
      const assignedTeacher =
        assignedTeacherOverride ||
        currentTeacher ||
        homeroom ||
        teachers.find((t) => t.role === 'admin') ||
        teachers[0];

      const teacherName = assignedTeacher?.name || 'MOH. FADLI';
      const teacherRole = assignedTeacher?.role || 'guru';
      const teacherType =
        assignedTeacher?.teacherType ||
        (assignedTeacher?.role === 'admin'
          ? 'admin'
          : assignedTeacher?.homeroomClass
          ? 'wali_kelas'
          : 'guru_mapel');
      const teacherSubject =
        teacherType === 'wali_kelas'
          ? (assignedTeacher?.homeroomClass ? `Wali ${assignedTeacher.homeroomClass}` : 'Wali Kelas')
          : teacherType === 'guru_mapel'
          ? (assignedTeacher?.subject ? `Mapel ${assignedTeacher.subject}` : 'Guru Mapel')
          : 'Administrator Sekolah';

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        studentId: student.id,
        nis: student.nis,
        studentName: student.name,
        classRoom: student.classRoom,
        date: currentDate,
        time: timeStr,
        status,
        scannedVia,
        note,
        teacherId: assignedTeacher?.id,
        teacherName,
        teacherRole,
        teacherType,
        teacherSubject,
      };

      setAttendanceRecords((prev) => [newRecord, ...prev]);
      saveAttendanceToFirestore(newRecord).catch((err) =>
        console.warn('Failed to save attendance to Firestore:', err)
      );

      if (status === 'Hadir') {
        addToast('Absensi Berhasil', `[Hadir] ${student.name} (${student.classRoom}) - ${timeStr} WIB`, 'success');
      } else {
        addToast('Absensi Terlambat', `[Terlambat] ${student.name} (${student.classRoom}) - ${timeStr} WIB`, 'warning');
      }

      return { record: newRecord, isDuplicate: false };
    },
    [attendanceRecords, settings.lateCutoffTime, addToast, currentTeacher, teachers]
  );

  // Add Manual Attendance (supports any date or past date)
  const handleAddManualAttendance = (
    studentId: string,
    status: AttendanceStatus,
    note?: string,
    customTime?: string,
    customDate?: string,
    teacherOverride?: Teacher | null
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const now = new Date();
    const timeStr =
      customTime ||
      now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    const targetDate = customDate || selectedDate;

    // Teacher tracking information - always assign real teacher
    const homeroom = teachers.find(
      (t) => t.homeroomClass && isHomeroomClassMatch(student.classRoom, t.homeroomClass)
    );
    const assignedTeacher =
      teacherOverride ||
      currentTeacher ||
      homeroom ||
      teachers.find((t) => t.role === 'admin') ||
      teachers[0];

    const teacherName = assignedTeacher?.name || 'MOH. FADLI';
    const teacherRole = assignedTeacher?.role || 'guru';
    const teacherType =
      assignedTeacher?.teacherType ||
      (assignedTeacher?.role === 'admin'
        ? 'admin'
        : assignedTeacher?.homeroomClass
        ? 'wali_kelas'
        : 'guru_mapel');
    const teacherSubject =
      teacherType === 'wali_kelas'
        ? (assignedTeacher?.homeroomClass ? `Wali ${assignedTeacher.homeroomClass}` : 'Wali Kelas')
        : teacherType === 'guru_mapel'
        ? (assignedTeacher?.subject ? `Mapel ${assignedTeacher.subject}` : 'Guru Mapel')
        : 'Administrator Sekolah';

    const newRecord: AttendanceRecord = {
      id: `att-manual-${Date.now()}`,
      studentId: student.id,
      nis: student.nis,
      studentName: student.name,
      classRoom: student.classRoom,
      date: targetDate,
      time: timeStr,
      status,
      scannedVia: 'Manual Input',
      note: note || `Disimpan manual (${status})`,
      teacherId: assignedTeacher?.id,
      teacherName,
      teacherRole,
      teacherType,
      teacherSubject,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    saveAttendanceToFirestore(newRecord).catch((err) =>
      console.warn('Failed to save manual attendance to Firestore:', err)
    );
    addToast('Absensi Manual Tersimpan', `Absensi manual ${student.name} (${targetDate} - ${status}) berhasil dicatat.`, 'success');
  };

  // Update / Edit Existing Attendance Record (Koreksi Absensi Lampau)
  const handleUpdateAttendanceRecord = (updatedRecord: AttendanceRecord) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    saveAttendanceToFirestore(updatedRecord).catch((err) =>
      console.warn('Failed to update attendance in Firestore:', err)
    );
    addToast(
      'Absensi Diperbarui',
      `Data absensi ${updatedRecord.studentName} (${updatedRecord.date} - ${updatedRecord.status}) berhasil diperbarui.`,
      'success'
    );
  };

  // Delete Attendance Record
  const handleDeleteRecord = (id: string) => {
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
    deleteAttendanceFromFirestore(id).catch((err) =>
      console.warn('Failed to delete attendance from Firestore:', err)
    );
    addToast('Data Dihapus', 'Riwayat absensi telah dihapus.', 'info');
  };

  // Scheduled Leaves Handlers
  const handleSaveLeave = (leave: ScheduledLeave, autoPopulateAttendance: boolean) => {
    setScheduledLeaves((prev) => {
      const filtered = prev.filter((l) => l.id !== leave.id);
      return [leave, ...filtered];
    });

    saveLeaveToFirestore(leave).catch((err) =>
      console.warn('Failed to save leave to Firestore:', err)
    );

    // Auto-populate attendance records for the dates in leave range if enabled
    if (autoPopulateAttendance) {
      const student = students.find((s) => s.id === leave.studentId);
      if (student) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const dateList: string[] = [];

        // Loop inclusive date range
        const curr = new Date(start);
        while (curr <= end) {
          dateList.push(curr.toISOString().slice(0, 10));
          curr.setDate(curr.getDate() + 1);
        }

        const newRecordsToSave: AttendanceRecord[] = [];
        setAttendanceRecords((prev) => {
          let updated = [...prev];
          dateList.forEach((dStr) => {
            const existingIdx = updated.findIndex(
              (r) => r.studentId === student.id && r.date === dStr
            );
            const status: AttendanceStatus = leave.type === 'Sakit' ? 'Sakit' : 'Izin';
            const homeroom = teachers.find(
              (t) => t.homeroomClass && isHomeroomClassMatch(student.classRoom, t.homeroomClass)
            );
            const assignedTeacher =
              currentTeacher || homeroom || teachers.find((t) => t.role === 'admin') || teachers[0];
            const teacherName = leave.recordedBy || assignedTeacher?.name || 'MOH. FADLI';
            const teacherRole = assignedTeacher?.role || 'guru';
            const teacherType = assignedTeacher?.teacherType || (assignedTeacher?.homeroomClass ? 'wali_kelas' : 'admin');
            const teacherSubject =
              assignedTeacher?.teacherType === 'wali_kelas' || assignedTeacher?.homeroomClass
                ? (assignedTeacher?.homeroomClass ? `Wali ${assignedTeacher.homeroomClass}` : 'Wali Kelas')
                : assignedTeacher?.subject || (assignedTeacher?.role === 'admin' ? 'Administrator Sekolah' : 'Guru Pengabsen');

            const attRecord: AttendanceRecord = {
              id: existingIdx >= 0 ? updated[existingIdx].id : `att-leave-${Date.now()}-${dStr}`,
              studentId: student.id,
              nis: student.nis,
              studentName: student.name,
              classRoom: student.classRoom,
              date: dStr,
              time: '07:00:00',
              status,
              scannedVia: 'Manual Input',
              note: `[Izin Terjadwal] ${leave.reason}`,
              teacherId: assignedTeacher?.id,
              teacherName,
              teacherRole,
              teacherType,
              teacherSubject,
            };

            if (existingIdx >= 0) {
              updated[existingIdx] = attRecord;
            } else {
              updated.unshift(attRecord);
            }
            newRecordsToSave.push(attRecord);
          });
          return updated;
        });

        // Persist generated records to Firestore
        newRecordsToSave.forEach((r) => {
          saveAttendanceToFirestore(r).catch((err) =>
            console.warn('Failed to save leave attendance to Firestore:', err)
          );
        });
      }
    }

    addToast(
      'Izin Tersimpan',
      `Jadwal ${leave.type} ananda ${leave.studentName} (${leave.startDate} s/d ${leave.endDate}) berhasil dicatat.`,
      'success'
    );
  };

  const handleDeleteLeave = (leaveId: string) => {
    setScheduledLeaves((prev) => prev.filter((l) => l.id !== leaveId));
    deleteLeaveFromFirestore(leaveId).catch((err) =>
      console.warn('Failed to delete leave from Firestore:', err)
    );
    addToast('Izin Dihapus', 'Data izin/sakit terjadwal telah dihapus.', 'info');
  };

  // Behavior & Character Log Handlers
  const handleSaveBehaviorLog = (log: BehaviorLog) => {
    setBehaviorLogs((prev) => {
      const filtered = prev.filter((l) => l.id !== log.id);
      return [log, ...filtered];
    });

    saveBehaviorLogToFirestore(log).catch((err) =>
      console.warn('Failed to save behavior log to Firestore:', err)
    );

    addToast(
      'Jurnal Karakter Tersimpan',
      `Catatan poin ${log.type === 'positive' ? '+' : ''}${log.points} untuk ${log.studentName} berhasil dicatat.`,
      'success'
    );
  };

  const handleDeleteBehaviorLog = (logId: string) => {
    setBehaviorLogs((prev) => prev.filter((l) => l.id !== logId));
    deleteBehaviorLogFromFirestore(logId).catch((err) =>
      console.warn('Failed to delete behavior log from Firestore:', err)
    );
    addToast('Catatan Dihapus', 'Catatan jurnal perilaku siswa telah dihapus.', 'info');
  };

  // Student Management Handlers
  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'createdAt'> & { id?: string }) => {
    const uniqueId = newStudentData.id || `std-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newStudent: Student = {
      ...newStudentData,
      id: uniqueId,
      createdAt: getTodayDateString(),
    };
    setStudents((prev) => [...prev, newStudent]);
    saveStudentToFirestore(newStudent).catch((err) =>
      console.warn('Failed to save student to Firestore:', err)
    );
    addToast('Siswa Ditambahkan', `${newStudent.name} berhasil didaftarkan.`, 'success');
  };

  const handleAddBulkStudents = (newStudentsList: Student[]) => {
    const timestamp = Date.now();
    const preparedStudents = newStudentsList.map((s, idx) => ({
      ...s,
      id: s.id && s.id.length > 5 ? s.id : `std-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: s.createdAt || getTodayDateString(),
    }));

    setStudents((prev) => {
      const existingNisMap = new Set(prev.map((p) => p.nis.trim()));
      const filteredNew = preparedStudents.filter((s) => !existingNisMap.has(s.nis.trim()));
      const updated = [...prev, ...filteredNew];
      syncAllStudentsToFirestore(updated).catch((err) =>
        console.warn('Failed to bulk sync students to Firestore:', err)
      );
      return updated;
    });

    addToast('Import Berhasil', `${newStudentsList.length} siswa baru berhasil ditambahkan.`, 'success');
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    saveStudentToFirestore(updatedStudent).catch((err) =>
      console.warn('Failed to update student in Firestore:', err)
    );
    addToast('Data Diperbarui', `Data ${updatedStudent.name} berhasil diperbarui.`, 'success');
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    deleteStudentFromFirestore(id).catch((err) =>
      console.warn('Failed to delete student from Firestore:', err)
    );
    addToast('Siswa Dihapus', 'Siswa berhasil dihapus dari database.', 'info');
  };

  const handleBulkDeleteStudents = (ids: string[]) => {
    const idSet = new Set(ids);
    setStudents((prev) => prev.filter((s) => !idSet.has(s.id)));
    bulkDeleteStudentsFromFirestore(ids).catch((err) =>
      console.warn('Failed to bulk delete students from Firestore:', err)
    );
    addToast('Siswa Dihapus', `${ids.length} siswa berhasil dihapus secara permanen.`, 'info');
  };

  // Reset to initial dummy data
  const handleResetData = () => {
    setStudents(INITIAL_STUDENTS);
    setTeachers(INITIAL_TEACHERS);
    setCurrentTeacher(INITIAL_TEACHERS[0]);
    const initAtt = generateInitialAttendance(getTodayDateString());
    setAttendanceRecords(initAtt);
    setSettings(DEFAULT_SETTINGS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.STUDENTS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.ATTENDANCE);
    safeRemoveItem(LOCAL_STORAGE_KEYS.SETTINGS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.TEACHERS);
    safeRemoveItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER);

    // Sync reset to Firestore
    syncAllStudentsToFirestore(INITIAL_STUDENTS).catch((e) => console.warn(e));
    saveSettingsToFirestore(DEFAULT_SETTINGS).catch((e) => console.warn(e));
    addToast('Reset Berhasil', 'Data berhasil dikembalikan ke sampel data awal SD.', 'info');
  };

  // Restore Data Handler for Cloud Sync / JSON File Import
  const handleRestoreData = (restored: {
    students: Student[];
    attendanceRecords: AttendanceRecord[];
    settings: SystemSettings;
    teachers: Teacher[];
  }) => {
    if (restored.students) {
      setStudents(restored.students);
      syncAllStudentsToFirestore(restored.students).catch((e) => console.warn(e));
    }
    if (restored.attendanceRecords) {
      setAttendanceRecords(restored.attendanceRecords);
    }
    if (restored.settings) {
      setSettings(restored.settings);
      saveSettingsToFirestore(restored.settings).catch((e) => console.warn(e));
    }
    if (restored.teachers) {
      setTeachers(restored.teachers);
    }
  };

  const todayCount = attendanceRecords.filter((r) => r.date === todayStr).length;

  return (
    <ErrorBoundary fallbackTitle="Terjadi Kendala pada Aplikasi Utama">
      <div className="min-h-screen bg-[#4a070e] dark:bg-[#200204] text-slate-800 dark:text-slate-100 flex flex-row font-['Plus_Jakarta_Sans',sans-serif] selection:bg-rose-700 selection:text-white transition-colors duration-200">
        {/* Locked Sidebar Navigation (Stays fixed on left, does NOT scroll down with content) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          todayCount={todayCount}
          settings={settings}
          currentTeacher={currentTeacher}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleTeacherLogout}
          onOpenTeacherManage={() => setIsTeacherModalOpen(true)}
          onOpenAdminProfile={() => setIsAdminProfileModalOpen(true)}
          onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
          onOpenAnnouncement={handleOpenAnnouncement}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Right Column: Header (Date & Dark/Light mode only) and Main Content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Top Header - ONLY Date/Time and Dark/Light Mode toggle as requested */}
          <Header
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />

          {/* Toast Notifications */}
          <Toast toasts={toasts} onDismiss={dismissToast} />

          {/* Offline Status Indicator */}
          <OfflineIndicator />

          {/* Main Content View */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
          {activeTab === 'dashboard' && (
            <ErrorBoundary fallbackTitle="Terjadi Kendala pada Dashboard Rekap">
              <DashboardTab
                students={students}
                attendanceRecords={attendanceRecords}
                scheduledLeaves={scheduledLeaves}
                behaviorLogs={behaviorLogs}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                settings={settings}
                teachers={teachers}
                currentTeacher={currentTeacher}
                onAddManualAttendance={handleAddManualAttendance}
                onUpdateRecord={handleUpdateAttendanceRecord}
                onDeleteRecord={handleDeleteRecord}
                onSaveLeave={handleSaveLeave}
                onDeleteLeave={handleDeleteLeave}
                onSaveBehaviorLog={handleSaveBehaviorLog}
                onDeleteBehaviorLog={handleDeleteBehaviorLog}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'scanner' && (
            <ErrorBoundary fallbackTitle="Terjadi Kendala pada Pemindai QR Camera">
              <ScannerTab
                students={students}
                attendanceRecords={attendanceRecords}
                settings={settings}
                teachers={teachers}
                currentTeacher={currentTeacher}
                onSelectTeacher={(t) => {
                  setCurrentTeacher(t);
                  addToast('Guru Pengabsen Diubah', `Petugas pengabsen aktif: ${t.name}`, 'info');
                }}
                onRecordAttendance={handleRecordAttendance}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'students' && (
            <ErrorBoundary fallbackTitle="Terjadi Kendala pada Kelola Data Siswa">
              <StudentsTab
                students={students}
                settings={settings}
                currentTeacher={currentTeacher}
                teachers={teachers}
                scheduledLeaves={scheduledLeaves}
                behaviorLogs={behaviorLogs}
                onAddStudent={handleAddStudent}
                onAddBulkStudents={handleAddBulkStudents}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onDeleteBulkStudents={handleBulkDeleteStudents}
                onSaveLeave={handleSaveLeave}
                onDeleteLeave={handleDeleteLeave}
                onSaveBehaviorLog={handleSaveBehaviorLog}
                onDeleteBehaviorLog={handleDeleteBehaviorLog}
                onUpdateSettings={handleUpdateSettings}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'simulator' && (
            <ErrorBoundary fallbackTitle="Terjadi Kendala pada Pengaturan & Simulasi">
              <SimulatorTab
                students={students}
                attendanceRecords={attendanceRecords}
                settings={settings}
                currentTeacher={currentTeacher}
                isDarkMode={isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
                onUpdateSettings={handleUpdateSettings}
                onRecordAttendance={handleRecordAttendance}
                onResetData={handleResetData}
                onOpenAnnouncement={handleOpenAnnouncement}
                onResetAnnouncementStatus={handleResetAnnouncementStatus}
              />
            </ErrorBoundary>
          )}
        </main>

        {/* Teacher Login Modal */}
        {isLoginModalOpen && (
          <LoginModal
            teachers={teachers}
            currentTeacher={currentTeacher}
            onLogin={handleTeacherLogin}
            onClose={() => setIsLoginModalOpen(false)}
            canClose={true}
          />
        )}

        {/* Teacher Management Modal for Admin */}
        {isTeacherModalOpen && (
          <TeacherManagementModal
            teachers={teachers}
            currentTeacher={currentTeacher}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onClose={() => setIsTeacherModalOpen(false)}
          />
        )}

        {/* Admin Profile & School Data Customization Modal */}
        {isAdminProfileModalOpen && currentTeacher && (
          <AdminProfileModal
            currentTeacher={currentTeacher}
            settings={settings}
            onUpdateTeacher={handleUpdateTeacher}
            onUpdateSettings={handleUpdateSettings}
            onClose={() => setIsAdminProfileModalOpen(false)}
          />
        )}

        {/* Cloud Sync & Export Modal */}
        {isCloudSyncModalOpen && (
          <CloudSyncModal
            students={students}
            attendanceRecords={attendanceRecords}
            settings={settings}
            teachers={teachers}
            onRestoreData={handleRestoreData}
            onClose={() => setIsCloudSyncModalOpen(false)}
            onShowToast={addToast}
          />
        )}

        {/* Dapodik Announcement & Feature Update Pop-up Modal */}
        {isAnnouncementOpen && (
          <DapodikAnnouncementModal
            isOpen={isAnnouncementOpen}
            onClose={handleCloseAnnouncement}
            settings={settings}
            currentTeacher={currentTeacher}
            onUpdateSettings={handleUpdateSettings}
            onNavigateToSettings={() => {
              setActiveTab('simulator');
            }}
          />
        )}

          {/* Footer with Firebase Cloud status */}
          <footer className="border-t border-[#5e0d16] dark:border-[#380509] bg-[#340408] dark:bg-[#1a0203] py-4 text-center text-xs text-rose-200/80 dark:text-rose-300/70 no-print transition-colors">
            <div className="flex items-center justify-center gap-2 flex-wrap px-4">
              <span>&copy; {new Date().getFullYear()} {settings.schoolName} — Sistem Absensi QR Code Siswa</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Firebase Cloud Connected
              </span>
            </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}
