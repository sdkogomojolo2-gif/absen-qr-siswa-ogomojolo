export const MALE_BW_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%231e293b'/><circle cx='50' cy='36' r='18' fill='%23ffffff'/><path d='M16 86c0-18.7 15.2-34 34-34s34 15.3 34 34v4H16v-4z' fill='%23ffffff'/></svg>`;

export const FEMALE_BW_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%231e293b'/><path d='M50 16c-11 0-20 9-20 20 0 8 5 15 12 18-14 4-24 16-24 30v4h64v-4c0-14-10-26-24-30 7-3 12-10 12-18 0-11-9-20-20-20z' fill='%23ffffff'/></svg>`;

export const getDefaultAvatar = (gender: 'Laki-laki' | 'Perempuan'): string => {
  return gender === 'Perempuan' ? FEMALE_BW_AVATAR : MALE_BW_AVATAR;
};
