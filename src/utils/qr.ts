import QRCode from 'qrcode';
import { Student, QRPayload } from '../types';

/**
 * Creates standardized QR payload string for a student
 */
export const createStudentQRPayload = (student: Student): string => {
  const payload: QRPayload = {
    app: 'AbsensiSiswaQR',
    nis: student.nis,
    name: student.name,
    classRoom: student.classRoom
  };
  return JSON.stringify(payload);
};

/**
 * Converts text or JSON string into Data URL image string for QR code
 */
export const generateQRCodeDataURL = async (
  text: string,
  darkColor: string = '#0f172a'
): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: darkColor,
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
};

/**
 * Parses scanned string payload into student identifier or object
 */
export const parseQRPayload = (rawText: string): { nis: string; name?: string } => {
  const trimmed = rawText.trim();
  
  // Attempt JSON parsing
  try {
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === 'object') {
      if (obj.nis) {
        return { nis: String(obj.nis), name: obj.name };
      }
    }
  } catch {
    // Not JSON, fallback to raw string treating it as NIS directly
  }

  return { nis: trimmed };
};
