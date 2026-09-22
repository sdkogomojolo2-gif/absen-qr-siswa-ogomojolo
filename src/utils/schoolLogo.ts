import React from 'react';

/**
 * Official School Emblem / Logo: SDN KECIL OGOMOJOLO
 * Kecamatan Palasa, Kabupaten Parigi Moutong
 * Precision vector reproduction based on the official school emblem.
 */

export const SDN_KECIL_OGOMOJOLO_SHIELD_PATH =
  'M 100,14 ' +
  'C 90,14 80,18 72,24 ' +
  'C 60,18 48,18 36,26 ' +
  'C 24,35 20,50 20,70 ' +
  'C 20,135 30,175 60,212 ' +
  'C 75,230 90,242 100,248 ' +
  'C 110,242 125,230 140,212 ' +
  'C 170,175 180,135 180,70 ' +
  'C 180,50 176,35 164,26 ' +
  'C 152,18 140,18 128,24 ' +
  'C 120,18 110,14 100,14 Z';

export const SDN_KECIL_OGOMOJOLO_INNER_SHIELD_PATH =
  'M 100,19 ' +
  'C 91,19 82,23 75,28 ' +
  'C 64,23 52,23 42,30 ' +
  'C 30,38 26,52 26,72 ' +
  'C 26,132 35,170 64,206 ' +
  'C 78,223 91,235 100,241 ' +
  'C 109,235 122,223 136,206 ' +
  'C 165,170 174,132 174,72 ' +
  'C 174,52 170,38 158,30 ' +
  'C 148,23 136,23 125,28 ' +
  'C 118,23 109,19 100,19 Z';

