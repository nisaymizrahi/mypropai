import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import {
  defaultBaseUrl,
  ensureDir,
  getLighthousePages,
  lighthouseReportFile,
  resultsDir,
  runId,
  startLocalQaServer,
  writeJson,
} from "./shared.mjs";
import { getQaBillingGateMessage, isQaBillingGateError, prepareAuditPage } from "./browserHelpers.mjs";

const server = await startLocalQaServer();
await ensureDir(resultsDir);

const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "fliprop-qa-lh-"));
const debugPort = 9222;
const baseUrl = process.env.QA_BASE_URL || server.baseUrl || defaultBaseUrl;

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  baseURL: baseUrl,
  args: [`--remote-debugging-port=${debugPort}`],
});

async function preparePage(pageConfig) {
  const page = context.pages()[0] || (await context.newPage());
  await page.goto("about:blank");
  await prepareAuditPage(page, pageConfig);

  return page;
}

const audits = [];

try {
  for (const pageConfig of getLighthousePages()) {
    try {
      const page = await preparePage(pageConfig);
      const result = await lighthouse(page.url(), {
        port: debugPort,
        output: "json",
        logLevel: "error",
        disableStorageReset: true,
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      });

      const report = result?.lhr;
      const lowScoringAudits = Object.values(report.audits)
        .filter((audit) => audit.scoreDisplayMode === "numeric" && typeof audit.score === "number" && audit.score < 0.9)
        .sort((left, right) => left.score - right.score)
        .slice(0, 6)
        .map((audit) => ({
          id: audit.id,
          title: audit.title,
          score: Math.round((audit.score || 0) * 100),
        }));

      audits.push({
        id: pageConfig.id,
        label: pageConfig.label,
        url: page.url(),
        scores: {
          performance: Math.round((report.categories.performance.score || 0) * 100),
          accessibility: Math.round((report.categories.accessibility.score || 0) * 100),
          bestPractices: Math.round((report.categories["best-practices"].score || 0) * 100),
          seo: Math.round((report.categories.seo.score || 0) * 100),
        },
        lowScoringAudits,
      });
    } catch (error) {
      if (isQaBillingGateError(error)) {
        audits.push({
          id: pageConfig.id,
          label: pageConfig.label,
          url: `${process.env.QA_BASE_URL || server.baseUrl || defaultBaseUrl}${pageConfig.path}`,
          status: "blocked",
          blockedReason: getQaBillingGateMessage(error),
          scores: {
            performance: null,
            accessibility: null,
            bestPractices: null,
            seo: null,
          },
          lowScoringAudits: [],
        });
        continue;
      }

      audits.push({
        id: pageConfig.id,
        label: pageConfig.label,
        url: `${process.env.QA_BASE_URL || server.baseUrl || defaultBaseUrl}${pageConfig.path}`,
        status: "error",
        scores: {
          performance: 0,
          accessibility: 0,
          bestPractices: 0,
          seo: 0,
        },
        lowScoringAudits: [],
        error: error.message,
      });
    }
  }

  await writeJson(lighthouseReportFile, {
    generatedAt: new Date().toISOString(),
    runId,
    baseUrl: process.env.QA_BASE_URL || server.baseUrl || defaultBaseUrl,
    pages: audits,
  });

  process.stdout.write(`\nLighthouse report written to ${lighthouseReportFile}\n`);
} finally {
  await context.close();
  await fs.rm(userDataDir, { recursive: true, force: true });
  await server.stop();
}
