import { markdownReportFile, resultsDir, runCommand, runId, startLocalQaServer } from "./shared.mjs";

const server = await startLocalQaServer();

try {
  const sharedEnv = {
    QA_RUN_ID: runId,
    QA_RESULTS_DIR: resultsDir,
    QA_BASE_URL: process.env.QA_BASE_URL || server.baseUrl,
    QA_EXTERNAL_TARGET: process.env.QA_BASE_URL ? "1" : "0",
    QA_SERVER_STARTED: "1",
  };

  await runCommand("npx", ["playwright", "install", "chromium"], {
    label: "Playwright browser install",
  });

  const stepFailures = [];
  const runStep = async (label, command, args) => {
    try {
      await runCommand(command, args, { env: sharedEnv, label });
    } catch (error) {
      stepFailures.push({ label, message: error.message });
      process.stderr.write(`${label} failed, continuing so the combined report can still be generated.\n`);
    }
  };

  await runStep("Functional QA suite", "npx", ["playwright", "test", "-c", "playwright.config.mjs"]);
  await runStep("Accessibility audit", "node", ["qa/scripts/run-a11y.mjs"]);
  await runStep("Lighthouse audit", "node", ["qa/scripts/run-lighthouse.mjs"]);
  await runStep("AI UX review", "node", ["qa/scripts/run-ai-review.mjs"]);

  await runCommand("node", ["qa/scripts/build-report.mjs"], {
    env: sharedEnv,
    label: "Report aggregation",
  });

  process.stdout.write(`\nFull QA suite complete. Open ${markdownReportFile}\n`);

  if (stepFailures.length) {
    throw new Error(
      stepFailures.map((failure) => `${failure.label}: ${failure.message}`).join("\n")
    );
  }
} finally {
  await server.stop();
}
