/**
 * Safe LocalStorage Utility with automatic quota management and error recovery
 */

export function cleanStaleLocalStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Remove legacy migration keys or excess backup cache keys
        if (
          key.startsWith('absensi_cloud_sync_backup_') ||
          key.includes('_v1') ||
          key.startsWith('temp_') ||
          key.startsWith('cache_')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Unable to clean stale localStorage entries:', e);
  }
}

/**
 * Strips or truncates heavy base64 data URLs from JSON objects to fit within local storage limits
 */
function createLightweightCache(value: string): string {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const sanitized = parsed.map((item) => {
        if (typeof item === 'object' && item !== null) {
          const clone = { ...item };
          // If item contains large base64 strings (like photo, photoUrl, or doctorLetterUrl > 2KB), strip for local cache
          if (typeof clone.photo === 'string' && clone.photo.startsWith('data:') && clone.photo.length > 2000) {
            clone.photo = '';
          }
          if (typeof clone.photoUrl === 'string' && clone.photoUrl.startsWith('data:') && clone.photoUrl.length > 2000) {
            clone.photoUrl = '';
          }
          if (typeof clone.doctorLetterUrl === 'string' && clone.doctorLetterUrl.startsWith('data:') && clone.doctorLetterUrl.length > 2000) {
            clone.doctorLetterUrl = '';
          }
          return clone;
        }
        return item;
      });
      return JSON.stringify(sanitized);
    }
    return value;
  } catch {
    return value;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    // Check for quota exceeded error
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('quota'));

    if (isQuota) {
      console.warn(`LocalStorage quota exceeded while saving "${key}". Running cache cleanup...`);
      cleanStaleLocalStorage();

      // Retry once after cleaning stale entries
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        // If still exceeding quota, try saving lightweight version (stripping huge base64 strings from local cache)
        try {
          const lightweight = createLightweightCache(value);
          localStorage.setItem(key, lightweight);
          console.info(`Saved lightweight cached version for "${key}" to preserve quota.`);
          return true;
        } catch (secondErr) {
          console.warn(`Failed to save cached value for "${key}" even in lightweight mode:`, secondErr);
          return false;
        }
      }
    } else {
      console.warn(`Failed to set localStorage key "${key}":`, err);
      return false;
    }
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Failed to read localStorage key "${key}":`, err);
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Failed to remove localStorage key "${key}":`, err);
  }
}
