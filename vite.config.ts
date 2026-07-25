import { defineConfig } from 'vite';

export default defineConfig({
  // Относительные пути обязательны для Яндекс Игр —
  // билд разворачивается не в корне домена, а во вложенной директории.
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
