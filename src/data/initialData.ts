import { Student, AttendanceRecord, AttendanceStatus, SystemSettings, Teacher } from '../types';
import { MALE_BW_AVATAR, FEMALE_BW_AVATAR } from '../utils/avatars';

export const DEFAULT_SETTINGS: SystemSettings = {
  lateCutoffTime: '07:00',
  schoolName: 'SDN KECIL OGOMOJOLO',
  schoolAddress: 'Desa Ogomojolo, Kec. Palasa, Kab. Parigi Moutong',
  academicYear: '2025/2026',
  headmasterName: 'Drs. H. Mulyadi, M.Pd',
  headmasterNip: '19680512 199403 1 005',
  schoolCity: 'Parigi Moutong',
  defaultCardTemplate: 'seraphic',
};

export const SD_CLASSES = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

// Alias for backwards compatibility
export const SMP_CLASSES = SD_CLASSES;

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-admin',
    name: 'MOH. FADLI',
    nip: '199903202025211020',
    email: 'Fadli46046@gmail.com',
    subject: 'Administrator Sekolah',
    role: 'admin',
    teacherType: 'admin',
  },
  {
    id: 'tch-wk-1',
    name: 'SITI RAHMAH, S.Pd',
    nip: '19880214 201201 2 003',
    email: 'sitirahmah@sdnogomojolo.sch.id',
    subject: 'Wali Kelas 1',
    role: 'guru',
    teacherType: 'wali_kelas',
    homeroomClass: 'Kelas 1',
  },
  {
    id: 'tch-wk-2',
    name: 'AHMAD YANI, S.Pd',
    nip: '19850620 201001 1 008',
    email: 'ahmadyani@sdnogomojolo.sch.id',
    subject: 'Wali Kelas 2',
    role: 'guru',
    teacherType: 'wali_kelas',
    homeroomClass: 'Kelas 2',
  },
  {
    id: 'tch-wk-3',
    name: 'NURHAYATI, S.Pd',
    nip: '19910415 201502 2 005',
    email: 'nurhayati@sdnogomojolo.sch.id',
    subject: 'Wali Kelas 3',
    role: 'guru',
    teacherType: 'wali_kelas',
    homeroomClass: 'Kelas 3',
  },
  {
    id: 'tch-wk-4',
    name: 'HENDRA KURNIAWAN, S.Pd',
    nip: '19870910 201101 1 006',
    email: 'hendra@sdnogomojolo.sch.id',
    subject: 'Wali Kelas 4',
    role: 'guru',
    teacherType: 'wali_kelas',
    homeroomClass: 'Kelas 4',
  },
  {
    id: 'tch-wk-5',
    name: 'DEWI LESTARI, S.Pd',
    nip: '19930722 201803 2 004',
    email: 'dewilestari@sdnogomojolo.sch.id',
    subject: 'Wali Kelas 5',
    role: 'guru',
    teacherType: 'wali_kelas',
    homeroomClass: 'Kelas 5',
  },
  {
    id: 'tch-wk-6',
    name: 'BAMBANG WIJAYA, S.Pd',
    nip: '19821105 200801 1 002',
    email: 'bambang@sdnogomojolo.sch.id',
    subject: 'Wali Kelas 6',
    role: 'guru',
    teacherType: 'wali_kelas',
    homeroomClass: 'Kelas 6',
  },
  {
    id: 'tch-mapel-pjok',
    name: 'MUHAMMAD ILHAM, S.Pd',
    nip: '19900812 201701 1 007',
    email: 'ilham.pjok@sdnogomojolo.sch.id',
    subject: 'PJOK / Penjasorkes',
    role: 'guru',
    teacherType: 'guru_mapel',
  },
  {
    id: 'tch-mapel-pai',
    name: 'NUR AISYAH, S.Pd.I',
    nip: '19920315 201902 2 004',
    email: 'nuraisyah.pai@sdnogomojolo.sch.id',
    subject: 'Pendidikan Agama Islam (PAI)',
    role: 'guru',
    teacherType: 'guru_mapel',
  },
];

export const INITIAL_STUDENTS: Student[] = [];

export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateInitialAttendance = (_todayStr: string): AttendanceRecord[] => {
  return [];
};

