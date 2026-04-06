import { markdownReportFile, resultsDir, runCommand, runId, startLocalQaServer } from "./shared.mjs";

const server = await startLocalQaServer();

try {
  const sharedEnv = {
    QA_RUN_ID: runId,
    QA_RESULTS_DIR: resultsDir,
    QA_BASE_URL: process.env.QA_BASE_URL || server.baseUrl,
    QA_SERVER_STARTED: "1",
  };

  await runCommand("npx", ["playwright", "install", "chromium"], {
    label: "Playwright browser install",
  });

  await runCommand("npx", ["playwright", "test", "-c", "playwright.config.mjs"], {
    env: sharedEnv,
    label: "Functional QA suite",
  });
  await runCommand("node", ["qa/scripts/run-a11y.mjs"], {
    env: sharedEnv,
    label: "Accessibility audit",
  });
  await runCommand("node", ["qa/scripts/run-lighthouse.mjs"], {
    env: sharedEnv,
    label: "Lighthouse audit",
  });
  await runCommand("node", ["qa/scripts/run-ai-review.mjs"], {
    env: sharedEnv,
    label: "AI UX review",
  });
  await runCommand("node", ["qa/scripts/build-report.mjs"], {
    env: sharedEnv,
    label: "Report aggregation",
  });

  process.stdout.write(`\nFull QA suite complete. Open ${markdownReportFile}\n`);
} finally {
  await server.stop();
}
