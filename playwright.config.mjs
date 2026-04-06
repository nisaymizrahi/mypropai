import path from "node:path";
import { defineConfig } from "@playwright/test";
import { defaultBaseUrl, functionalReportFile, resultsDir } from "./qa/scripts/shared.mjs";

export default defineConfig({
  testDir: "./qa/tests",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: functionalReportFile }],
  ],
  outputDir: path.join(resultsDir, "playwright"),
  use: {
    baseURL: defaultBaseUrl,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: {
      width: 1440,
      height: 1024,
    },
  },
});
