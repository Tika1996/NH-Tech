export const BRAND = {
    name: {
        fr: 'NH TECH',
        ar: 'إن إتش تيك',
        en: 'NH TECH',
    },
    subtitle: {
        fr: 'BUILD • REPAIR • UPGRADE',
        ar: 'تجميع • تصليح • تطوير',
        en: 'BUILD • REPAIR • UPGRADE',
    },
    company: {
        name: 'NH TECH Hardware & Repair',
        address: 'Alger, Algérie',
        phone: '0550 00 00 00',
        email: 'contact@nhtech.com',
        website: 'www.nhtech.com',
    phone2: '0656 14 11 96',
  },
  version: '1.0.0',

  logos: {
    default: '/logo.png',
    dark: '/logo-dark.png',
    light: '/logo-light.png',
    print: '/logo-print.png',
    bannerDark: '/brand/NH TECH-08.png',
    verticalDark: '/brand/NH TECH-09.png',
    verticalLight: '/brand/NH TECH-01.png',
    monochrome: '/brand/NH TECH-02.png',
    typographyOnly: '/brand/NH TECH-06.png',
  },

    // ============================================================
    // STORAGE CONFIG (auto-derived from brand name)
    // Change the brand name above → all DB/storage keys update automatically
    // ============================================================
    /** IndexedDB database name */
    dbName: 'NHTechDB',
    /** Prefix for all localStorage keys (no trailing separator) */
    storagePrefix: 'nhtech',
};

export const BRAND_COLORS = {
    // Palette basée sur le Bleu Électrique dominant (#0057FF)
    primary: {
        50: '#E6F0FF',
        100: '#CCE0FF',
        200: '#99C2FF',
        300: '#66A3FF',
        400: '#3385FF',
        500: '#0057FF', // Bleu Électrique Principal
        600: '#0046CC',
        700: '#003599', // Teinte sombre
        800: '#002466',
        900: '#001333',
        950: '#000A1A',
    },
    // Palette basée sur le Cyan Néon d'accentuation (#00F0FF)
    accent: {
        50: '#E6FCFF',
        100: '#CCFAFF',
        200: '#99F5FF',
        300: '#66F0FF',
        400: '#33EBFF',
        500: '#00F0FF', // Cyan Électrique Principal
        600: '#00C4D4',
        700: '#0097AA',
        800: '#006B7F',
        900: '#004055',
    },
} as const;

export const BRAND_THEME_VARS: Record<string, string> = {
    // Variables Primaires (Bleu Électrique)
    '--color-primary-50': BRAND_COLORS.primary[50],
    '--color-primary-100': BRAND_COLORS.primary[100],
    '--color-primary-200': BRAND_COLORS.primary[200],
    '--color-primary-300': BRAND_COLORS.primary[300],
    '--color-primary-400': BRAND_COLORS.primary[400],
    '--color-primary-500': BRAND_COLORS.primary[500],
    '--color-primary-600': BRAND_COLORS.primary[600],
    '--color-primary-700': BRAND_COLORS.primary[700],
    '--color-primary-800': BRAND_COLORS.primary[800],
    '--color-primary-900': BRAND_COLORS.primary[900],
    '--color-primary-950': BRAND_COLORS.primary[950],

    // Définitions de la marque
    '--color-brand': BRAND_COLORS.primary[500],
    '--color-brand-light': BRAND_COLORS.primary[400],
    '--color-brand-dark': BRAND_COLORS.primary[700],
    '--border-focus': BRAND_COLORS.primary[500],
    '--text-brand': BRAND_COLORS.primary[500],

    // Variables d'accentuation (Cyan Néon)
    '--color-accent-50': BRAND_COLORS.accent[50],
    '--color-accent-100': BRAND_COLORS.accent[100],
    '--color-accent-200': BRAND_COLORS.accent[200],
    '--color-accent-300': BRAND_COLORS.accent[300],
    '--color-accent-400': BRAND_COLORS.accent[400],
    '--color-accent-500': BRAND_COLORS.accent[500],
    '--color-accent-600': BRAND_COLORS.accent[600],
    '--color-accent-700': BRAND_COLORS.accent[700],
    '--color-accent-800': BRAND_COLORS.accent[800],
    '--color-accent-900': BRAND_COLORS.accent[900],
    '--text-accent': BRAND_COLORS.accent[500],

    // Token Cyber Dark Mode NH TECH
    '--color-bg-dark': '#0B0C10',
    '--color-surface-dark': '#1F2833',
    '--color-surface-card': '#14161C',
    '--grad-electric-tech': 'linear-gradient(135deg, #0057FF 0%, #00F0FF 100%)',
    '--grad-dark-cyber': 'linear-gradient(180deg, #0B0C10 0%, #1F2833 100%)',
    '--glow-blue': '0 0 20px rgba(0, 87, 255, 0.35)',
    '--glow-cyan': '0 0 20px rgba(0, 240, 255, 0.40)',
};

export function applyBrandThemeVars(vars: Record<string, string> = BRAND_THEME_VARS) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => {
        root.style.setProperty(k, v);
    });
}