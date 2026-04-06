import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import {
  a11yReportFile,
  defaultBaseUrl,
  ensureDir,
  getA11yPages,
  resultsDir,
  runId,
  startLocalQaServer,
  writeJson,
} from "./shared.mjs";
import {
  attachConsoleCapture,
  getQaBillingGateMessage,
  isQaBillingGateError,
  prepareAuditPage,
} from "./browserHelpers.mjs";

const server = await startLocalQaServer();
await ensureDir(resultsDir);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  baseURL: process.env.QA_BASE_URL || server.baseUrl || defaultBaseUrl,
  viewport: { width: 1440, height: 1024 },
});

async function collectPageAudit({ id, label, prepare }) {
  const page = await context.newPage();
  const consoleErrors = attachConsoleCapture(page);

  try {
    await prepare(page);

    const axe = await new AxeBuilder({ page }).analyze();
    return {
      id,
      label,
      url: page.url(),
      violations: axe.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact || "unknown",
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodeCount: violation.nodes.length,
        targets: violation.nodes.flatMap((node) => node.target).slice(0, 8),
      })),
      passes: axe.passes.length,
      incomplete: axe.incomplete.length,
      consoleErrors,
    };
  } catch (error) {
    if (isQaBillingGateError(error)) {
      return {
        id,
        label,
        url: page.url(),
        violations: [],
        passes: 0,
        incomplete: 0,
        consoleErrors,
        status: "blocked",
        blockedReason: getQaBillingGateMessage(error),
      };
    }

    return {
      id,
      label,
      url: page.url(),
      violations: [],
      passes: 0,
      incomplete: 0,
      consoleErrors,
      status: "error",
      error: error.message,
    };
  } finally {
    await page.close();
  }
}

const pageResults = [];

try {
  for (const pageConfig of getA11yPages()) {
    pageResults.push(
      await collectPageAudit({
        id: pageConfig.id,
        label: pageConfig.label,
        prepare: async (page) => {
          await prepareAuditPage(page, pageConfig);
        },
      })
    );
  }

  await writeJson(a11yReportFile, {
    generatedAt: new Date().toISOString(),
    runId,
    baseUrl: process.env.QA_BASE_URL || server.baseUrl || defaultBaseUrl,
    pages: pageResults,
  });

  process.stdout.write(`\nAccessibility report written to ${a11yReportFile}\n`);
} finally {
  await context.close();
  await browser.close();
  await server.stop();
}
