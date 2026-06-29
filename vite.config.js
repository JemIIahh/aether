import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Privy-only packages — DON'T assign a manual chunk; let Rollup split them
// naturally via the dynamic import('./PrivyBridge.jsx') boundary.
// Forcing them into a named chunk causes circular deps with 'vendor'.
const PRIVY_ONLY = [
  '@privy-io', 'viem', '@walletconnect', 'wagmi', '@base-org/account', '/ox/',
];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    // Don't auto-open on every dev start. Restarts during development would
    // otherwise spawn a new tab in the OS default browser every time, even
    // when the dev already has the game open in a different browser.
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('three')) return 'vendor-three';
          // Let Privy deps land in the lazy chunk created by dynamic import
          if (PRIVY_ONLY.some(pkg => id.includes(pkg))) return;
          return 'vendor';
        },
      },
    },
  },
});
