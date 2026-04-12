export const colors = {
  light: {
    // Brand
    primary: '#C4856F',
    primaryLight: '#D4A08C',
    primaryDark: '#C07A63',
    primaryBg: 'rgba(196, 133, 111, 0.08)',

    // Surfaces
    background: '#F7F3EE',
    card: '#FFFFFF',
    warmBg: '#FFF8F0',
    inputBg: '#F5F2EF',

    // Text
    text: '#2B2320',
    textSecondary: '#9A8880',
    textMuted: '#B0A098',
    textBody: '#5C4A3D',

    // Borders
    border: '#F0E4DE',
    borderLight: '#EDE8E4',
    focusBorder: 'rgba(196, 133, 111, 0.25)',

    // Semantic
    green: '#7A9E7E',
    greenDark: '#5E9E66',
    greenLight: '#E8F2E9',
    greenMint: '#C2E5C4',
    purple: '#8B6FC0',
    purpleLight: '#EEEAF5',
    avatarBg: '#E8CFC4',
    sosBg: '#FAE8E5',
    recordingRed: '#E25C5C',

    // Feedback
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',

    // Chat
    miraAvatar: 'rgba(196, 133, 111, 0.12)',
    userBubble: '#C4856F',
    miraBubble: '#FFFFFF',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#F0E4DE',
    tabActive: '#F7F3EE',
    tabInactive: '#B0A098',
  },
  dark: {
    // Brand
    primary: '#D4A89A',
    primaryLight: '#C4856F',
    primaryDark: '#B56756',
    primaryBg: 'rgba(212, 168, 154, 0.1)',

    // Surfaces
    background: '#1A1412',
    card: '#221E1B',
    warmBg: '#2A211B',
    inputBg: '#2E2824',

    // Text
    text: '#E8E0D8',
    textSecondary: '#A09A93',
    textMuted: '#7A6F65',
    textBody: '#C4B8AD',

    // Borders
    border: '#3A332E',
    borderLight: '#2E2824',
    focusBorder: 'rgba(212, 168, 154, 0.25)',

    // Semantic
    green: '#7A9E7E',
    greenDark: '#5E9E66',
    greenLight: '#1A2E1C',
    greenMint: '#2A3E2C',
    purple: '#A08BD0',
    purpleLight: '#252030',
    avatarBg: '#3A2E28',
    sosBg: '#3A2220',
    recordingRed: '#EF4444',

    // Feedback
    success: '#22C55E',
    warning: '#FBBF24',
    danger: '#EF4444',

    // Chat
    miraAvatar: 'rgba(212, 168, 154, 0.15)',
    userBubble: '#C4856F',
    miraBubble: '#2E2824',

    // Tab bar
    tabBar: '#221E1B',
    tabBarBorder: '#3A332E',
    tabActive: '#2E2824',
    tabInactive: '#7A6F65',
  },
};

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export const size = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#2B2320',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    shadowColor: '#C4856F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.19,
    shadowRadius: 12,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#2B2320',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
};

export const gradients = {
  ctaPrimary: {
    colors: ['#D4A08C', '#C4856F'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  miraHero: {
    colors: ['#B56756', '#C4856F', '#E0A88A'] as const,
    start: { x: 0.75, y: 0 },
    end: { x: 0.25, y: 1 },
  },
  userBubble: {
    colors: ['#D9A48E', '#C07A63'] as const,
    start: { x: 0.25, y: 0 },
    end: { x: 0.75, y: 1 },
  },
};
