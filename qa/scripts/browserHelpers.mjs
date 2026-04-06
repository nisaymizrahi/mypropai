import path from "node:path";
import { expect } from "@playwright/test";
import {
  canRunProtectedQaFlows,
  hasQaCredentials,
  isExternalQaTarget,
  qaToken,
  qaUserEmail,
  qaUserPassword,
  screenshotsDir,
} from "./shared.mjs";

const BILLING_GATE_PREFIX = "QA_BILLING_GATE:";

const defaultPropertyInput = {
  addressLine1: process.env.QA_TEST_ADDRESS_LINE1 || "742 Evergreen Terrace",
  city: process.env.QA_TEST_CITY || "Springfield",
  state: process.env.QA_TEST_STATE || "IL",
  zipCode: process.env.QA_TEST_ZIP || "62704",
  askingPrice: process.env.QA_TEST_ASKING_PRICE || "285000",
  rehabEstimate: process.env.QA_TEST_REHAB || "45000",
};

async function waitForSettledPage(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function getMasterReportAccessPanel(page) {
  const testIdPanel = page.getByTestId("master-report-access-panel");
  if (await testIdPanel.count()) {
    return testIdPanel;
  }

  return page
    .locator("div.section-card", {
      has: page.getByRole("heading", { name: /Run Master Deal Report/i }),
    })
    .first();
}

async function getStartSubscriptionButton(page) {
  const testIdButton = page.getByTestId("start-subscription-checkout");
  if (await testIdButton.count()) {
    return testIdButton;
  }

  return page.getByRole("button", { name: /Start Free Trial|Upgrade to Pro/i });
}

async function getBuyCreditsButton(page) {
  const testIdButton = page.getByTestId("buy-report-credits");
  if (await testIdButton.count()) {
    return testIdButton;
  }

  return page.getByRole("button", { name: /Buy 10 Credits/i });
}

export class QaBillingGateError extends Error {
  constructor(message, details = {}) {
    super(`${BILLING_GATE_PREFIX} ${cleanText(message)}`);
    this.name = "QaBillingGateError";
    this.code = "QA_BILLING_GATE";
    this.details = details;
  }
}

export function isQaBillingGateError(error) {
  return error?.code === "QA_BILLING_GATE" || String(error?.message || "").includes(BILLING_GATE_PREFIX);
}

export function getQaBillingGateMessage(error) {
  return cleanText(String(error?.message || error || "").replace(BILLING_GATE_PREFIX, ""));
}

export async function seedQaAuth(page) {
  await page.addInitScript((token) => {
    window.localStorage.setItem("token", token);
    window.localStorage.setItem("authLastActivityAt", String(Date.now()));
  }, qaToken);
}

export function attachConsoleCapture(page) {
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

export async function openHomepage(page) {
  await page.goto("/");
  await waitForSettledPage(page);
}

export async function openLoginPage(page) {
  await page.goto("/login");
  await waitForSettledPage(page);
  await expect(page.getByRole("heading", { name: /Sign in to your Fliprop workspace/i })).toBeVisible();
}

export async function openPricingPage(page) {
  await page.goto("/pricing");
  await waitForSettledPage(page);
}

export async function openProductPage(page) {
  await page.goto("/product");
  await waitForSettledPage(page);
}

export async function loginWithCredentials(page) {
  if (!hasQaCredentials) {
    throw new Error(
      "Protected live Fliprop flows require QA_USER_EMAIL and QA_USER_PASSWORD."
    );
  }

  await openLoginPage(page);
  await page.getByLabel("Work email").fill(qaUserEmail);
  await page.getByLabel("Password").fill(qaUserPassword);

  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 60000 }),
    page.getByRole("button", { name: /Sign in/i }).click(),
  ]);

  await waitForSettledPage(page);
}

export async function ensureAuthenticated(page) {
  if (!isExternalQaTarget) {
    await seedQaAuth(page);
    return;
  }

  await loginWithCredentials(page);
}

export async function assertProtectedRouteRedirectsToLogin(page) {
  await page.goto("/comps-report");
  await waitForSettledPage(page);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Sign in to your Fliprop workspace/i })).toBeVisible();
}

export async function openMasterReportPage(page) {
  if (!canRunProtectedQaFlows) {
    return assertProtectedRouteRedirectsToLogin(page);
  }

  await ensureAuthenticated(page);
  await page.goto("/comps-report");
  await waitForSettledPage(page);

  if (isExternalQaTarget && /\/login(?:$|\?)/.test(page.url())) {
    await loginWithCredentials(page);
    await page.goto("/comps-report");
    await waitForSettledPage(page);
  }

  await expect(page.getByRole("heading", { name: /Turn an address and a few deal assumptions/i })).toBeVisible();
}

export async function fillPropertyIntake(page) {
  await page.getByTestId("report-address-input").fill(defaultPropertyInput.addressLine1);
  await page.getByLabel("City").fill(defaultPropertyInput.city);
  await page.getByLabel("State").fill(defaultPropertyInput.state);
  await page.getByLabel("Zip code").fill(defaultPropertyInput.zipCode);
  await page.getByTestId("report-asking-price-input").fill(defaultPropertyInput.askingPrice);
  await page.getByTestId("report-rehab-input").fill(defaultPropertyInput.rehabEstimate);
}

export async function refreshPropertyFacts(page) {
  await page.getByTestId("report-autofill-button").click();
  await expect(page.getByText(/Sangamon County/i)).toBeVisible();
  await expect(page.getByText(/4 bd/i)).toBeVisible();
}

async function waitForMasterReportAccessResolution(page) {
  const accessPanel = await getMasterReportAccessPanel(page);
  await accessPanel.waitFor({ state: "visible" });
  await page.getByTestId("run-master-report").waitFor({ state: "visible" });
  await expect(accessPanel).not.toContainText(/Checking report access/i, { timeout: 15000 }).catch(() => {});
}

