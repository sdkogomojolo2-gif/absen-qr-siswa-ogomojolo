/**
 * High-performance Client-side Image Compression Utility
 * Resizes and compresses uploaded photos (student portraits & leave letters)
 * to keep data under 15-30 KB per student, allowing hundreds of student records
 * to fit smoothly in memory, LocalStorage, and Firebase Firestore.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Compresses an image File or Base64 string using Canvas
 */
export async function compressImage(
  source: File | string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 300,
    maxHeight = 360,
    quality = 0.75,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise<string>((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate aspect ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context not available');
        }

        // Draw white background for clean transparency handling
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Export as compressed data URL
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.error('Image compression canvas processing error:', err);
        reject(err);
      }
    };

    img.onerror = (err) => {
      console.error('Failed to load image for compression:', err);
      reject(new Error('Format file gambar tidak didukung atau rusak.'));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        } else {
          reject(new Error('Gagal membaca file gambar.'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Specifically tuned for Student ID card pas foto portraits (240x320 px, ~15-25 KB)
 */
export async function compressStudentPhoto(fileOrSource: File | string): Promise<string> {
  return compressImage(fileOrSource, {
    maxWidth: 240,
    maxHeight: 320,
    quality: 0.75,
    mimeType: 'image/jpeg',
  });
}

/**
 * Specifically tuned for Doctor / Parent leave letters (640x800 px, ~35-50 KB)
 */
export async function compressLeaveLetter(fileOrSource: File | string): Promise<string> {
  return compressImage(fileOrSource, {
    maxWidth: 640,
    maxHeight: 800,
    quality: 0.68,
    mimeType: 'image/jpeg',
  });
}
