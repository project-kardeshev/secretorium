import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import nodePolyfills from 'vite-plugin-node-stdlib-browser';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    minify: true,
    cssMinify: true,
  },
  plugins: [
    react(),
    nodePolyfills() as any,
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: 'Secretorium',
        short_name: 'Secretorium',
        description:
          'Decentralized vaults for using your secrets collaboratively',
        theme_color: '#1f1f1f',
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 10_000_000,
      },

      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      path: 'path',
      '@tests': path.resolve(__dirname) + '/tests',
      '@src': path.resolve(__dirname) + '/src',
      '@components': path.resolve(__dirname) + '/src/components',
      '@hooks': path.resolve(__dirname) + '/src/hooks',
      '@pages': path.resolve(__dirname) + '/src/pages',
      '@types': path.resolve(__dirname) + '/src/types',
      '@utils': path.resolve(__dirname) + '/src/utils',
    },
  },
});
