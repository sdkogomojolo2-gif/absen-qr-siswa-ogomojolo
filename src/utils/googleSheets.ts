import { Student, AttendanceRecord } from '../types';

export interface GoogleSheetsExportResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  message: string;
}

/**
 * Creates a new Google Spreadsheet in Google Drive for the school attendance system.
 */
export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Rekap Absensi',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Data Siswa',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Syncs full data (Attendance Records + Student List) to a Google Spreadsheet.
 */
export async function exportToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  students: Student[],
  attendanceRecords: AttendanceRecord[],
  schoolName: string
): Promise<GoogleSheetsExportResult> {
  try {
    // 1. Prepare "Rekap Absensi" rows
    const attendanceHeader = [
      'No',
      'Tanggal',
      'Waktu WIB',
      'NIS',
      'Nama Siswa',
      'Kelas',
      'Status Kehadiran',
      'Keterangan',
      'Metode Scan',
    ];

    const attendanceRows = attendanceRecords.map((rec, index) => [
      index + 1,
      rec.date,
      rec.time,
      rec.nis,
      rec.studentName,
      rec.classRoom,
      rec.status,
      rec.note || '-',
      rec.scannedVia,
    ]);

    const attendanceSheetValues = [attendanceHeader, ...attendanceRows];

    // 2. Prepare "Data Siswa" rows
    const studentHeader = [
      'No',
      'ID Siswa',
      'NIS',
      'Nama Lengkap',
      'Kelas',
      'Jenis Kelamin',
      'No. HP Orang Tua / WA',
      'Tanggal Terdaftar',
    ];

    const studentRows = students.map((std, index) => [
      index + 1,
      std.id,
      std.nis,
      std.name,
      std.classRoom,
      std.gender,
      std.parentPhone || '-',
      std.createdAt,
    ]);

    const studentSheetValues = [studentHeader, ...studentRows];

    // 3. Clear & Update "Rekap Absensi"
    const updateAttendanceRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Rekap Absensi!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: 'Rekap Absensi!A1',
          majorDimension: 'ROWS',
          values: attendanceSheetValues,
        }),
      }
    );

    if (!updateAttendanceRes.ok) {
      const err = await updateAttendanceRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal memperbarui lembar "Rekap Absensi".');
    }

    // 4. Update "Data Siswa"
    const updateStudentRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Data Siswa!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: 'Data Siswa!A1',
          majorDimension: 'ROWS',
          values: studentSheetValues,
        }),
      }
    );

    if (!updateStudentRes.ok) {
      const err = await updateStudentRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal memperbarui lembar "Data Siswa".');
    }

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      message: `Berhasil mengekspor ${attendanceRecords.length} catatan absensi & ${students.length} data siswa ke Google Sheets!`,
    };
  } catch (error: any) {
    console.error('Google Sheets Sync Error:', error);
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengekspor ke Google Sheets.',
    };
  }
}

/**
 * Appends a new attendance record row to an existing Google Spreadsheet.
 */
export async function appendRecordToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  record: AttendanceRecord,
  rowNumber: number
): Promise<boolean> {
  try {
    const row = [
      rowNumber,
      record.date,
      record.time,
      record.nis,
      record.studentName,
      record.classRoom,
      record.status,
      record.note || '-',
      record.scannedVia,
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Rekap Absensi!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: 'Rekap Absensi!A1',
          majorDimension: 'ROWS',
          values: [row],
        }),
      }
    );

    return res.ok;
  } catch (e) {
    console.error('Failed to append row to Google Sheets:', e);
    return false;
  }
}