export const SCHOOL_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 255" width="200" height="255">
  <defs>
    <!-- Sky Gradient -->
    <linearGradient id="ogoLogoSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" />
      <stop offset="45%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>

    <!-- Waterfall Stream Gradient -->
    <linearGradient id="ogoLogoWater" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="25%" stop-color="#7dd3fc" />
      <stop offset="60%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>

    <!-- Flame Gradient -->
    <linearGradient id="ogoLogoFlame" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#dc2626" />
      <stop offset="35%" stop-color="#ea580c" />
      <stop offset="70%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>

    <!-- Ribbon Gradient -->
    <linearGradient id="ogoLogoRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>

    <!-- Clip for circular landscape -->
    <clipPath id="ogoCircleClip">
      <circle cx="100" cy="116" r="50" />
    </clipPath>
  </defs>

  <!-- 1. Outer Crested Shield Background -->
  <path
    d="${SDN_KECIL_OGOMOJOLO_SHIELD_PATH}"
    fill="#ffffff"
    stroke="#0c2d64"
    stroke-width="3.6"
    stroke-linejoin="round"
  />

  <!-- 2. Inner Accent Contour Line -->
  <path
    d="${SDN_KECIL_OGOMOJOLO_INNER_SHIELD_PATH}"
    fill="none"
    stroke="#0284c7"
    stroke-width="1.4"
    opacity="0.9"
  />

  <!-- 3. Arched School Name at Top Header: SDN KECIL OGOMOJOLO -->
  <path id="topNameCurve" d="M 36,52 Q 100,28 164,52" fill="none" />
  <text font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="11" fill="#0c2d64" letter-spacing="0.8">
    <textPath href="#topNameCurve" startOffset="50%" text-anchor="middle">
      SDN KECIL OGOMOJOLO
    </textPath>
  </text>

  <!-- 4. Central Circular Landscape Medallion -->
  <!-- Outer Gold/Blue Ring -->
  <circle cx="100" cy="116" r="53" fill="#ffffff" stroke="#eab308" stroke-width="2" />
  <circle cx="100" cy="116" r="50.5" fill="none" stroke="#0c2d64" stroke-width="1.8" />

  <!-- Landscape inside Circle Clip -->
  <g clip-path="url(#ogoCircleClip)">
    <!-- Sky Background -->
    <rect x="45" y="60" width="110" height="110" fill="url(#ogoLogoSky)" />

    <!-- Clouds -->
    <ellipse cx="78" cy="80" rx="14" ry="6" fill="#ffffff" opacity="0.85" />
    <ellipse cx="85" cy="77" rx="10" ry="5" fill="#ffffff" opacity="0.9" />
    <ellipse cx="124" cy="78" rx="12" ry="5" fill="#ffffff" opacity="0.8" />

    <!-- Birds Flying -->
    <path d="M 68,82 Q 71,79 74,82 Q 77,79 80,82" stroke="#0369a1" stroke-width="1.1" fill="none" stroke-linecap="round" />
    <path d="M 120,77 Q 123,74 126,77 Q 129,74 132,77" stroke="#0369a1" stroke-width="1.1" fill="none" stroke-linecap="round" />

    <!-- Left Green Mountain Range -->
    <path d="M 45,130 L 45,86 Q 62,82 76,96 Q 84,105 90,126 L 90,166 L 45,166 Z" fill="#15803d" />
    <path d="M 48,118 Q 62,94 74,102 Q 82,112 87,128 Z" fill="#166534" opacity="0.8" />

    <!-- Right Green Mountain Range -->
    <path d="M 155,130 L 155,86 Q 138,82 124,96 Q 116,105 110,126 L 110,166 L 155,166 Z" fill="#15803d" />
    <path d="M 152,118 Q 138,94 126,102 Q 118,112 113,128 Z" fill="#166534" opacity="0.8" />

    <!-- Rocky River Canyon Flanks -->
    <path d="M 85,92 L 91,104 L 88,138 L 80,132 Z" fill="#475569" />
    <path d="M 115,92 L 109,104 L 112,138 L 120,132 Z" fill="#475569" />

    <!-- Cascading Waterfall Stream -->
    <path d="M 90,88 L 110,88 L 112,148 L 88,148 Z" fill="url(#ogoLogoWater)" />
    <!-- Water rush highlights -->
    <path d="M 94,90 L 92,142" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.9" />
    <path d="M 98,89 L 98,145" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 102,89 L 102,145" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 106,90 L 108,142" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.9" />

    <!-- River Basin Pool at bottom -->
    <ellipse cx="100" cy="148" rx="26" ry="8" fill="#0284c7" />
    <ellipse cx="100" cy="148" rx="20" ry="5" fill="#bae6fd" opacity="0.8" />
  </g>

  <!-- 5. Flanking Rice (Padi) & Green Leaves on Medallion Sides -->
  <!-- Left: Golden Padi -->
  <g fill="#eab308" stroke="#ca8a04" stroke-width="0.6">
    <ellipse cx="50" cy="100" rx="3.5" ry="5.5" transform="rotate(-35 50 100)" />
    <ellipse cx="48" cy="112" rx="3.5" ry="5.5" transform="rotate(-20 48 112)" />
    <ellipse cx="50" cy="124" rx="3.8" ry="5.8" transform="rotate(-5 50 124)" />
    <ellipse cx="55" cy="136" rx="4" ry="6" transform="rotate(15 55 136)" />
    <ellipse cx="63" cy="146" rx="4.2" ry="6" transform="rotate(35 63 146)" />
  </g>

  <!-- Right: Green Foliage Leaves -->
  <g fill="#22c55e" stroke="#16a34a" stroke-width="0.6">
    <ellipse cx="150" cy="100" rx="3.5" ry="5.5" transform="rotate(35 150 100)" />
    <ellipse cx="152" cy="112" rx="3.5" ry="5.5" transform="rotate(20 152 112)" />
    <ellipse cx="150" cy="124" rx="3.8" ry="5.8" transform="rotate(5 150 124)" />
    <ellipse cx="145" cy="136" rx="4" ry="6" transform="rotate(-15 145 136)" />
    <ellipse cx="137" cy="146" rx="4.2" ry="6" transform="rotate(-35 137 146)" />
  </g>

  <!-- 6. Educational Icons in Center: Book, Torch, Pencil -->
  <!-- Open White Book -->
  <g transform="translate(74, 130)">
    <!-- Left page -->
    <path d="M 26,18 C 16,15 8,17 0,21 L 0,8 C 8,4 16,2 26,5 Z" fill="#ffffff" stroke="#0c2d64" stroke-width="1.5" />
    <path d="M 26,20 C 16,17 8,19 2,23" stroke="#94a3b8" stroke-width="1" fill="none" />
    <!-- Right page -->
    <path d="M 26,18 C 36,15 44,17 52,21 L 52,8 C 44,4 36,2 26,5 Z" fill="#ffffff" stroke="#0c2d64" stroke-width="1.5" />
    <path d="M 26,20 C 36,17 44,19 50,23" stroke="#94a3b8" stroke-width="1" fill="none" />
    <!-- Center spine -->
    <line x1="26" y1="5" x2="26" y2="19" stroke="#0c2d64" stroke-width="2" stroke-linecap="round" />
  </g>

  <!-- Standing Blue Pencil on Right -->
  <g transform="translate(122, 126) rotate(22)">
    <rect x="0" y="0" width="4.5" height="18" fill="#0284c7" stroke="#0369a1" stroke-width="0.5" rx="0.5" />
    <polygon points="0,0 2.25,-5 4.5,0" fill="#fde047" stroke="#ca8a04" stroke-width="0.5" />
    <polygon points="1.2,-2.5 2.25,-5 3.3,-2.5" fill="#0f172a" />
  </g>

  <!-- Golden Torch & Blazing Flame in Center -->
  <g transform="translate(95, 110)">
    <!-- Torch handle -->
    <path d="M 3.5,24 L 6.5,24 L 6,36 L 4,36 Z" fill="#ca8a04" stroke="#854d0e" stroke-width="0.8" />
    <!-- Torch cup -->
    <path d="M 1,23 C 1,20 9,20 9,23 L 7.5,28 L 2.5,28 Z" fill="#eab308" stroke="#ca8a04" stroke-width="0.9" />
    <!-- Fiery Flame -->
    <path d="M 5,2 C 2,8 0,12 2.5,17 C 3.5,19 6.5,19 7.5,17 C 10,12 8,8 5,2 Z" fill="url(#ogoLogoFlame)" />
    <path d="M 5,6 C 3.5,9 3,12 4.5,15 C 5,16 6,16 6.5,15 C 7.5,13 7,10 5,6 Z" fill="#ffffff" opacity="0.9" />
  </g>

  <!-- 7. Horizontal Ribbon Banner: KECAMATAN PALASA -->
  <g transform="translate(32, 172)">
    <!-- Ribbon tails/folds -->
    <polygon points="0,11 -8,16 0,21" fill="#024978" />
    <polygon points="136,11 144,16 136,21" fill="#024978" />
    <!-- Main Ribbon bar with subtle curve -->
    <path
      d="M 0,11 Q 68,6 136,11 L 136,22 Q 68,17 0,22 Z"
      fill="url(#ogoLogoRibbon)"
      stroke="#0c2d64"
      stroke-width="1.3"
    />
    <!-- White Bold Motto: KECAMATAN PALASA -->
    <text
      x="68"
      y="18"
      font-family="'Arial Black', Arial, sans-serif"
      font-weight="900"
      font-size="8.5"
      fill="#ffffff"
      text-anchor="middle"
      letter-spacing="1.2"
    >
      KECAMATAN PALASA
    </text>
  </g>

  <!-- 8. Regional Subtext: KABUPATEN PARIGI MOUTONG -->
  <g transform="translate(35, 206)">
    <!-- Double accent lines -->
    <line x1="8" y1="2" x2="122" y2="2" stroke="#0284c7" stroke-width="1" />
    <line x1="16" y1="16" x2="114" y2="16" stroke="#0284c7" stroke-width="0.8" />
    <text
      x="65"
      y="11"
      font-family="Arial, sans-serif"
      font-weight="bold"
      font-size="7.4"
      fill="#0c2d64"
      text-anchor="middle"
      letter-spacing="0.8"
    >
      KABUPATEN PARIGI MOUTONG
    </text>
  </g>

  <!-- 9. Bottom Trefoil / Green Leaf Accent at shield tip -->
  <g transform="translate(100, 234)">
    <circle cx="0" cy="0" r="2.5" fill="#15803d" />
    <ellipse cx="-4" cy="-1.5" rx="3.5" ry="2" transform="rotate(-30 -4 -1.5)" fill="#22c55e" />
    <ellipse cx="4" cy="-1.5" rx="3.5" ry="2" transform="rotate(30 4 -1.5)" fill="#22c55e" />
    <ellipse cx="0" cy="-4" rx="2" ry="3.5" fill="#22c55e" />
  </g>
