/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontSize: {
        // Tokens extracted from the already-validated Normal Mode game
        // screen (OverlayCard, ResultOverlay, RulesOverlay, BestScorePanel).
        // Every screen must use these by name — never hand-roll a new
        // clamp()/cqw value inline.
        'overlay-title':    ['clamp(16px, 5cqw, 24px)',   { lineHeight: '1.2' }],
        'overlay-title-sm': ['clamp(15px, 4.5cqw, 20px)', { lineHeight: '1.2' }],
        'overlay-body':     ['clamp(12px, 3.5cqw, 15px)', { lineHeight: '1.5' }],
        'overlay-body-sm':  ['clamp(11px, 3.2cqw, 14px)', { lineHeight: '1.5' }],
        'overlay-caption':  ['clamp(11px, 3cqw, 13px)',   { lineHeight: '1.4' }],
        'panel-label':      ['clamp(9px, 2.8cqw, 12px)',  { lineHeight: '1.3' }],
        'panel-value':      ['clamp(13px, 4.5cqw, 18px)', { lineHeight: '1.3' }],
        'table-row':        ['clamp(13px, 4cqw, 16px)',   { lineHeight: '1.4' }],
      }
    }
  },
  plugins: [],
};