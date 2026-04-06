import path from "node:path";
import { expect } from "@playwright/test";
import { qaToken, screenshotsDir } from "./shared.mjs";

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
  await page.waitForLoadState("networkidle");
}

export async function openMasterReportPage(page) {
  await seedQaAuth(page);
  await page.goto("/comps-report");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: /Turn an address and a few deal assumptions/i })).toBeVisible();
}

export async function fillPropertyIntake(page) {
  await page.getByTestId("report-address-input").fill("742 Evergreen Terrace");
  await page.getByLabel("City").fill("Springfield");
  await page.getByLabel("State").fill("IL");
  await page.getByLabel("Zip code").fill("62704");
  await page.getByTestId("report-asking-price-input").fill("285000");
  await page.getByTestId("report-rehab-input").fill("45000");
}

export async function refreshPropertyFacts(page) {
  await page.getByTestId("report-autofill-button").click();
  await expect(page.getByText(/Sangamon County/i)).toBeVisible();
  await expect(page.getByText(/4 bd/i)).toBeVisible();
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
