import { defineConfig } from 'vite';

// Relative asset paths let the built `dist/` folder work on GitHub Pages
// and when opened from a local folder after building.
export default defineConfig({
  base: './',
});
