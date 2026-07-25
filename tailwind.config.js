import { heroui } from '@heroui/react'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'PingFang SC',
          'Noto Sans CJK SC',
          'Microsoft YaHei',
          'ui-sans-serif',
          'system-ui',
          'sans-serif'
        ],
        mono: ['SFMono-Regular', 'Cascadia Code', 'Consolas', 'monospace']
      },
      colors: {
        // 与 VitePress 站点一致的 Topic 色（浅色主题基准值）
        topic: {
          kernel: '#396ab5',
          comm: '#9b6012',
          serving: '#247d70',
          rl: '#7558a8'
        }
      }
    }
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: '#fbfaf9',
            foreground: '#191b22',
            focus: '#8f1d2c',
            divider: '#e1dedb',
            content1: '#ffffff',
            content2: '#f5f3f2',
            content3: '#eeecea',
            default: {
              50: '#f5f3f2',
              100: '#eeecea',
              200: '#e1dedb',
              300: '#c9c4c0',
              foreground: '#191b22',
              DEFAULT: '#eeecea'
            },
            primary: {
              50: '#f7eaec',
              100: '#f0d3d7',
              200: '#e0a7af',
              300: '#cf7a86',
              400: '#b94858',
              500: '#8f1d2c',
              600: '#741523',
              700: '#5d101b',
              800: '#450b14',
              900: '#2e070d',
              DEFAULT: '#8f1d2c',
              foreground: '#ffffff'
            }
          }
        },
        dark: {
          colors: {
            background: '#202228',
            foreground: '#f1efed',
            focus: '#e26473',
            divider: '#444a55',
            content1: '#282b32',
            content2: '#30343c',
            content3: '#393e48',
            default: {
              50: '#30343c',
              100: '#393e48',
              200: '#444a55',
              300: '#59616f',
              foreground: '#f1efed',
              DEFAULT: '#393e48'
            },
            primary: {
              50: '#2e070d',
              100: '#450b14',
              200: '#5d101b',
              300: '#741523',
              400: '#b03949',
              500: '#e26473',
              600: '#f07b88',
              700: '#f4a0a9',
              800: '#f8c5cb',
              900: '#fce9eb',
              DEFAULT: '#e26473',
              foreground: '#190d10'
            }
          }
        }
      }
    })
  ]
}
