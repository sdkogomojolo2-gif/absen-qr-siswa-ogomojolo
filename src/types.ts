export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpa';

export type Gender = 'Laki-laki' | 'Perempuan';

export interface Student {
  id: string;
  nis: string;
  nisn?: string;
  name: string;
  classRoom: string;
  gender: Gender;
  parentPhone: string;
  avatarUrl: string;
  photo?: string; // Base64 encoded string or image URL
  createdAt: string;
  birthPlace?: string;
  birthDate?: string;
  ttl?: string;
  address?: string;
  religion?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  nis: string;
  studentName: string;
  classRoom: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: AttendanceStatus;
  note?: string;
  scannedVia: 'QR Camera' | 'Manual Input' | 'Simulator';
  teacherId?: string;
  teacherName?: string;
  teacherRole?: 'admin' | 'guru';
  teacherType?: TeacherType;
  teacherSubject?: string;
}

export interface SystemSettings {
  lateCutoffTime: string; // e.g. "07:00"
  schoolName: string;
  schoolAddress: string;
  academicYear: string;
  headmasterName?: string; // e.g. "Drs. H. Mulyadi, M.Pd"
  headmasterNip?: string; // e.g. "19680512 199403 1 005"
  headmasterBarcodeUrl?: string; // e.g. Base64 or URL barcode tanda tangan kepala sekolah
  headmasterSignatureUrl?: string; // e.g. Base64 or URL scan/foto tanda tangan asli kepala sekolah
  schoolLogoUrl?: string; // e.g. Base64 or URL logo resmi sekolah
  tutWuriLogoUrl?: string; // e.g. Base64 or URL logo tut wuri handayani / logo kanan
  schoolCity?: string; // e.g. "Jakarta"
  announcementTitle?: string;
  announcementContent?: string;
  announcementVersion?: string;
  announcementDate?: string;
  announcementActive?: boolean;
  defaultCardTemplate?: 'seraphic' | 'nusantara' | 'pelita';
  cardValidityYear?: string;
  cardProgramName?: string;
}

export interface QRPayload {
  app: string;
  nis: string;
  name: string;
  classRoom: string;
}

export type ActiveTab = 'dashboard' | 'scanner' | 'students' | 'simulator';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export type TeacherType = 'admin' | 'wali_kelas' | 'guru_mapel';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  nip?: string;
  subject: string; // e.g. "IPA", "Matematika", "Bahasa Indonesia", "Kurikulum & Administrasi"
  role: 'admin' | 'guru';
  teacherType: TeacherType;
  homeroomClass?: string; // e.g. "Kelas 1", "Kelas 2" (wajib diisi untuk wali_kelas)
}

export type LeaveType = 'Izin' | 'Sakit' | 'Dispensasi';

export interface ScheduledLeave {
  id: string;
  studentId: string;
  nis: string;
  studentName: string;
  classRoom: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  attachmentPhoto?: string; // Base64 or image URL (surat dokter / surat izin)
  createdAt: string;
  recordedBy?: string;
  status: 'Aktif' | 'Selesai' | 'Dibatalkan';
}

export type BehaviorType = 'positive' | 'negative' | 'neutral';

export interface BehaviorLog {
  id: string;
  studentId: string;
  nis: string;
  studentName: string;
  classRoom: string;
  date: string; // YYYY-MM-DD
  type: BehaviorType;
  category: string; // e.g. 'Kedisiplinan', 'Kerapihan', 'Prestasi', 'Sikap / Karakter', 'Lainnya'
  title: string; // e.g. 'Seragam Rapi Lengkap', 'Juara Lomba Matematika', 'Terlambat Masuk'
  points: number; // e.g. +5, +10, -5, -10, 0
  description: string;
  recordedBy: string; // Teacher or Admin name
  createdAt: string;
}


