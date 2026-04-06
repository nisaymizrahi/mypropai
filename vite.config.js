import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const host = env.HOST || "127.0.0.1";
  const port = Number(env.PORT || 5173);

  return {
    plugins: [
      react({
        include: /\/src\/.*\.[jt]sx?$/,
      }),
    ],
    envPrefix: ["VITE_", "REACT_APP_"],
    oxc: {
      include: /src\/.*\.[jt]sx?$/,
      jsx: {
        runtime: "automatic",
      },
    },
    optimizeDeps: {
      rolldownOptions: {
        moduleTypes: {
          ".js": "jsx",
        },
      },
    },
    server: {
      host,
      port,
    },
    preview: {
      host,
      port: Number(env.PREVIEW_PORT || 4173),
    },
    test: {
      include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
      exclude: ["qa/**", "node_modules/**"],
      globals: true,
      environment: "happy-dom",
      setupFiles: "./src/setupTests.js",
      css: true,
    },
  };
});
