export const palette = {
  light: {
    background: '#FBF7F5',
    backgroundAlt: '#FFF3F0',
    surface: '#FFFFFF',
    surfaceAlt: '#FFF4F1',
    surfaceElevated: '#FFFFFF',
    primary: '#E73D4B',
    primaryPressed: '#C92F3D',
    primarySoft: '#FFE4E6',
    danger: '#E73D4B',
    dangerSoft: '#FFE4E6',
    success: '#1F9D69',
    successSoft: '#DCFCEB',
    warning: '#C47A13',
    warningSoft: '#FFF0CC',
    info: '#4768D8',
    infoSoft: '#E8ECFF',
    text: '#201719',
    textMuted: '#756266',
    textSubtle: '#9A868A',
    border: '#EEDBDD',
    borderStrong: '#E2BFC4',
    input: '#FFFFFF',
    overlay: 'rgba(24, 16, 18, 0.48)',
    shadow: 'rgba(49, 24, 28, 0.12)',
    white: '#FFFFFF',
    black: '#000000',
    cardOverlay: 'rgba(231, 61, 75, 0.06)',
  },
  dark: {
    background: '#121012',
    backgroundAlt: '#1A1417',
    surface: '#1D181B',
    surfaceAlt: '#281F23',
    surfaceElevated: '#231D20',
    primary: '#FF6672',
    primaryPressed: '#FF4B5A',
    primarySoft: '#3A2228',
    danger: '#FF6672',
    dangerSoft: '#3A2228',
    success: '#63D89D',
    successSoft: '#163A2B',
    warning: '#F4BE5E',
    warningSoft: '#3D2D13',
    info: '#8EA2FF',
    infoSoft: '#222A4D',
    text: '#FFF9F8',
    textMuted: '#CFBEC2',
    textSubtle: '#A9959B',
    border: '#3B2D31',
    borderStrong: '#554149',
    input: '#1B1619',
    overlay: 'rgba(0, 0, 0, 0.62)',
    shadow: 'rgba(0, 0, 0, 0.35)',
    white: '#FFFFFF',
    black: '#000000',
    cardOverlay: 'rgba(255, 102, 114, 0.08)',
  },
};

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};

const typography = {
  display: 34,
  title: 28,
  headline: 22,
  subtitle: 18,
  body: 15,
  caption: 13,
  tiny: 11,
};

export function buildTheme(mode = 'light') {
  const colors = palette[mode] || palette.light;
  return {
    mode,
    colors,
    spacing,
    radius,
    typography,
    shadow: {
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: mode === 'dark' ? 0 : 6,
    },
    softShadow: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.75,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: mode === 'dark' ? 0 : 3,
    },
  };
}

export function getNavigationTheme(mode) {
  const colors = palette[mode] || palette.light;
  return {
    dark: mode === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '600' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };
}
