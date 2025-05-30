module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        black: {
          900: '#363636',
        }
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#363636',
            '--tw-prose-body': '#363636',
            '--tw-prose-headings': '#363636',
            '--tw-prose-links': '#363636',
            '--tw-prose-bold': '#363636',
            '--tw-prose-counters': '#363636',
            '--tw-prose-bullets': '#363636',
            '--tw-prose-hr': '#363636',
            '--tw-prose-quotes': '#363636',
            '--tw-prose-quote-borders': '#363636',
            '--tw-prose-captions': '#363636',
            '--tw-prose-code': '#363636',
            '--tw-prose-pre-code': '#363636',
            '--tw-prose-pre-bg': '#363636',
            '--tw-prose-th-borders': '#363636',
            '--tw-prose-td-borders': '#363636',
            a: {
              color: '#363636',
            },
            strong: {
              color: '#363636',
            },
            span: {
              color: '#363636',
            },
            p: {
              color: '#363636',
            },
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    // require("daisyui"),
  ],
};
