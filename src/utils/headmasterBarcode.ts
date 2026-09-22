import React from 'react';

/**
 * Headmaster Digital Signature Barcode / QR Code (Tanda Tangan Elektronik - TTE)
 * Contains the official SDN Kecil Ogomojolo emblem and verification QR pattern.
 */

// SVG for SDN Kecil Ogomojolo official school emblem
export const SDN_KECIL_OGOMOJOLO_LOGO_INNER = `
  <defs>
    <clipPath id="ogoInnerCircleClip">
      <circle cx="100" cy="100" r="72" />
    </clipPath>
    <linearGradient id="ogoSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bbf2f6" />
      <stop offset="60%" stop-color="#e0f7fa" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>
    <linearGradient id="ogoWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#e0f7fa" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="ogoFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#dc2626" />
      <stop offset="40%" stop-color="#ea580c" />
      <stop offset="80%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <circle cx="100" cy="100" r="96" fill="#ffffff" stroke="#0284c7" stroke-width="3" />
  <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#0369a1" stroke-width="1.5" />

  <!-- Outer Text Arc: SDN KECIL OGOMOJOLO -->
  <path id="ogoTextArcTop" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
  <text font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="12.5" fill="#0c4a6e" letter-spacing="1.2">
    <textPath href="#ogoTextArcTop" startOffset="50%" text-anchor="middle">
      SDN KECIL OGOMOJOLO
    </textPath>
  </text>

  <!-- Inner Scenic Landscape Badge -->
  <g clip-path="url(#ogoInnerCircleClip)">
    <!-- Sky -->
    <rect x="25" y="25" width="150" height="150" fill="url(#ogoSkyGrad)" />
    <!-- Flying birds in sky -->
    <path d="M 68,48 Q 72,45 76,48 Q 80,45 84,48" stroke="#0369a1" stroke-width="1.2" fill="none" stroke-linecap="round" />
    <path d="M 116,42 Q 120,39 124,42 Q 128,39 132,42" stroke="#0369a1" stroke-width="1.2" fill="none" stroke-linecap="round" />

    <!-- Green Forest Mountains on Left & Right -->
    <path d="M 25,120 L 25,65 Q 45,60 65,80 Q 75,90 85,110 L 85,140 Z" fill="#15803d" />
    <path d="M 28,110 Q 42,75 58,85 Q 72,95 80,115 Z" fill="#166534" opacity="0.8" />

    <path d="M 175,120 L 175,65 Q 155,60 135,80 Q 125,90 115,110 L 115,140 Z" fill="#15803d" />
    <path d="M 172,110 Q 158,75 142,85 Q 128,95 120,115 Z" fill="#166534" opacity="0.8" />

    <!-- Rocky cliffs around waterfall -->
    <path d="M 75,70 L 88,85 L 82,120 L 70,115 Z" fill="#475569" />
    <path d="M 125,70 L 112,85 L 118,120 L 130,115 Z" fill="#475569" />

    <!-- Waterfall Center Stream -->
    <path d="M 85,65 L 115,65 L 118,135 L 82,135 Z" fill="url(#ogoWaterGrad)" />
    <!-- Water flows highlights -->
    <path d="M 90,68 L 88,125" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    <path d="M 96,66 L 95,130" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 100,65 L 100,132" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
    <path d="M 105,66 L 106,130" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 111,68 L 112,125" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />

    <!-- River Basin -->
    <ellipse cx="100" cy="135" rx="35" ry="10" fill="#0284c7" opacity="0.7" />
    <ellipse cx="100" cy="135" rx="28" ry="6" fill="#e0f2fe" opacity="0.85" />
  </g>

  <!-- Inner Circle Rim -->
  <circle cx="100" cy="100" r="72" fill="none" stroke="#0284c7" stroke-width="2.5" />

  <!-- Flanking Padi (Left - Golden Rice) -->
  <g fill="#eab308" stroke="#ca8a04" stroke-width="0.5">
    <ellipse cx="32" cy="98" rx="4" ry="6" transform="rotate(-30 32 98)" />
    <ellipse cx="30" cy="112" rx="4" ry="6" transform="rotate(-20 30 112)" />
    <ellipse cx="33" cy="126" rx="4.5" ry="6.5" transform="rotate(-10 33 126)" />
    <ellipse cx="40" cy="138" rx="4.5" ry="6.5" transform="rotate(10 40 138)" />
    <ellipse cx="50" cy="148" rx="5" ry="6.5" transform="rotate(30 50 148)" />
  </g>

  <!-- Flanking Kapas / Daun (Right - Green leaves) -->
  <g fill="#22c55e" stroke="#16a34a" stroke-width="0.5">
    <ellipse cx="168" cy="98" rx="4" ry="6" transform="rotate(30 168 98)" />
    <ellipse cx="170" cy="112" rx="4" ry="6" transform="rotate(20 170 112)" />
    <ellipse cx="167" cy="126" rx="4.5" ry="6.5" transform="rotate(10 167 126)" />
    <ellipse cx="160" cy="138" rx="4.5" ry="6.5" transform="rotate(-10 160 138)" />
    <ellipse cx="150" cy="148" rx="5" ry="6.5" transform="rotate(-30 150 148)" />
  </g>

  <!-- Open Book in Foreground (Education symbol) -->
  <g transform="translate(68, 116)">
    <!-- Book pages left -->
    <path d="M 32,22 C 20,18 10,21 0,26 L 0,10 C 10,5 20,2 32,6 Z" fill="#ffffff" stroke="#0284c7" stroke-width="1.8" />
    <path d="M 32,24 C 20,20 10,23 2,28" stroke="#cbd5e1" stroke-width="1.2" fill="none" />
    <!-- Book pages right -->
    <path d="M 32,22 C 44,18 54,21 64,26 L 64,10 C 54,5 44,2 32,6 Z" fill="#ffffff" stroke="#0284c7" stroke-width="1.8" />
    <path d="M 32,24 C 44,20 54,23 62,28" stroke="#cbd5e1" stroke-width="1.2" fill="none" />
    <!-- Spine binding -->
    <line x1="32" y1="6" x2="32" y2="23" stroke="#0369a1" stroke-width="2.2" stroke-linecap="round" />
  </g>

  <!-- Blue Pencil on the Right -->
  <g transform="translate(132, 112) rotate(22)">
    <rect x="0" y="0" width="5" height="22" fill="#0284c7" rx="1" />
    <polygon points="0,0 2.5,-6 5,0" fill="#fde047" stroke="#ca8a04" stroke-width="0.5" />
    <polygon points="1.5,-3 2.5,-6 3.5,-3" fill="#0f172a" />
  </g>

  <!-- Golden Torch (Obor) with Bright Flame in the Center -->
  <g transform="translate(94, 92)">
    <!-- Torch handle -->
    <path d="M 4,28 L 8,28 L 7,42 L 5,42 Z" fill="#ca8a04" stroke="#854d0e" stroke-width="0.8" />
    <!-- Torch cup / bowl -->
    <path d="M 1,28 C 1,24 11,24 11,28 L 9,33 L 3,33 Z" fill="#eab308" stroke="#ca8a04" stroke-width="1" />
    <ellipse cx="6" cy="27" rx="5" ry="2" fill="#fef08a" />
    <!-- Fiery Torch Flame -->
    <path d="M 6,5 C 2,12 0,16 3,22 C 4,24 8,24 9,22 C 12,16 10,12 6,5 Z" fill="url(#ogoFlameGrad)" />
    <path d="M 6,10 C 4,14 3,17 5,20 C 5.5,21 6.5,21 7,20 C 9,17 8,14 6,10 Z" fill="#ffffff" opacity="0.85" />
  </g>

  <!-- Ribbon Banner Below: KECAMATAN PALASA -->
  <g transform="translate(35, 142)">
    <!-- Ribbon tails -->
    <polygon points="0,12 -8,18 0,24" fill="#0369a1" />
    <polygon points="130,12 138,18 130,24" fill="#0369a1" />
    <!-- Ribbon body -->
    <path d="M 0,12 Q 65,6 130,12 L 130,24 Q 65,18 0,24 Z" fill="#0284c7" stroke="#0369a1" stroke-width="1.2" />
    <text x="65" y="19" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="7.5" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      KECAMATAN PALASA
    </text>
  </g>

  <!-- Sub-banner: KABUPATEN PARIGI MOUTONG -->
  <g transform="translate(42, 162)">
    <text x="58" y="8" font-family="Arial, sans-serif" font-weight="bold" font-size="6.8" fill="#0369a1" text-anchor="middle" letter-spacing="0.8">
      KABUPATEN PARIGI MOUTONG
    </text>
    <path d="M 15,12 Q 58,15 101,12" stroke="#0284c7" stroke-width="1" fill="none" />
  </g>
`.trim();

