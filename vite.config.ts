import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.PAGES_BASE || '/',
  server: { fs: { strict: true, allow: ['.'] } },
  build: {
    sourcemap: false,
    // One bundle on purpose: the offline copy inlines everything into a single file.
    chunkSizeWarningLimit: 700,
    // The artifact host answers 403 to separate font requests, so woff2 fonts go inside the CSS.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? true : undefined),
  },
});
