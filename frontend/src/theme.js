import { createTheme } from '@mui/material/styles';

// ─────────────────────────────────────────────────────────
// CINEMATIC NOIR — design tokens
// Deep near-black canvas, one confident amber accent, warm
// off-white ink, editorial serif display + clean sans UI.
// ─────────────────────────────────────────────────────────
export const NOIR = {
  bg: '#0a0a0b',
  bgElev: '#0f0f11',
  surface: '#151517',
  surface2: '#1c1c20',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#f5f3ef',
  textDim: 'rgba(245,243,239,0.62)',
  textFaint: 'rgba(245,243,239,0.38)',
  amber: '#E5B769',
  amberDeep: '#C9922F',
  amberSoft: 'rgba(229,183,105,0.12)',
  gold: '#F5C518',      // IMDb-style rating gold
  success: '#5FBF80',
  successSoft: 'rgba(95,191,128,0.14)',
  danger: '#E5484D',
  dangerSoft: 'rgba(229,72,77,0.14)',
};

// Full-page cinematic background: near-black with a warm spotlight bleed at top.
export const pageBg = {
  minHeight: '100vh',
  background: `radial-gradient(1200px 620px at 50% -12%, rgba(229,183,105,0.10), transparent 60%), ${NOIR.bg}`,
};

// A tighter spotlight for hero sections.
export const spotlight = {
  background: `radial-gradient(900px 480px at 50% 0%, rgba(229,183,105,0.14), transparent 62%)`,
};

// Reusable frosted surface for cards / panels.
export const glassCard = {
  bgcolor: NOIR.surface,
  border: `1px solid ${NOIR.border}`,
  borderRadius: 4,
  backdropFilter: 'blur(6px)',
};

// The signature amber call-to-action gradient.
export const amberGradient = `linear-gradient(135deg, ${NOIR.amber} 0%, ${NOIR.amberDeep} 100%)`;

const DISPLAY = '"Fraunces", "Playfair Display", Georgia, serif';
const SANS = '"Inter", system-ui, "Segoe UI", Roboto, sans-serif';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: NOIR.amber, dark: NOIR.amberDeep, contrastText: '#0a0a0b' },
    secondary: { main: NOIR.gold, contrastText: '#0a0a0b' },
    success: { main: NOIR.success },
    error: { main: NOIR.danger },
    background: { default: NOIR.bg, paper: NOIR.surface },
    text: { primary: NOIR.text, secondary: NOIR.textDim },
    divider: NOIR.border,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: SANS,
    h1: { fontFamily: DISPLAY, fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontFamily: DISPLAY, fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontFamily: DISPLAY, fontWeight: 600, letterSpacing: '-0.015em' },
    h4: { fontFamily: DISPLAY, fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700, letterSpacing: '-0.005em' },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
    overline: { letterSpacing: '0.22em', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: NOIR.bg, color: NOIR.text },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 18, paddingBlock: 8 },
        containedPrimary: {
          background: amberGradient,
          color: '#0a0a0b',
          boxShadow: '0 6px 22px rgba(229,183,105,0.22)',
          '&:hover': {
            background: amberGradient,
            filter: 'brightness(1.06)',
            boxShadow: '0 10px 30px rgba(229,183,105,0.32)',
          },
        },
        outlined: {
          borderColor: NOIR.borderStrong,
          color: NOIR.text,
          '&:hover': { borderColor: NOIR.amber, backgroundColor: NOIR.amberSoft },
        },
        text: { color: NOIR.textDim, '&:hover': { color: NOIR.text, backgroundColor: 'rgba(255,255,255,0.04)' } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: NOIR.surface, border: `1px solid ${NOIR.border}` },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: NOIR.surface,
          border: `1px solid ${NOIR.border}`,
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.03)',
          '& fieldset': { borderColor: NOIR.border },
          '&:hover fieldset': { borderColor: NOIR.borderStrong },
          '&.Mui-focused fieldset': { borderColor: NOIR.amber },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: NOIR.surface2, border: `1px solid ${NOIR.border}`, fontSize: '0.75rem' },
      },
    },
  },
});

export default theme;
