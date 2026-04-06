import { functionalReportFile, resultsDir, runCommand, runId, startLocalQaServer } from "./shared.mjs";

const server = await startLocalQaServer();

try {
  await runCommand("npx", ["playwright", "install", "chromium"], {
    label: "Playwright browser install",
  });

  await runCommand("npx", ["playwright", "test", "-c", "playwright.config.mjs"], {
    env: {
      QA_RUN_ID: runId,
      QA_RESULTS_DIR: resultsDir,
      QA_BASE_URL: process.env.QA_BASE_URL || server.baseUrl,
      QA_EXTERNAL_TARGET: process.env.QA_BASE_URL ? "1" : "0",
      QA_SERVER_STARTED: "1",
    },
    label: "Functional QA suite",
  });

  process.stdout.write(`\nFunctional report written to ${functionalReportFile}\n`);
} finally {
  await server.stop();
}
