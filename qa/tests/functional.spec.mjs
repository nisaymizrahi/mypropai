import fs from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  attachConsoleCapture,
  assertProtectedRouteRedirectsToLogin,
  buildMasterReport,
  getMasterReportAccessState,
  loginWithCredentials,
  countVisibleCompRows,
  fillPropertyIntake,
  openHomepage,
  openLoginPage,
  openMasterReportPage,
  openSavedReport,
  refreshPropertyFacts,
  saveMasterReport,
} from "../scripts/browserHelpers.mjs";
import { canRunProtectedQaFlows, hasQaCredentials, isExternalQaTarget } from "../scripts/shared.mjs";

const expectedRehabEstimate = process.env.QA_TEST_REHAB || "45000";

const assertNoConsoleErrors = (errors) => {
  const relevantErrors = Array.from(new Set(errors)).filter(Boolean);
  expect(relevantErrors).toEqual([]);
};

async function getCurrentSnapshot(page) {
  const snapshotByTestId = page.getByTestId("property-current-snapshot");
  if (await snapshotByTestId.count()) {
    return snapshotByTestId;
  }

  return page
    .locator("div.section-card", {
      has: page.getByRole("heading", { name: /Current snapshot/i }),
    })
    .first();
}

async function ensurePaidReportFlowAvailable(page, testInfo) {
  const accessState = await getMasterReportAccessState(page);

  if (accessState.isBillingGate) {
    testInfo.annotations.push({
      type: "blocked",
      description: accessState.blockingReason,
    });
    return {
      blocked: true,
      accessState,
    };
  }

  expect(
    accessState.runEnabled,
    accessState.accessMessage || "Run Master Deal Report should be enabled once the property intake is complete."
  ).toBeTruthy();

  return {
    blocked: false,
    accessState,
  };
}

async function prepareReport(page, testInfo, options = {}) {
  await openMasterReportPage(page);
  await fillPropertyIntake(page);
  await refreshPropertyFacts(page);
  const availability = await ensurePaidReportFlowAvailable(page, testInfo);
  if (availability.blocked) {
    return availability;
  }
  await buildMasterReport(page, options);
  return availability;
}

test("home landing works", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "home_landing" });
  const consoleErrors = attachConsoleCapture(page);

  await openHomepage(page);
  await expect(page.getByTestId("home-primary-cta")).toBeVisible();
  await expect(page.getByTestId("home-nav-login")).toBeVisible();

  await page.getByTestId("home-nav-login").click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: /Sign in to your Fliprop workspace|Workspace login/i })
  ).toBeVisible();

  assertNoConsoleErrors(consoleErrors);
});

test("property intake refreshes facts", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "property_intake" });
  test.skip(!canRunProtectedQaFlows, "Protected property intake flow requires local QA mode or live credentials.");
  const consoleErrors = attachConsoleCapture(page);

  await openMasterReportPage(page);
  await fillPropertyIntake(page);
  await refreshPropertyFacts(page);

  const snapshot = await getCurrentSnapshot(page);
  await expect(snapshot.getByText(/single-family/i)).toBeVisible();
  await expect(snapshot.getByText(/4 bd/i)).toBeVisible();
  await expect(page.getByTestId("report-rehab-input")).toHaveValue(expectedRehabEstimate);

  assertNoConsoleErrors(consoleErrors);
});

test("master report renders core sections", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "master_report" });
  test.skip(!canRunProtectedQaFlows, "Protected master report flow requires local QA mode or live credentials.");
  const consoleErrors = attachConsoleCapture(page);

  const reportState = await prepareReport(page, testInfo);
  if (reportState?.blocked) {
    return;
  }

  await expect(page.getByTestId("master-deal-report")).toBeVisible();
  await expect(page.getByText(/Blended Value/i)).toBeVisible();
  await expect(page.getByTestId("deal-analysis-section")).toBeVisible();
  await expect(page.getByTestId("ai-deal-verdict-section")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Primary Valuation Comps/i })).toBeVisible();

  assertNoConsoleErrors(consoleErrors);
});

test("map markers track the visible comp set", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "map_and_comps" });
  test.skip(!canRunProtectedQaFlows, "Protected comps flow requires local QA mode or live credentials.");
  const consoleErrors = attachConsoleCapture(page);

  const reportState = await prepareReport(page, testInfo, { radius: 1 });
  if (reportState?.blocked) {
    return;
  }

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
  test.skip(!canRunProtectedQaFlows, "Protected saved report flow requires local QA mode or live credentials.");
  const consoleErrors = attachConsoleCapture(page);

  const reportState = await prepareReport(page, testInfo);
  if (reportState?.blocked) {
    return;
  }
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

  if (canRunProtectedQaFlows) {
    await openMasterReportPage(page);
    await fillPropertyIntake(page);
    await page.getByTestId("run-master-report").scrollIntoViewIfNeeded();

    const runButtonBox = await page.getByTestId("run-master-report").boundingBox();
    expect(runButtonBox).not.toBeNull();
    expect(runButtonBox.width).toBeGreaterThan(180);
  } else {
    await openLoginPage(page);
    const emailBox = await page.getByLabel("Work email").boundingBox();
    expect(emailBox).not.toBeNull();
    expect(emailBox.width).toBeGreaterThan(180);
  }

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth > 8
  );
  expect(hasHorizontalOverflow).toBeFalsy();

  assertNoConsoleErrors(consoleErrors);
});

test("protected report route is gated behind login on the live site", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "flow", description: "protected_route_guard" });
  test.skip(!isExternalQaTarget || hasQaCredentials, "Only relevant for public live-site review without credentials.");
  const consoleErrors = attachConsoleCapture(page);

  await assertProtectedRouteRedirectsToLogin(page);

  assertNoConsoleErrors(consoleErrors);
});
