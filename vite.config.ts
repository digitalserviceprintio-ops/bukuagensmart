import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const now = new Date();
const buildVersion = `${now.getFullYear() % 100}.${now.getMonth() + 1}.${now.getDate()}.${now.getHours()}${String(now.getMinutes()).padStart(2, '0')}`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    __APP_BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));