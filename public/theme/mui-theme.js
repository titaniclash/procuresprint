/**
 * Procuresprint 2.0 — MUI theme (v6+/v7, CSS variables mode)
 * Mirrors assets/tokens.css. Change a value in both files, or generate one from the other.
 *
 * Usage (React):
 *   import { ThemeProvider, CssBaseline } from '@mui/material';
 *   import { procuresprintTheme } from './theme/mui-theme';
 *   <ThemeProvider theme={procuresprintTheme}><CssBaseline /><App /></ThemeProvider>
 *
 * MUI default styling is intentionally overridden: square-ish 4px controls, no shadows on cards,
 * border-led surfaces, 600-weight labels without uppercase, AA-verified status colours.
 */
import { createTheme, alpha } from '@mui/material/styles';

const font = '"Gilroy", "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

const light = {
  palette: {
    mode: 'light',
    primary:   { main: '#06424C', dark: '#04282E', light: '#0A6E79', contrastText: '#FFFFFF' },
    secondary: { main: '#0A6E79', contrastText: '#FFFFFF' },
    success:   { main: '#2F8A52', dark: '#1E6B3C', light: '#E6F3EA', contrastText: '#FFFFFF' },
    warning:   { main: '#B85F00', dark: '#8A4500', light: '#FFF1DC', contrastText: '#FFFFFF' },
    error:     { main: '#C9302C', dark: '#B3261E', light: '#FCEBE9', contrastText: '#FFFFFF' },
    info:      { main: '#1C6DD0', dark: '#0B5CAD', light: '#E7F0FB', contrastText: '#FFFFFF' },
    ai:        { main: '#6B5BD2', dark: '#5236C9', light: '#EEEAFD', contrastText: '#FFFFFF' },
    text:      { primary: '#172124', secondary: '#4A5659', disabled: '#8A9699' },
    divider:   '#DCE2E3',
    background:{ default: '#F4F6F6', paper: '#FFFFFF' },
    action:    { hover: '#EDF0F1', selected: '#E3EEEF', focus: alpha('#0A6E79', .16) },
  },
};

const dark = {
  palette: {
    mode: 'dark',
    primary:   { main: '#7FD0D8', dark: '#9EDDE3', light: '#4FB3BF', contrastText: '#04282E' },
    secondary: { main: '#4FB3BF', contrastText: '#04282E' },
    success:   { main: '#5CC07F', dark: '#7FD49B', light: '#15301F', contrastText: '#04282E' },
    warning:   { main: '#F0954A', dark: '#F5B86B', light: '#3A2610', contrastText: '#04282E' },
    error:     { main: '#FF8A80', dark: '#FF9C92', light: '#3D1A17', contrastText: '#04282E' },
    info:      { main: '#8DBDF5', dark: '#8DBDF5', light: '#132A44', contrastText: '#04282E' },
    ai:        { main: '#9D90F0', dark: '#B6A6FF', light: '#261F45', contrastText: '#04282E' },
    text:      { primary: '#E6EDEE', secondary: '#B3C0C2', disabled: '#6E8084' },
    divider:   '#2A3A3E',
    background:{ default: '#0E1517', paper: '#151F22' },
    action:    { hover: '#222E31', selected: '#16363B', focus: alpha('#7FD0D8', .2) },
  },
};

export const procuresprintTheme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-ps-theme' },
  defaultColorScheme: 'light', // light by default; dark only when data-ps-theme="dark" is set
  colorSchemes: { light, dark },
  breakpoints: { values: { xs: 0, sm: 600, md: 905, lg: 1240, xl: 1440 } },
  spacing: 4, // theme.spacing(4) === 16px
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: font,
    htmlFontSize: 16,
    fontSize: 14,
    h1: { fontSize: 32, lineHeight: '40px', fontWeight: 600 },   // display
    h2: { fontSize: 24, lineHeight: '32px', fontWeight: 600 },   // headline / page title
    h3: { fontSize: 20, lineHeight: '28px', fontWeight: 600 },   // title-lg
    h4: { fontSize: 16, lineHeight: '24px', fontWeight: 600 },   // title-md
    h5: { fontSize: 14, lineHeight: '20px', fontWeight: 600 },   // title-sm
    h6: { fontSize: 14, lineHeight: '20px', fontWeight: 600 },
    body1: { fontSize: 14, lineHeight: '20px' },
    body2: { fontSize: 12, lineHeight: '16px' },
    subtitle1: { fontSize: 16, lineHeight: '24px' },
    subtitle2: { fontSize: 12, lineHeight: '16px', fontWeight: 500 },
    button: { fontSize: 14, lineHeight: '20px', fontWeight: 600, textTransform: 'none' },
    caption: { fontSize: 12, lineHeight: '16px' },             // floor: never below 12px
    overline: { fontSize: 12, lineHeight: '16px', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },
  shadows: [
    'none',
    '0 1px 2px rgb(4 40 46 / .06)',
    '0 4px 12px rgb(4 40 46 / .10), 0 1px 3px rgb(4 40 46 / .08)',
    '0 12px 32px rgb(4 40 46 / .18), 0 2px 6px rgb(4 40 46 / .10)',
    ...Array(21).fill('0 12px 32px rgb(4 40 46 / .18), 0 2px 6px rgb(4 40 46 / .10)'),
  ],
  components: {
    MuiCssBaseline: { styleOverrides: { body: { fontVariantNumeric: 'lining-nums' } } },
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 40, paddingInline: 16, borderRadius: 4, gap: 8 },
        sizeSmall: { minHeight: 32, paddingInline: 12, fontSize: 13 },
        outlined: ({ theme }) => ({ borderColor: theme.vars.palette.text.disabled }),
      },
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 4, width: 40, height: 40 } } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { outlined: ({ theme }) => ({ borderColor: theme.vars.palette.divider }) },
    },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderRadius: 6 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 40, borderRadius: 4,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.vars.palette.text.disabled }, // ≥3:1
        }),
      },
    },
    MuiInputLabel: { defaultProps: { shrink: true } }, // labels always above the field
    MuiChip: {
      styleOverrides: { root: { borderRadius: 4, height: 24, fontWeight: 500, fontSize: 12 } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', minHeight: 44, fontWeight: 600, paddingInline: 12 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: 14, paddingBlock: 12, fontVariantNumeric: 'tabular-nums' },
        head: ({ theme }) => ({ fontSize: 12, fontWeight: 600, color: theme.vars.palette.text.secondary,
          backgroundColor: theme.vars.palette.background.default }),
      },
    },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: 12, borderRadius: 4 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 8 } } },
    MuiDrawer: { styleOverrides: { paper: { borderRadius: 0 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 6, alignItems: 'flex-start' } } },
  },
});

/** Status → tone map. One table for the whole product; modules never invent colours. */
export const statusTone = {
  draft: 'neutral', submitted: 'info', 'in-progress': 'info', 'pending-approval': 'warning',
  approved: 'success', rejected: 'danger', withdrawn: 'neutral', completed: 'success',
  published: 'info', 'responses-open': 'info', 'under-evaluation': 'warning', awarded: 'success',
  dispatched: 'info', 'in-transit': 'info', 'grn-posted': 'success', 'grn-rejected': 'danger',
  overdue: 'danger', blocked: 'danger', expired: 'neutral', 'ai-suggested': 'ai',
};

/** Risk uses exactly four levels. */
export const riskLevels = ['low', 'medium', 'high', 'critical'];

