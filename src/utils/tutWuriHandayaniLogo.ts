import React from 'react';
import {
  SCHOOL_LOGO_SVG,
  SCHOOL_LOGO_DATA_URI,
  getSchoolLogoPNG,
  SchoolLogo,
  SchoolLogoProps,
} from './schoolLogo';

/**
 * School Logo Implementation
 * Replaced default Tut Wuri Handayani logo with official SDN KECIL OGOMOJOLO emblem
 * across all card designs and PDF export templates.
 */

export const TUT_WURI_HANDAYANI_SVG = SCHOOL_LOGO_SVG;
export const TUT_WURI_HANDAYANI_DATA_URI = SCHOOL_LOGO_DATA_URI;

export const getTutWuriHandayaniPNG = getSchoolLogoPNG;

export interface TutWuriHandayaniLogoProps extends SchoolLogoProps {}

export const TutWuriHandayaniLogo: React.FC<TutWuriHandayaniLogoProps> = (props) => {
  return React.createElement(SchoolLogo, {
    ...props,
    title: props.title || 'Logo Resmi SDN Kecil Ogomojolo',
  });
};

export {
  SCHOOL_LOGO_SVG,
  SCHOOL_LOGO_DATA_URI,
  getSchoolLogoPNG,
  SchoolLogo,
};
