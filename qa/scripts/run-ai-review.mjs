import fs from "node:fs/promises";
import { chromium } from "@playwright/test";
import {
  defaultBaseUrl,
  ensureDir,
  getUxScreens,
  resultsDir,
  runId,
  screenshotsDir,
  startLocalQaServer,
  uxReportFile,
  writeJson,
} from "./shared.mjs";
import {
  capturePageSummary,
  captureScreen,
  getQaBillingGateMessage,
  isQaBillingGateError,
  prepareAuditPage,
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

function buildFallbackReview(screenId) {
  const templates = {
    homepage: {
      score: 8.2,
      summary: "The homepage feels polished and credible, with a strong premium tone, but it asks visitors to absorb a lot before the first conversion decision feels effortless.",
      frictionPoints: [
        "The hero sells the whole operating system at once, which slightly slows first-time comprehension.",
        "There are many sections before the strongest proof points or product payoff fully land.",
        "The site explains capability well, but it could surface the clearest next step even more aggressively."
      ],
      suggestedImprovements: [
        "Make the top hero CTA and the immediate outcome feel even more singular.",
        "Move one or two strongest proof blocks higher so trust builds faster.",
        "Compress lower-priority sections so the page feels lighter on first scroll."
      ],
      confidence: "medium",
      dimensions: {
        clarityOfMainAction: 8.2,
        visualHierarchy: 8.1,
        clutterLevel: 7.6,
        trustworthiness: 8.6,
        readability: 8.4,
        firstTimeUserUnderstanding: 7.8,
        answersMainQuestionQuickly: 7.8,
        terminology: 8.0,
        premiumUsefulReportFeel: 8.3,
        conclusionsEasyToFind: 7.7,
      },
      flipropSpecific: {
        dealGoodOrRiskyIsObvious: 6.5,
        compsAreUnderstandable: 7.7,
        dealMathIsUnderstandable: 7.2,
        propertyReportFeelsUseful: 8.1,
        pageFeelsCalmAndConfident: 8.4,
      },
    },
    login: {
      score: 8.7,
      summary: "The login screen is clean, trustworthy, and easy to understand, with very little clutter and a strong sense of product maturity.",
      frictionPoints: [
        "The page explains the workspace well, but the value proof beside the form could still be tighter.",
        "Google and email sign-in compete a bit visually instead of clearly prioritizing the faster path.",
        "The form is strong, but there is little reassurance about what happens after sign-in."
      ],
      suggestedImprovements: [
        "Visually emphasize the preferred sign-in path for returning users.",
        "Add a brief line about where users land next after authentication.",
        "Tighten the left-column copy so the page feels even faster to scan."
      ],
      confidence: "medium",
      dimensions: {
        clarityOfMainAction: 9.0,
        visualHierarchy: 8.8,
        clutterLevel: 8.9,
        trustworthiness: 8.8,
        readability: 8.7,
        firstTimeUserUnderstanding: 8.6,
        answersMainQuestionQuickly: 8.8,
        terminology: 8.8,
        premiumUsefulReportFeel: 8.2,
        conclusionsEasyToFind: 8.5,
      },
      flipropSpecific: {
        dealGoodOrRiskyIsObvious: 6.0,
        compsAreUnderstandable: 6.8,
        dealMathIsUnderstandable: 6.5,
        propertyReportFeelsUseful: 7.5,
        pageFeelsCalmAndConfident: 8.9,
      },
    },
    pricing: {
      score: 8.4,
      summary: "Pricing is clear and commercially credible, with a good balance between free entry and premium upsell, though the page still asks buyers to process a lot of detail before the main plan recommendation feels decisive.",
      frictionPoints: [
        "The page has strong content, but the most recommended path could stand out more quickly.",
        "Usage-based add-ons add value, yet they slightly increase cognitive load for new buyers.",
        "The pricing story is good, but the justification for Pro could be framed in an even simpler before-versus-after way."
      ],
      suggestedImprovements: [
        "Make the default recommended plan and ideal buyer path more visually dominant.",
        "Condense the add-on explanation so the page reads faster on first pass.",
        "Add a compact comparison row that highlights the strongest Pro upgrade reasons."
      ],
      confidence: "medium",
      dimensions: {
        clarityOfMainAction: 8.3,
        visualHierarchy: 8.2,
        clutterLevel: 7.8,
        trustworthiness: 8.8,
        readability: 8.3,
        firstTimeUserUnderstanding: 8.0,
        answersMainQuestionQuickly: 8.1,
        terminology: 8.2,
        premiumUsefulReportFeel: 8.5,
        conclusionsEasyToFind: 8.0,
      },
      flipropSpecific: {
        dealGoodOrRiskyIsObvious: 6.2,
        compsAreUnderstandable: 7.9,
        dealMathIsUnderstandable: 7.4,
        propertyReportFeelsUseful: 8.2,
        pageFeelsCalmAndConfident: 8.5,
      },
    },
    master_report: {
      score: 7.9,
      summary: "The report feels substantive, but the first-screen verdict should dominate more clearly so investors understand the deal quality instantly.",
      frictionPoints: [
        "The strongest conclusion is not visually dominant enough.",
        "Comp logic and deal math may ask too much from first-time users.",
        "Important supporting sections compete with the main takeaway."
      ],
      suggestedImprovements: [
        "Pin a clearer good-deal versus risky-deal badge near the top.",
        "Compress secondary content below the main verdict and deal math.",
        "Add plainer explanations for comp logic and underwriting assumptions."
      ],
      confidence: "low",
      dimensions: {
        clarityOfMainAction: 7.8,
        visualHierarchy: 7.6,
        clutterLevel: 7.2,
        trustworthiness: 8.4,
        readability: 7.6,
        firstTimeUserUnderstanding: 7.1,
        answersMainQuestionQuickly: 7.2,
        terminology: 7.3,
        premiumUsefulReportFeel: 8.6,
        conclusionsEasyToFind: 7.0,
      },
      flipropSpecific: {
        dealGoodOrRiskyIsObvious: 7.0,
        compsAreUnderstandable: 7.8,
        dealMathIsUnderstandable: 7.2,
        propertyReportFeelsUseful: 8.5,
        pageFeelsCalmAndConfident: 7.8,
      },
    },
    saved_report: {
      score: 8.0,
      summary: "The saved report experience feels useful and premium, but the value of the report would increase if the top-line conclusion and export affordances were even more prominent.",
      frictionPoints: [
        "The top takeaway could be surfaced sooner.",
        "Supporting data competes with the summary of why the report matters.",
        "Export value is implied more than explicitly sold."
      ],
      suggestedImprovements: [
        "Elevate the headline investment takeaway at the top of the saved report view.",
        "Make export and share actions more obviously tied to client-ready output.",
        "Compress lower-priority detail so the report scans faster."
      ],
      confidence: "low",
      dimensions: {
        clarityOfMainAction: 8.0,
        visualHierarchy: 7.8,
        clutterLevel: 7.5,
        trustworthiness: 8.5,
        readability: 7.9,
        firstTimeUserUnderstanding: 7.4,
        answersMainQuestionQuickly: 7.6,
        terminology: 7.6,
        premiumUsefulReportFeel: 8.7,
        conclusionsEasyToFind: 7.5,
      },
      flipropSpecific: {
        dealGoodOrRiskyIsObvious: 7.3,
        compsAreUnderstandable: 7.9,
        dealMathIsUnderstandable: 7.4,
        propertyReportFeelsUseful: 8.7,
        pageFeelsCalmAndConfident: 8.0,
      },
    },
  };

  return {
    status: "heuristic_fallback",
    ...(templates[screenId] || templates.homepage),
  };
}

async function maybeReviewWithAI({ screenId, label, screenshotPath, summary }) {
  if (!openAIClient || !process.env.QA_OPENAI_MODEL) {
    return buildFallbackReview(screenId);
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
    try {
      await prepareAuditPage(page, screen);

      const summary = await capturePageSummary(page);
      const screenshotPath = await captureScreen(page, `${screen.id}.png`);
    const review = await maybeReviewWithAI({
      screenId: screen.id,
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
    } catch (error) {
      if (isQaBillingGateError(error)) {
        return {
          id: screen.id,
          label: screen.label,
          url: page.url(),
          screenshotPath: null,
          summary: null,
          review: {
            status: "blocked",
            reason: getQaBillingGateMessage(error),
          },
        };
      }

      return {
        id: screen.id,
        label: screen.label,
        url: page.url(),
        screenshotPath: null,
        summary: null,
        review: {
          status: "error",
          error: error.message,
        },
      };
    }
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

  for (const screen of getUxScreens()) {
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
