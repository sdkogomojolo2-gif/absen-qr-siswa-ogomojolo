# Firestore Security Specification

## 1. System Invariants
- `students`: Documents must have valid identifiers, NIS, name, classroom, and gender.
- `attendance`: Documents must include a valid studentId, date (YYYY-MM-DD), status in ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa'], and scannedVia.
- `teachers`: Documents must specify name, email, role, and teacherType.
- `settings`: System-wide settings stored at `/settings/{settingId}`.
- `cloud_sync`: Documents keyed by syncCode containing backup payloads.

## 2. Dirty Dozen Payloads (Target Test Payloads)
1. Injecting 2MB string into student name.
2. Tampering student ID with invalid regex characters (`$$$injection///`).
3. Attendance record with invalid status (`Status: 'Bolos'`).
4. Attendance record with missing studentId or NIS.
5. Teacher document with invalid role (`role: 'super_hacker'`).
6. Unauthenticated write to `/settings/school`.
7. Overwriting cloud sync with empty syncCode.
8. Modifying immutable ID fields during updates.
9. Blanketing read or write without valid path structure.
10. Injecting unapproved schema fields into Student.
11. Malformed timestamp or date pattern on AttendanceRecord.
12. Denial of wallet attack via infinite payload sizes.

## 3. Audit Verification
All validation helpers (`isValidStudent`, `isValidAttendance`, `isValidTeacher`, `isValidSettings`, `isValidCloudSync`) enforce size bounds, regex guards, and valid enums.