</svg>
`.trim();

/**
 * Safe Base64 SVG Data URI for <img> and reliable canvas rasterization
 */
export const SCHOOL_LOGO_DATA_URI =
  typeof window !== 'undefined' && window.btoa
    ? `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(SCHOOL_LOGO_SVG)))}`
    : `data:image/svg+xml;utf8,${encodeURIComponent(SCHOOL_LOGO_SVG)}`;

/**
 * Cached PNG data URL for maximum jsPDF compatibility
 */
let cachedSchoolLogoPng: string | null = null;

export const getSchoolLogoPNG = async (customLogoUrl?: string): Promise<string> => {
  if (customLogoUrl) {
    if (customLogoUrl.startsWith('data:image/png') || customLogoUrl.startsWith('data:image/jpeg') || customLogoUrl.startsWith('data:image/webp')) {
      return customLogoUrl;
    }
  } else if (cachedSchoolLogoPng) {
    return cachedSchoolLogoPng;
  }

  const srcToLoad = customLogoUrl || SCHOOL_LOGO_DATA_URI;

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve('');
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || 300;
        const h = img.naturalHeight || 380;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const pngUrl = canvas.toDataURL('image/png');
          if (!customLogoUrl) {
            cachedSchoolLogoPng = pngUrl;
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

export interface SchoolLogoProps {
  size?: number | string;
  className?: string;
  title?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  size = 36,
  className = '',
  title = 'Logo Resmi SDN Kecil Ogomojolo',
}) => {
  return React.createElement('div', {
    className: `inline-flex items-center justify-center shrink-0 ${className}`,
    style: { width: size, height: size },
    title,
    dangerouslySetInnerHTML: { __html: SCHOOL_LOGO_SVG },
  });
};

// Aliases for seamless compatibility
export const SDN_KECIL_OGOMOJOLO_LOGO_SVG = SCHOOL_LOGO_SVG;
export const SDN_KECIL_OGOMOJOLO_DATA_URI = SCHOOL_LOGO_DATA_URI;
export const SdnKecilOgomojoloLogo = SchoolLogo;