export async function getMasterReportAccessState(page) {
  await waitForMasterReportAccessResolution(page);

  const accessPanel = await getMasterReportAccessPanel(page);
  const accessMessage = cleanText(await accessPanel.textContent());
  const runButton = page.getByTestId("run-master-report");
  const runEnabled = await runButton.isEnabled();
  const hasSubscriptionCta = (await (await getStartSubscriptionButton(page)).count()) > 0;
  const hasCreditPurchaseCta = (await (await getBuyCreditsButton(page)).count()) > 0;
  const isBillingGate =
    !runEnabled &&
    (hasSubscriptionCta ||
      hasCreditPurchaseCta ||
      /free trial|upgrade to pro|buy 10 credits|unlock/i.test(accessMessage));
  const blockingReason = hasSubscriptionCta && hasCreditPurchaseCta
    ? "This account must start the Pro trial or buy credits before it can run a Master Deal Report."
    : hasSubscriptionCta
      ? "This report is locked until the account starts the Pro trial."
      : hasCreditPurchaseCta
        ? "This account is out of report credits and needs a new credit purchase to continue."
        : accessMessage;

  return {
    runEnabled,
    isBillingGate,
    accessMessage,
    blockingReason,
    hasSubscriptionCta,
    hasCreditPurchaseCta,
  };
}

export async function ensureMasterReportRunnable(page) {
  const accessState = await getMasterReportAccessState(page);

  if (accessState.runEnabled) {
    return accessState;
  }

  if (accessState.isBillingGate) {
    throw new QaBillingGateError(
      accessState.blockingReason ||
        "This account needs to start the Pro trial or buy credits before it can run a Master Deal Report.",
      accessState
    );
  }

  throw new Error(
    `QA_REPORT_BUTTON_DISABLED: ${accessState.accessMessage || "Run Master Deal Report stayed disabled for a non-billing reason."}`
  );
}

export async function buildMasterReport(page, options = {}) {
  if (options.radius !== undefined) {
    await page.getByTestId("master-radius-input").fill(String(options.radius));
  }
  if (options.askingPrice !== undefined) {
    await page.getByTestId("deal-asking-price-input").fill(String(options.askingPrice));
  }
  if (options.rehabEstimate !== undefined) {
    await page.getByTestId("deal-rehab-input").fill(String(options.rehabEstimate));
  }

  await ensureMasterReportRunnable(page);
  await page.getByTestId("run-master-report").click();
  await expect(page.getByTestId("master-deal-report")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Deal Analysis/i })).toBeVisible();
}

export async function openSavedReport(page) {
  await page.getByTestId("report-tab-saved").click();
  await expect(page.getByTestId("saved-comps-report")).toBeVisible();
}

export async function saveMasterReport(page) {
  await page.getByTestId("save-master-report").click();
  await expect(page.getByTestId("saved-comps-report")).toBeVisible();
}

export async function countVisibleCompRows(page) {
  const selectors = [
    "[data-testid='primary-comp-row']",
    "[data-testid='recent-sale-comp-row']",
    "[data-testid='active-market-comp-row']",
  ];

  const counts = await Promise.all(
    selectors.map((selector) => page.locator(selector).count())
  );

  return counts.reduce((sum, value) => sum + value, 0);
}

export async function captureScreen(page, fileName, options = {}) {
  const filePath = path.join(screenshotsDir, fileName);
  await page.screenshot({
    path: filePath,
    fullPage: true,
    ...options,
  });
  return filePath;
}

export async function capturePageSummary(page) {
  return page.evaluate(() => {
    const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const unique = (items) => Array.from(new Set(items.filter(Boolean)));

    const headings = unique(
      Array.from(document.querySelectorAll("h1, h2, h3, h4")).map((element) => cleanText(element.textContent))
    ).slice(0, 18);

    const buttons = unique(
      Array.from(document.querySelectorAll("button, a"))
        .map((element) => cleanText(element.textContent))
        .filter((text) => text && text.length <= 90)
    ).slice(0, 18);

    const labels = unique(
      Array.from(document.querySelectorAll("label"))
        .map((element) => cleanText(element.textContent))
        .filter((text) => text && text.length <= 90)
    ).slice(0, 18);

    const keySections = unique(
      Array.from(document.querySelectorAll("section, [class*='section-card'], [class*='surface-panel']"))
        .map((element) => cleanText(element.textContent).slice(0, 220))
        .filter((text) => text && text.length > 20)
    ).slice(0, 10);

    return {
      title: cleanText(document.title),
      url: window.location.href,
      headings,
      buttons,
      labels,
      keySections,
    };
  });
}

export async function prepareAuditPage(page, pageConfig) {
  if (pageConfig.id === "homepage" || pageConfig.id === "home") {
    await openHomepage(page);
    return;
  }

  if (pageConfig.id === "login") {
    await openLoginPage(page);
    return;
  }

  if (pageConfig.id === "pricing") {
    await openPricingPage(page);
    return;
  }

  if (pageConfig.id === "product") {
    await openProductPage(page);
    return;
  }

  if (pageConfig.id === "master_report") {
    await openMasterReportPage(page);
    await fillPropertyIntake(page);
    await refreshPropertyFacts(page);
    await buildMasterReport(page);
    return;
  }

  if (pageConfig.id === "saved_report") {
    await openMasterReportPage(page);
    await fillPropertyIntake(page);
    await refreshPropertyFacts(page);
    await buildMasterReport(page);
    await saveMasterReport(page);
    await openSavedReport(page);
    return;
  }

  throw new Error(`Unsupported audit page id: ${pageConfig.id}`);
}
