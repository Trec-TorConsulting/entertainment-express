/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ee: {
          bg: "var(--ee-bg)",
          panel: "var(--ee-panel)",
          surface: {
            base: "var(--ee-surface-base)",
            raised: "var(--ee-surface-raised)",
            overlay: "var(--ee-surface-overlay)",
            inset: "var(--ee-surface-inset)"
          },
          rail: {
            DEFAULT: "var(--ee-rail)",
            muted: "var(--ee-rail-muted)",
            text: "var(--ee-rail-text)",
            hover: "var(--ee-rail-hover)",
            active: "var(--ee-rail-active)"
          },
          text: {
            DEFAULT: "var(--ee-text)",
            secondary: "var(--ee-text-secondary)",
            inverse: "var(--ee-text-inverse)",
            disabled: "var(--ee-text-disabled)"
          },
          muted: "var(--ee-muted)",
          brand: {
            DEFAULT: "var(--ee-brand)",
            soft: "var(--ee-brand-soft)",
            hover: "var(--ee-brand-hover)",
            active: "var(--ee-brand-active)",
            border: "var(--ee-brand-border)",
            text: "var(--ee-brand-text)"
          },
          success: {
            DEFAULT: "var(--ee-success)",
            soft: "var(--ee-success-soft)",
            border: "var(--ee-success-border)",
            text: "var(--ee-success-text)"
          },
          warning: {
            DEFAULT: "var(--ee-warning)",
            soft: "var(--ee-warning-soft)",
            border: "var(--ee-warning-border)",
            text: "var(--ee-warning-text)"
          },
          danger: {
            DEFAULT: "var(--ee-danger)",
            soft: "var(--ee-danger-soft)",
            border: "var(--ee-danger-border)",
            text: "var(--ee-danger-text)"
          },
          info: {
            DEFAULT: "var(--ee-info)",
            soft: "var(--ee-info-soft)",
            border: "var(--ee-info-border)",
            text: "var(--ee-info-text)"
          },
          border: {
            DEFAULT: "var(--ee-border)",
            subtle: "var(--ee-border-subtle)",
            strong: "var(--ee-border-strong)"
          }
        }
      },
      fontFamily: {
        display: ["var(--ee-font-display)", "ui-sans-serif", "sans-serif"],
        body: ["var(--ee-font-body)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--ee-font-mono)", "ui-monospace", "monospace"]
      },
      fontSize: {
        "ee-display": ["var(--ee-font-size-display)", { lineHeight: "var(--ee-line-height-display)", fontWeight: "var(--ee-font-weight-display)" }],
        "ee-title": ["var(--ee-font-size-title)", { lineHeight: "var(--ee-line-height-title)", fontWeight: "var(--ee-font-weight-title)" }],
        "ee-heading": ["var(--ee-font-size-heading)", { lineHeight: "var(--ee-line-height-heading)", fontWeight: "var(--ee-font-weight-heading)" }],
        "ee-body": ["var(--ee-font-size-body)", { lineHeight: "var(--ee-line-height-body)", fontWeight: "var(--ee-font-weight-body)" }],
        "ee-label": ["var(--ee-font-size-label)", { lineHeight: "var(--ee-line-height-label)", fontWeight: "var(--ee-font-weight-label)" }],
        "ee-caption": ["var(--ee-font-size-caption)", { lineHeight: "var(--ee-line-height-caption)", fontWeight: "var(--ee-font-weight-caption)" }],
        "ee-mono": ["var(--ee-font-size-mono)", { lineHeight: "var(--ee-line-height-mono)" }]
      },
      borderRadius: {
        "ee-sm": "var(--ee-radius-sm)",
        "ee-md": "var(--ee-radius-md)",
        "ee-lg": "var(--ee-radius-lg)",
        "ee-xl": "var(--ee-radius-xl)",
        "ee-full": "var(--ee-radius-full)",
        ee: "var(--ee-radius)"
      },
      boxShadow: {
        "ee-sm": "var(--ee-shadow-sm)",
        ee: "var(--ee-shadow)",
        "ee-md": "var(--ee-shadow-md)",
        "ee-lg": "var(--ee-shadow-lg)",
        "ee-xl": "var(--ee-shadow-xl)"
      },
      zIndex: {
        "ee-dropdown": "var(--ee-z-dropdown)",
        "ee-sticky": "var(--ee-z-sticky)",
        "ee-drawer": "var(--ee-z-drawer)",
        "ee-modal": "var(--ee-z-modal)",
        "ee-popover": "var(--ee-z-popover)",
        "ee-toast": "var(--ee-z-toast)",
        "ee-tooltip": "var(--ee-z-tooltip)"
      },
      transitionDuration: {
        "ee-fast": "var(--ee-motion-fast)",
        "ee-normal": "var(--ee-motion-normal)",
        "ee-slow": "var(--ee-motion-slow)"
      },
      transitionTimingFunction: {
        "ee-default": "var(--ee-ease-default)",
        "ee-in": "var(--ee-ease-in)",
        "ee-out": "var(--ee-ease-out)"
      }
    }
  }
};
