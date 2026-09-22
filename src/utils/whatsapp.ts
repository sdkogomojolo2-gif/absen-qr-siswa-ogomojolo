import { Student, AttendanceRecord, ScheduledLeave, BehaviorLog } from '../types';

/**
 * Formats Indonesian phone number into WhatsApp international format (628xxx)
 */
export const formatPhoneNumberForWA = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, ''); // Keep only digits

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

/**
 * Generates polite WhatsApp notification message for parents
 */
export const generateWAAttendanceMessage = (
  student: Student,
  record: AttendanceRecord,
  schoolName: string
): string => {
  const statusEmoji =
    record.status === 'Hadir'
      ? '✅'
      : record.status === 'Terlambat'
      ? '⏰'
      : record.status === 'Izin' || record.status === 'Sakit'
      ? 'ℹ️'
      : '⚠️';

  return `Yth. Bapak/Ibu Orang Tua/Wali dari *${student.name}* (Kelas ${student.classRoom}),

Memberitahukan bahwa putra/putri Anda telah terdata pada sistem absensi digital *${schoolName}*:

${statusEmoji} *Status*: ${record.status.toUpperCase()}
📅 *Tanggal*: ${record.date}
⏰ *Jam Masuk*: ${record.time} WIB
📌 *NIS*: ${student.nis}
📝 *Keterangan*: ${record.note || 'Tercatat otomatis'}

Terima kasih atas perhatian dan kerja samanya.
_Sistem Absensi Digital ${schoolName}_`;
};

/**
 * Generates Absentee Verification / Follow-Up WhatsApp message
 */
export const generateWAAbsenteeConfirmationMessage = (
  student: Student,
  date: string,
  cutoffTime: string,
  schoolName: string
): string => {
  return `Yth. Bapak/Ibu Orang Tua/Wali dari *${student.name}* (Kelas ${student.classRoom}),

Mohon maaf mengganggu waktunya. Berdasarkan pantauan sistem absensi digital *${schoolName}*, hingga pukul *${cutoffTime} WIB* hari ini (*${date}*), ananda *belum terdata melakukan presensi masuk*.

Mohon konfirmasi mengenai kehadiran/keterangan ananda:
1️⃣ Apakah ananda berhalangan hadir (Sakit / Izin)?
2️⃣ Atau sedang dalam perjalanan menuju sekolah?

Mohon infokan kepada Wali Kelas agar kami dapat memperbarui data presensi ananda.

Terima kasih atas kerja sama dan perhatian Bapak/Ibu.
_Wali Kelas & Tim Kesiswaan ${schoolName}_`;
};

/**
 * Opens WhatsApp Absentee Follow-Up
 */
export const openWAAbsenteeNotification = (
  student: Student,
  date: string,
  cutoffTime: string,
  schoolName: string
): boolean => {
  const formattedPhone = formatPhoneNumberForWA(student.parentPhone);
  if (!formattedPhone) {
    alert(`Nomor HP Orang Tua untuk ${student.name} belum terdaftar.`);
    return false;
  }

  const message = generateWAAbsenteeConfirmationMessage(student, date, cutoffTime, schoolName);
  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

/**
 * Generates Scheduled Leave confirmation message for parent
 */
export const generateWALeaveMessage = (
  student: Student,
  leave: ScheduledLeave,
  schoolName: string
): string => {
  return `Yth. Bapak/Ibu Orang Tua/Wali dari *${student.name}* (Kelas ${student.classRoom}),

Permohonan izin/sakit siswa telah *tercatat resmi* di sistem *${schoolName}*:

📋 *Jenis*: ${leave.type.toUpperCase()}
📅 *Periode*: ${leave.startDate} s/d ${leave.endDate}
📝 *Keterangan*: ${leave.reason || '-'}
🩺 *Bukti Surat*: ${leave.attachmentPhoto ? 'Terlampir' : 'Konfirmasi Wali'}

Semoga lekas sembuh dan dapat beraktivitas kembali dengan baik.
_Sistem Absensi Digital ${schoolName}_`;
};

/**
 * Generates Behavior Log / Character Points notification
 */
export const generateWABehaviorMessage = (
  student: Student,
  log: BehaviorLog,
  totalBalance: number,
  schoolName: string
): string => {
  const isPositive = log.type === 'positive';
  const icon = isPositive ? '🌟' : '⚠️';
  const pointPrefix = log.points > 0 ? `+${log.points}` : `${log.points}`;

  return `Yth. Bapak/Ibu Orang Tua/Wali dari *${student.name}* (Kelas ${student.classRoom}),

Laporan Jurnal Perkembangan & Karakter Siswa dari *${schoolName}*:

${icon} *Kategori*: ${log.category}
📌 *Catatan*: *${log.title}* (${pointPrefix} Poin)
📝 *Keterangan*: ${log.description || '-'}
👨‍🏫 *Pencatat*: ${log.recordedBy || 'Wali Kelas'}
📅 *Tanggal*: ${log.date}
⭐ *Total Poin Karakter Saat Ini*: ${totalBalance} Poin

Terima kasih atas sinergi dalam mendidik dan membimbing ananda.
_Tim Kesiswaan ${schoolName}_`;
};

/**
 * Opens WhatsApp Web/App directly with the pre-filled text
 */
export const openWhatsAppNotification = (
  student: Student,
  record: AttendanceRecord,
  schoolName: string
): boolean => {
  const formattedPhone = formatPhoneNumberForWA(student.parentPhone);
  if (!formattedPhone) {
    alert(`Nomor HP Orang Tua untuk ${student.name} belum diisi.`);
    return false;
  }

  const message = generateWAAttendanceMessage(student, record, schoolName);
  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

/**
 * Copies WhatsApp message to user's clipboard
 */
export const copyWAMessageToClipboard = async (
  messageOrStudent: string | Student,
  record?: AttendanceRecord,
  schoolName?: string
): Promise<boolean> => {
  try {
    let messageText = '';
    if (typeof messageOrStudent === 'string') {
      messageText = messageOrStudent;
    } else if (record && schoolName) {
      messageText = generateWAAttendanceMessage(messageOrStudent, record, schoolName);
    }
    await navigator.clipboard.writeText(messageText);
    return true;
  } catch (err) {
    console.error('Failed to copy WA message:', err);
    return false;
  }
};

