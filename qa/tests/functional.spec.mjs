import fs from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  attachConsoleCapture,
  buildMasterReport,
  countVisibleCompRows,
  fillPropertyIntake,
  openHomepage,
  openMasterReportPage,
  openSavedReport,
  refreshPropertyFacts,
  saveMasterReport,
} from "../scripts/browserHelpers.mjs";

const assertNoConsoleErrors = (errors) => {
  const relevantErrors = Array.from(new Set(errors)).filter(Boolean);
  expect(relevantErrors).toEqual([]);
};

async function prepareReport(page, options = {}) {
  await openMasterReportPage(page);
  await fillPropertyIntake(page);
  await refreshPropertyFacts(page);
  await buildMasterReport(page, options);
}

test("home landing works", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "home_landing" });
  const consoleErrors = attachConsoleCapture(page);

  await openHomepage(page);
  await expect(page.getByTestId("home-primary-cta")).toBeVisible();
  await expect(page.getByTestId("home-nav-login")).toBeVisible();

  await page.getByTestId("home-nav-login").click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Workspace login/i })).toBeVisible();

  assertNoConsoleErrors(consoleErrors);
});

test("property intake refreshes facts", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "property_intake" });
  const consoleErrors = attachConsoleCapture(page);

  await openMasterReportPage(page);
  await fillPropertyIntake(page);
  await refreshPropertyFacts(page);

  await expect(page.getByText(/Single Family/i)).toBeVisible();
  await expect(page.getByText(/4 bd/i)).toBeVisible();
  await expect(page.getByText(/Rehab \$45,000/i)).toBeVisible();

  assertNoConsoleErrors(consoleErrors);
});

test("master report renders core sections", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "master_report" });
  const consoleErrors = attachConsoleCapture(page);

  await prepareReport(page);

  await expect(page.getByTestId("master-deal-report")).toBeVisible();
  await expect(page.getByText(/Blended Value/i)).toBeVisible();
  await expect(page.getByTestId("deal-analysis-section")).toBeVisible();
  await expect(page.getByTestId("ai-deal-verdict-section")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Primary Valuation Comps/i })).toBeVisible();

  assertNoConsoleErrors(consoleErrors);
});

test("map markers track the visible comp set", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "map_and_comps" });
  const consoleErrors = attachConsoleCapture(page);

  await prepareReport(page, { radius: 1 });

  const initialVisibleRows = await countVisibleCompRows(page);
  const initialMarkerCount = Number(await page.getByTestId("property-map").getAttribute("data-marker-count"));
  expect(initialVisibleRows).toBeGreaterThan(0);
  expect(initialMarkerCount).toBe(initialVisibleRows + 1);

  await buildMasterReport(page, { radius: 0.5 });

  const narrowedVisibleRows = await countVisibleCompRows(page);
  const narrowedMarkerCount = Number(await page.getByTestId("property-map").getAttribute("data-marker-count"));

  expect(narrowedVisibleRows).toBeLessThan(initialVisibleRows);
  expect(narrowedMarkerCount).toBe(narrowedVisibleRows + 1);

  assertNoConsoleErrors(consoleErrors);
});

test("saved report export produces a non-empty pdf", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "saved_report_export" });
  const consoleErrors = attachConsoleCapture(page);

  await prepareReport(page);
  await saveMasterReport(page);
  await openSavedReport(page);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-comps-pdf").click(),
  ]);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileStats = await fs.stat(downloadPath);
  expect(fileStats.size).toBeGreaterThan(2_000);

  assertNoConsoleErrors(consoleErrors);
});

test("mobile viewport keeps the primary flow usable", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "mobile_sanity" });
  const consoleErrors = attachConsoleCapture(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await openHomepage(page);

  const ctaBox = await page.getByTestId("home-primary-cta").boundingBox();
  expect(ctaBox).not.toBeNull();
  expect(ctaBox.width).toBeGreaterThan(100);

  await openMasterReportPage(page);
  await fillPropertyIntake(page);
  await page.getByTestId("run-master-report").scrollIntoViewIfNeeded();

  const runButtonBox = await page.getByTestId("run-master-report").boundingBox();
  expect(runButtonBox).not.toBeNull();
  expect(runButtonBox.width).toBeGreaterThan(180);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth > 8
  );
  expect(hasHorizontalOverflow).toBeFalsy();

  assertNoConsoleErrors(consoleErrors);
});
