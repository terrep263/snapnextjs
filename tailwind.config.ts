import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(147 51 234)',
        'primary-foreground': 'rgb(255 255 255)',
        secondary: 'rgb(236 72 153)',
        'secondary-foreground': 'rgb(255 255 255)',
        accent: 'rgb(243 232 255)',
        'accent-foreground': 'rgb(147 51 234)',
        muted: 'rgb(249 250 251)',
        'muted-foreground': 'rgb(107 114 128)',
        border: 'rgb(229 231 235)',
        input: 'rgb(229 231 235)',
        ring: 'rgb(147 51 234)',
      },
      borderRadius: {
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
}
export default config