export const SDN_KECIL_OGOMOJOLO_LOGO_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${SDN_KECIL_OGOMOJOLO_LOGO_INNER}</svg>`;

/**
 * Complete, standalone SVG for the Principal's Signature Barcode (QR Code TTE).
 * Incorporates the 29x29 QR code matrix with the SDN Kecil Ogomojolo emblem in the center.
 */
export const HEADMASTER_DEFAULT_BARCODE_SVG = `
<svg viewBox="0 0 340 340" width="340" height="340" xmlns="http://www.w3.org/2000/svg">
  <!-- White clean background with quiet margin -->
  <rect width="340" height="340" fill="#ffffff" rx="16" />

  <!-- QR Code Matrix: 29 x 29 modules. Each module is 10 x 10 px with margin of 25px -->
  <g fill="#000000" transform="translate(25, 25)">
    <!-- Finder Pattern Top-Left (7x7) -->
    <rect x="0" y="0" width="70" height="70" fill="#000000" rx="4" />
    <rect x="10" y="10" width="50" height="50" fill="#ffffff" rx="2" />
    <rect x="20" y="20" width="30" height="30" fill="#000000" rx="2" />

    <!-- Finder Pattern Top-Right (7x7) -->
    <rect x="220" y="0" width="70" height="70" fill="#000000" rx="4" />
    <rect x="230" y="10" width="50" height="50" fill="#ffffff" rx="2" />
    <rect x="240" y="20" width="30" height="30" fill="#000000" rx="2" />

    <!-- Finder Pattern Bottom-Left (7x7) -->
    <rect x="0" y="220" width="70" height="70" fill="#000000" rx="4" />
    <rect x="10" y="230" width="50" height="50" fill="#ffffff" rx="2" />
    <rect x="20" y="240" width="30" height="30" fill="#000000" rx="2" />

    <!-- Alignment Pattern (Bottom-Right, 5x5) -->
    <rect x="200" y="200" width="50" height="50" fill="#000000" rx="3" />
    <rect x="210" y="210" width="30" height="30" fill="#ffffff" rx="1" />
    <rect x="220" y="220" width="10" height="10" fill="#000000" rx="1" />

    <!-- Timing Patterns -->
    <!-- Horizontal timing (Row 6) -->
    <rect x="80" y="60" width="10" height="10" /><rect x="100" y="60" width="10" height="10" />
    <rect x="120" y="60" width="10" height="10" /><rect x="140" y="60" width="10" height="10" />
    <rect x="160" y="60" width="10" height="10" /><rect x="180" y="60" width="10" height="10" />
    <rect x="200" y="60" width="10" height="10" />

    <!-- Vertical timing (Col 6) -->
    <rect x="60" y="80" width="10" height="10" /><rect x="60" y="100" width="10" height="10" />
    <rect x="60" y="120" width="10" height="10" /><rect x="60" y="140" width="10" height="10" />
    <rect x="60" y="160" width="10" height="10" /><rect x="60" y="180" width="10" height="10" />
    <rect x="60" y="200" width="10" height="10" />

    <!-- Top Area QR Data Modules -->
    <rect x="80" y="10" width="10" height="10" /><rect x="110" y="10" width="10" height="10" />
    <rect x="130" y="10" width="10" height="10" /><rect x="150" y="10" width="10" height="10" />
    <rect x="180" y="10" width="10" height="10" /><rect x="200" y="10" width="10" height="10" />

    <rect x="90" y="20" width="10" height="10" /><rect x="120" y="20" width="10" height="10" />
    <rect x="140" y="20" width="10" height="10" /><rect x="170" y="20" width="10" height="10" />
    <rect x="190" y="20" width="10" height="10" />

    <rect x="80" y="30" width="10" height="10" /><rect x="100" y="30" width="10" height="10" />
    <rect x="130" y="30" width="10" height="10" /><rect x="160" y="30" width="10" height="10" />
    <rect x="180" y="30" width="10" height="10" /><rect x="200" y="30" width="10" height="10" />

    <rect x="90" y="40" width="10" height="10" /><rect x="110" y="40" width="10" height="10" />
    <rect x="140" y="40" width="10" height="10" /><rect x="170" y="40" width="10" height="10" />
    <rect x="190" y="40" width="10" height="10" />

    <!-- Left / Right Flank Data Modules -->
    <rect x="10" y="80" width="10" height="10" /><rect x="30" y="80" width="10" height="10" />
    <rect x="220" y="80" width="10" height="10" /><rect x="240" y="80" width="10" height="10" />
    <rect x="260" y="80" width="10" height="10" /><rect x="280" y="80" width="10" height="10" />

    <rect x="0" y="90" width="10" height="10" /><rect x="40" y="90" width="10" height="10" />
    <rect x="230" y="90" width="10" height="10" /><rect x="250" y="90" width="10" height="10" />
    <rect x="270" y="90" width="10" height="10" />

    <rect x="20" y="100" width="10" height="10" /><rect x="50" y="100" width="10" height="10" />
    <rect x="220" y="100" width="10" height="10" /><rect x="240" y="100" width="10" height="10" />
    <rect x="280" y="100" width="10" height="10" />

    <rect x="10" y="110" width="10" height="10" /><rect x="40" y="110" width="10" height="10" />
    <rect x="230" y="110" width="10" height="10" /><rect x="260" y="110" width="10" height="10" />

    <rect x="30" y="120" width="10" height="10" /><rect x="50" y="120" width="10" height="10" />
    <rect x="220" y="120" width="10" height="10" /><rect x="250" y="120" width="10" height="10" />
    <rect x="270" y="120" width="10" height="10" />

    <rect x="0" y="130" width="10" height="10" /><rect x="20" y="130" width="10" height="10" />
    <rect x="40" y="130" width="10" height="10" />
    <rect x="240" y="130" width="10" height="10" /><rect x="280" y="130" width="10" height="10" />

    <rect x="10" y="140" width="10" height="10" /><rect x="30" y="140" width="10" height="10" />
    <rect x="230" y="140" width="10" height="10" /><rect x="250" y="140" width="10" height="10" />
    <rect x="270" y="140" width="10" height="10" />

    <rect x="20" y="150" width="10" height="10" /><rect x="50" y="150" width="10" height="10" />
    <rect x="220" y="150" width="10" height="10" /><rect x="260" y="150" width="10" height="10" />

    <rect x="10" y="160" width="10" height="10" /><rect x="40" y="160" width="10" height="10" />
    <rect x="240" y="160" width="10" height="10" /><rect x="270" y="160" width="10" height="10" />

    <rect x="0" y="170" width="10" height="10" /><rect x="30" y="170" width="10" height="10" />
    <rect x="50" y="170" width="10" height="10" />
    <rect x="230" y="170" width="10" height="10" /><rect x="250" y="170" width="10" height="10" />
    <rect x="280" y="170" width="10" height="10" />

    <rect x="20" y="180" width="10" height="10" /><rect x="40" y="180" width="10" height="10" />
    <rect x="220" y="180" width="10" height="10" /><rect x="260" y="180" width="10" height="10" />

    <rect x="10" y="190" width="10" height="10" /><rect x="30" y="190" width="10" height="10" />
    <rect x="240" y="190" width="10" height="10" /><rect x="270" y="190" width="10" height="10" />

    <rect x="40" y="200" width="10" height="10" /><rect x="260" y="200" width="10" height="10" /><rect x="280" y="200" width="10" height="10" />

    <!-- Bottom Center & Right Modules -->
    <rect x="80" y="220" width="10" height="10" /><rect x="100" y="220" width="10" height="10" />
    <rect x="130" y="220" width="10" height="10" /><rect x="150" y="220" width="10" height="10" />
    <rect x="170" y="220" width="10" height="10" /><rect x="260" y="220" width="10" height="10" />

    <rect x="90" y="230" width="10" height="10" /><rect x="110" y="230" width="10" height="10" />
    <rect x="140" y="230" width="10" height="10" /><rect x="160" y="230" width="10" height="10" />
    <rect x="180" y="230" width="10" height="10" /><rect x="270" y="230" width="10" height="10" />

    <rect x="80" y="240" width="10" height="10" /><rect x="120" y="240" width="10" height="10" />
    <rect x="150" y="240" width="10" height="10" /><rect x="170" y="240" width="10" height="10" />
    <rect x="260" y="240" width="10" height="10" /><rect x="280" y="240" width="10" height="10" />

    <rect x="90" y="250" width="10" height="10" /><rect x="110" y="250" width="10" height="10" />
    <rect x="130" y="250" width="10" height="10" /><rect x="160" y="250" width="10" height="10" />
    <rect x="180" y="250" width="10" height="10" /><rect x="270" y="250" width="10" height="10" />

    <rect x="80" y="260" width="10" height="10" /><rect x="100" y="260" width="10" height="10" />
    <rect x="140" y="260" width="10" height="10" /><rect x="170" y="260" width="10" height="10" />
    <rect x="200" y="260" width="10" height="10" /><rect x="260" y="260" width="10" height="10" />

    <rect x="90" y="270" width="10" height="10" /><rect x="120" y="270" width="10" height="10" />
    <rect x="150" y="270" width="10" height="10" /><rect x="180" y="270" width="10" height="10" />
    <rect x="210" y="270" width="10" height="10" /><rect x="280" y="270" width="10" height="10" />

    <rect x="80" y="280" width="10" height="10" /><rect x="110" y="280" width="10" height="10" />
    <rect x="130" y="280" width="10" height="10" /><rect x="160" y="280" width="10" height="10" />
    <rect x="190" y="280" width="10" height="10" /><rect x="220" y="280" width="10" height="10" />
    <rect x="270" y="280" width="10" height="10" />
  </g>

  <!-- Center White Shield to host the School Logo -->
  <rect x="105" y="105" width="130" height="130" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8" />

  <!-- Center Official Logo Emblem of SDN KECIL OGOMOJOLO -->
  <g transform="translate(108, 108) scale(0.62)">
    ${SDN_KECIL_OGOMOJOLO_LOGO_INNER}
  </g>
