import fs from "node:fs/promises";
import { chromium } from "@playwright/test";
import {
  defaultBaseUrl,
  ensureDir,
  resultsDir,
  runId,
  screenshotsDir,
  startLocalQaServer,
  uxReportFile,
  uxScreens,
  writeJson,
} from "./shared.mjs";
import {
  buildMasterReport,
  capturePageSummary,
  captureScreen,
  fillPropertyIntake,
  openHomepage,
  openMasterReportPage,
  openSavedReport,
  refreshPropertyFacts,
  saveMasterReport,
} from "./browserHelpers.mjs";
import { reviewSchemaExample, reviewSystemPrompt } from "./reviewPrompt.mjs";

const server = await startLocalQaServer();
await ensureDir(resultsDir);
await ensureDir(screenshotsDir);

let openAIClient = null;

if (process.env.OPENAI_API_KEY && process.env.QA_OPENAI_MODEL) {
  try {
    const { default: OpenAI } = await import("openai");
    openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (error) {
    openAIClient = null;
  }
}

async function maybeReviewWithAI({ label, screenshotPath, summary }) {
  if (!openAIClient || !process.env.QA_OPENAI_MODEL) {
    return {
      status: "pending_configuration",
      prompt: reviewSystemPrompt,
      payload: {
        label,
        summary,
        schemaExample: reviewSchemaExample,
      },
    };
  }

  try {
    const imageBuffer = await fs.readFile(screenshotPath);
    const imageData = imageBuffer.toString("base64");
    const response = await openAIClient.responses.create({
      model: process.env.QA_OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: reviewSystemPrompt }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Review this Fliprop screen.\nScreen label: ${label}\nPage summary:\n${JSON.stringify(summary, null, 2)}`,
            },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${imageData}`,
            },
          ],
        },
      ],
    });

    const parsed = JSON.parse(response.output_text);
    return {
      status: "completed",
      ...parsed,
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
      prompt: reviewSystemPrompt,
      payload: {
        label,
        summary,
        schemaExample: reviewSchemaExample,
      },
    };
  }
}

async function captureScreenReview(browser, screen) {
  const page = await browser.newPage();

  try {
    if (screen.id === "homepage") {
      await openHomepage(page);
    }

    if (screen.id === "master_report") {
      await openMasterReportPage(page);
      await fillPropertyIntake(page);
      await refreshPropertyFacts(page);
      await buildMasterReport(page);
    }

    if (screen.id === "saved_report") {
      await openMasterReportPage(page);
      await fillPropertyIntake(page);
      await refreshPropertyFacts(page);
      await buildMasterReport(page);
      await saveMasterReport(page);
      await openSavedReport(page);
    }

    const summary = await capturePageSummary(page);
    const screenshotPath = await captureScreen(page, `${screen.id}.png`);
    const review = await maybeReviewWithAI({
      label: screen.label,
      screenshotPath,
      summary,
    });

    return {
      id: screen.id,
      label: screen.label,
      url: page.url(),
      screenshotPath,
      summary,
      review,
    };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({
  headless: true,
});
const context = await browser.newContext({
  baseURL: process.env.QA_BASE_URL || server.baseUrl || defaultBaseUrl,
  viewport: { width: 1440, height: 1024 },
});

try {
  const screens = [];

  for (const screen of uxScreens) {
    screens.push(await captureScreenReview(context, screen));
  }

  await writeJson(uxReportFile, {
    generatedAt: new Date().toISOString(),
    runId,
    baseUrl: process.env.QA_BASE_URL || server.baseUrl || defaultBaseUrl,
    aiEnabled: Boolean(openAIClient && process.env.QA_OPENAI_MODEL),
    screens,
  });

  process.stdout.write(`\nUX review report written to ${uxReportFile}\n`);
} finally {
  await context.close();
  await browser.close();
  await server.stop();
}
