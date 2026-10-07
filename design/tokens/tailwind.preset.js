/** Repassafe — preset Tailwind (v2.1).
 * Uso: em tailwind.config.js → `presets: [require('./design/tokens/tailwind.preset.js')]`
 * Os valores espelham tokens.css; se o projeto usa CSS vars, prefira `var(--rs-*)`.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0E2A3B', 2: '#173B50' },
        teal: { DEFAULT: '#0F7C78', dark: '#0B5E5B' },
        mint: '#8EE0CC',
        mist: '#D9F1EC',
        base: '#F6F8F7',
        light: '#E9F5F2',
        amber: '#F2B544',
        text: { DEFAULT: '#0E2A3B', body: '#1E3A47', secondary: '#33454F', muted: '#4A5B66', 'on-dark-muted': '#B9C7CF' },
        line: { border: '#DCE3E1', divider: '#EDF1F0', track: '#E3EAE8' },
        neutral: { 100: '#F1F4F3', 200: '#E3E9EE', disabled: '#C9D4D1' },
        status: {
          'open-bg': '#D9F1EC', 'open-fg': '#0B5E5B', 'open-dot': '#0F7C78',
          'pending-bg': '#FCEBC7', 'pending-fg': '#6E4300', 'pending-dot': '#D99A1E',
          'institutional-bg': '#E3E9EE', 'institutional-fg': '#33454F', 'institutional-dot': '#5E7383',
          'registered-bg': '#0E2A3B', 'registered-fg': '#FFFFFF', 'registered-dot': '#8EE0CC',
          'cancelled-bg': '#FBE3E1', 'cancelled-fg': '#8E2A22', 'cancelled-dot': '#C2453A',
          'empty-bg': '#F1F4F3', 'empty-fg': '#4A5B66', 'empty-dot': '#9AAAB3',
        },
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['44px', { lineHeight: '52px', letterSpacing: '-0.03em', fontWeight: '700' }],
        h1: ['26px', { lineHeight: '31px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1-sm': ['22px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '700' }],
        h2: ['18px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'card-title': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px' }],
        'body-sm': ['15px', { lineHeight: '21px' }],
        label: ['13px', { lineHeight: '18px', fontWeight: '600' }],
        caption: ['13px', { lineHeight: '18px', fontWeight: '500' }],
        micro: ['12px', { lineHeight: '16px', fontWeight: '600' }],
      },
      borderRadius: { xs: '7px', sm: '11px', md: '14px', lg: '16px', xl: '20px', '2xl': '28px', icon: '12px' },
      spacing: { gutter: '20px', 'touch': '44px', 'btn': '52px', 'btn-sm': '44px', 'input': '50px', 'tabbar': '80px' },
      boxShadow: { fab: '0 8px 20px rgba(14,42,59,0.25)', selected: '0 0 0 2px #0F7C78', focus: '0 0 0 3px rgba(15,124,120,0.35)' },
      transitionTimingFunction: { rs: 'cubic-bezier(0.2, 0, 0, 1)' },
      transitionDuration: { fast: '120ms', DEFAULT: '180ms' },
    },
  },
};