</svg>
`.trim();

/**
 * Base64 Data URI for the Headmaster Signature Barcode.
 * Suitable for img src and jsPDF embedding.
 */
export const HEADMASTER_DEFAULT_BARCODE_DATA_URI =
  typeof window !== 'undefined' && window.btoa
    ? `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(HEADMASTER_DEFAULT_BARCODE_SVG)))}`
    : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(HEADMASTER_DEFAULT_BARCODE_SVG)}`;

let cachedBarcodePng: string | null = null;

/**
 * Rasterizes the Barcode SVG to a high-resolution PNG Data URL for jsPDF compatibility.
 */
export const getHeadmasterBarcodePNG = async (customBarcodeUrl?: string): Promise<string> => {
  if (customBarcodeUrl) {
    if (
      customBarcodeUrl.startsWith('data:image/png') ||
      customBarcodeUrl.startsWith('data:image/jpeg') ||
      customBarcodeUrl.startsWith('data:image/webp')
    ) {
      return customBarcodeUrl;
    }
  } else if (cachedBarcodePng) {
    return cachedBarcodePng;
  }

  const srcToLoad = customBarcodeUrl || HEADMASTER_DEFAULT_BARCODE_DATA_URI;

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve('');
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || 340;
        const h = img.naturalHeight || 340;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const pngUrl = canvas.toDataURL('image/png');
          if (!customBarcodeUrl) {
            cachedBarcodePng = pngUrl;
          }
          resolve(pngUrl);
        } else {
          resolve('');
        }
      } catch {
        resolve('');
      }
    };
    img.onerror = () => {
      resolve('');
    };
    img.src = srcToLoad;
  });
};

export interface HeadmasterBarcodeProps {
  customBarcodeUrl?: string;
  size?: number | string;
  className?: string;
}

export const HeadmasterBarcode: React.FC<HeadmasterBarcodeProps> = ({
  customBarcodeUrl,
  size = 56,
  className = '',
}) => {
  const src = customBarcodeUrl || HEADMASTER_DEFAULT_BARCODE_DATA_URI;

  return React.createElement(
    'div',
    {
      className: `relative flex flex-col items-center justify-center ${className}`,
      style: { width: size, height: size },
    },
    React.createElement('img', {
      src,
      alt: 'Barcode TTE Kepala Sekolah',
      className: 'w-full h-full object-contain p-0.5 bg-white rounded border border-slate-200 shadow-2xs',
      referrerPolicy: 'no-referrer',
    })
  );
};
