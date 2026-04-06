import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import {
  a11yReportFile,
  defaultBaseUrl,
  ensureDir,
  resultsDir,
  runId,
  startLocalQaServer,
  writeJson,
} from "./shared.mjs";
import {
  attachConsoleCapture,
  buildMasterReport,
  fillPropertyIntake,
  openHomepage,
  openMasterReportPage,
  openSavedReport,
  refreshPropertyFacts,
  saveMasterReport,
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
  } finally {
    await page.close();
  }
}

const pageResults = [];

try {
  pageResults.push(
    await collectPageAudit({
      id: "homepage",
      label: "Homepage",
      prepare: async (page) => {
        await openHomepage(page);
      },
    })
  );

  pageResults.push(
    await collectPageAudit({
      id: "master_report",
      label: "Master Deal Report",
      prepare: async (page) => {
        await openMasterReportPage(page);
        await fillPropertyIntake(page);
        await refreshPropertyFacts(page);
        await buildMasterReport(page);
      },
    })
  );

  pageResults.push(
    await collectPageAudit({
      id: "saved_report",
      label: "Saved Report",
      prepare: async (page) => {
        await openMasterReportPage(page);
        await fillPropertyIntake(page);
        await refreshPropertyFacts(page);
        await buildMasterReport(page);
        await saveMasterReport(page);
        await openSavedReport(page);
      },
    })
  );

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
