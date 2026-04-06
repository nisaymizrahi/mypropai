import { a11yReportFile, functionalFlowWeights, functionalReportFile, getReleaseBand, htmlReportFile, lighthouseReportFile, markdownReportFile, readJson, resultsDir, runId, scoreWeights, summaryReportFile, uxReportFile, writeJson, writeText } from "./shared.mjs";

function flattenSuites(suites = [], bucket = []) {
  for (const suite of suites) {
    if (suite.specs?.length) {
      bucket.push(...suite.specs);
    }
    if (suite.suites?.length) {
      flattenSuites(suite.suites, bucket);
    }
  }
  return bucket;
}

function parseFunctionalReport(report) {
  const specs = flattenSuites(report?.suites || []);
  const flowByTitle = {
    "home landing works": "home_landing",
    "property intake refreshes facts": "property_intake",
    "master report renders core sections": "master_report",
    "map markers track the visible comp set": "map_and_comps",
    "saved report export produces a non-empty pdf": "saved_report_export",
    "mobile viewport keeps the primary flow usable": "mobile_sanity",
    "protected report route is gated behind login on the live site": "protected_route_guard",
  };

  const flows = {};

  for (const spec of specs) {
    const title = String(spec.title || "").toLowerCase();
    const flowId =
      spec.tests?.[0]?.annotations?.find((annotation) => annotation.type === "flow")?.description ||
      flowByTitle[title];

    if (!flowId) continue;

    const results = spec.tests?.[0]?.results || [];
    const skipDescriptions = (spec.tests?.[0]?.annotations || [])
      .filter((annotation) => annotation.type === "skip")
      .map((annotation) => annotation.description)
      .filter(Boolean);
    const blockedDescriptions = (spec.tests?.[0]?.annotations || [])
      .filter((annotation) => annotation.type === "blocked")
      .map((annotation) => annotation.description)
      .filter(Boolean);
    const allErrors = results
      .flatMap((result) =>
        result.error ? [result.error.message] : (result.errors || []).map((error) => error.message)
      )
      .filter(Boolean);
    const blockedError = allErrors.find((message) => String(message).includes("QA_BILLING_GATE:"));
    const failed = results.some((result) => ["failed", "timedOut", "interrupted"].includes(result.status));
    const passed = results.some((result) => result.status === "passed");
    const skipped = results.some((result) => result.status === "skipped");

    flows[flowId] = {
      title: spec.title,
      status:
        blockedDescriptions.length || blockedError
          ? "blocked"
          : failed
            ? "failed"
            : passed
              ? "passed"
              : skipped
                ? "skipped"
                : "skipped",
      errors: allErrors,
      skipReasons: skipDescriptions,
      blockedReason:
        blockedDescriptions[0] ||
        (blockedError ? String(blockedError).replace("QA_BILLING_GATE:", "").trim() : null),
    };
  }

  const totalWeight = Object.values(functionalFlowWeights).reduce((sum, weight) => sum + weight, 0);
  const eligibleWeight = Object.entries(functionalFlowWeights).reduce((sum, [flowId, weight]) => {
    return sum + (["skipped", "blocked"].includes(flows[flowId]?.status) ? 0 : weight);
  }, 0);
  const blockedWeight = Object.entries(functionalFlowWeights).reduce((sum, [flowId, weight]) => {
    return sum + (flows[flowId]?.status === "blocked" ? weight : 0);
  }, 0);
  const skippedWeight = Object.entries(functionalFlowWeights).reduce((sum, [flowId, weight]) => {
    return sum + (flows[flowId]?.status === "skipped" ? weight : 0);
  }, 0);
  const passedWeight = Object.entries(functionalFlowWeights).reduce((sum, [flowId, weight]) => {
    return sum + (flows[flowId]?.status === "passed" ? weight : 0);
  }, 0);
  const qualityScore = eligibleWeight ? Math.round((passedWeight / eligibleWeight) * 100) : 0;
  const coveragePercent = totalWeight ? Math.round((eligibleWeight / totalWeight) * 100) : 0;
  const score = Math.round(qualityScore * (0.5 + (0.5 * coveragePercent) / 100));

  return {
    score,
    flows,
    coverage: {
      testedWeight: eligibleWeight,
      blockedWeight,
      skippedWeight,
      totalWeight,
      percent: coveragePercent,
    },
    qualityScore,
    pass:
      score >= 85 &&
      coveragePercent >= 60 &&
      Object.entries(flows)
        .filter(([, flow]) => !["skipped", "blocked"].includes(flow.status))
        .every(([, flow]) => flow.status === "passed") &&
      ["home_landing", "property_intake", "master_report", "map_and_comps", "saved_report_export"].filter(
        (flowId) => !["skipped", "blocked"].includes(flows[flowId]?.status)
      ).every(
        (flowId) => flows[flowId]?.status === "passed"
      ),
  };
}

function scoreA11y(report) {
  const penaltyByImpact = {
    critical: 20,
    serious: 10,
    moderate: 4,
    minor: 1,
    unknown: 2,
  };

  const pages = (report?.pages || []).map((page) => {
    if (page.status === "blocked") {
      return {
        ...page,
        score: null,
      };
    }

    if (page.error) {
      return {
        ...page,
        score: 0,
      };
    }

    const penalty = page.violations.reduce(
      (sum, violation) => sum + (penaltyByImpact[violation.impact] || penaltyByImpact.unknown),
      0
    );
    const score = Math.max(0, 100 - penalty);

    return {
      ...page,
      score,
    };
  });

  const scorablePages = pages.filter((page) => page.score !== null);
  const averageScore = scorablePages.length
    ? scorablePages.reduce((sum, page) => sum + page.score, 0) / scorablePages.length
    : 0;
  const hasErrors = pages.some((page) => Boolean(page.error));
  const hasCritical = scorablePages.some((page) => page.violations.some((violation) => violation.impact === "critical"));
  const hasSerious = scorablePages.some((page) => page.violations.some((violation) => violation.impact === "serious"));

  return {
    score: Math.round(averageScore),
    pages,
    pass: !hasErrors && !hasCritical && !hasSerious,
  };
}

function scoreLighthouse(report) {
  const pages = (report?.pages || []).map((page) => {
    if (page.status === "blocked") {
      return {
        ...page,
        technicalScore: null,
      };
    }

    const technicalScore =
      page.scores.performance * 0.5 +
      page.scores.bestPractices * 0.3 +
      page.scores.seo * 0.2;

    return {
      ...page,
      technicalScore: Math.round(technicalScore),
    };
  });

  const scorablePages = pages.filter((page) => page.technicalScore !== null);
  const averageScore = scorablePages.length
    ? scorablePages.reduce((sum, page) => sum + page.technicalScore, 0) / scorablePages.length
    : 0;

  return {
    score: Math.round(averageScore),
    pages,
    pass: averageScore >= 80,
  };
}

function scoreUx(report) {
  const completedStatuses = new Set(["completed", "heuristic_fallback"]);
  const completedScreens = (report?.screens || []).filter((screen) => completedStatuses.has(screen.review?.status));

  if (!completedScreens.length) {
    return {
      score: null,
      polishScore: null,
      screens: report?.screens || [],
      pass: null,
      polishPass: null,
    };
  }

  const usability = completedScreens.reduce((sum, screen) => sum + Number(screen.review.score || 0) * 10, 0) / completedScreens.length;
  const polish = completedScreens.reduce((sum, screen) => {
    const review = screen.review;
    const trust = Number(review.dimensions?.trustworthiness || 0);
    const premium = Number(review.dimensions?.premiumUsefulReportFeel || 0);
    const conclusions = Number(review.dimensions?.conclusionsEasyToFind || 0);
    return sum + ((trust + premium + conclusions) / 3) * 10;
  }, 0) / completedScreens.length;

  return {
    score: Math.round(usability),
    polishScore: Math.round(polish),
    screens: report?.screens || [],
    pass: usability >= 75,
    polishPass: polish >= 75,
  };
}

function computeOverallScore(sections) {
  const available = Object.entries(sections).filter(([, section]) => section.score !== null && section.score !== undefined);
  const totalWeight = available.reduce((sum, [key]) => sum + scoreWeights[key], 0);

  if (!totalWeight) {
    return {
      score: 0,
      normalizedWeight: 0,
      skipped: Object.keys(scoreWeights),
    };
  }

  const weighted = available.reduce(
    (sum, [key, section]) => sum + section.score * scoreWeights[key],
    0
  );

  return {
    score: Math.round(weighted / totalWeight),
    normalizedWeight: totalWeight,
    skipped: Object.keys(scoreWeights).filter((key) => !available.find(([candidate]) => candidate === key)),
  };
}

function buildTopIssues(functionality, accessibility, lighthouse, ux) {
  const issues = [];

  if (functionality.coverage?.percent < 100) {
    const blockedWeight = functionality.coverage?.blockedWeight || 0;
    const skippedWeight = functionality.coverage?.skippedWeight || 0;
    const coverageNotes = [];

    if (blockedWeight > 0) {
      coverageNotes.push(
        `${Math.round((blockedWeight / functionality.coverage.totalWeight) * 100)}% was blocked by billing access on the tested account`
      );
    }
    if (skippedWeight > 0) {
      coverageNotes.push(
        `${Math.round((skippedWeight / functionality.coverage.totalWeight) * 100)}% was skipped because the flow was not available in this run`
      );
    }

    issues.push({
      area: "Coverage",
      severity: 1,
      text: `Functional coverage was ${functionality.coverage.percent}%. ${coverageNotes.join(". ") || "Some flows were not exercised in this run."}`,
    });
  }

  const blockedFlows = Object.entries(functionality.flows).filter(([, flow]) => flow.status === "blocked");
  if (blockedFlows.length) {
    issues.push({
      area: "Billing",
      severity: 2,
      text: `Paid report flows were blocked for this account: ${blockedFlows.map(([, flow]) => flow.title).join(", ")}.`,
    });
  }

  Object.entries(functionality.flows)
    .filter(([, flow]) => flow.status !== "passed")
    .forEach(([flowId, flow]) => {
      if (["skipped", "blocked"].includes(flow.status)) {
        return;
      }
      issues.push({
        area: "Functionality",
        severity: 1,
        text: `${flow.title || flowId} failed.`,
      });
    });

  accessibility.pages.forEach((page) => {
    if (page.status === "blocked") {
      return;
    }

    if (page.error) {
      issues.push({
        area: "Accessibility",
        severity: 2,
        text: `${page.label}: accessibility audit could not complete (${page.error}).`,
      });
      return;
    }

    page.violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
      .slice(0, 2)
      .forEach((violation) => {
        issues.push({
          area: "Accessibility",
          severity: 2,
          text: `${page.label}: ${violation.help} (${violation.impact}).`,
        });
      });
  });

  lighthouse.pages.forEach((page) => {
    if (page.status === "blocked") {
      return;
    }

    if (page.error) {
      issues.push({
        area: "Lighthouse",
        severity: 3,
        text: `${page.label}: Lighthouse audit could not complete (${page.error}).`,
      });
      return;
    }

    if (page.technicalScore < 80) {
      issues.push({
        area: "Lighthouse",
        severity: 3,
        text: `${page.label}: technical score is ${page.technicalScore}.`,
      });
    }

    page.lowScoringAudits.slice(0, 2).forEach((audit) => {
      issues.push({
        area: "Lighthouse",
        severity: 4,
        text: `${page.label}: ${audit.title} scored ${audit.score}.`,
      });
    });
  });

  ux.screens
    .filter((screen) => ["completed", "heuristic_fallback"].includes(screen.review?.status))
    .forEach((screen) => {
      (screen.review.frictionPoints || []).slice(0, 2).forEach((point) => {
        issues.push({
          area: "UX",
          severity: 5,
          text: `${screen.label}: ${point}`,
        });
      });
    });

  ux.screens
    .filter((screen) => screen.review?.status === "blocked")
    .forEach((screen) => {
      issues.push({
        area: "Coverage",
        severity: 4,
        text: `${screen.label}: UX review was blocked because the tested account could not unlock this paid flow.`,
      });
    });

  ux.screens
    .filter((screen) => screen.review?.status === "error")
    .forEach((screen) => {
      issues.push({
        area: "UX",
        severity: 4,
        text: `${screen.label}: UX review could not complete (${screen.review.error}).`,
      });
    });

  return issues.sort((left, right) => left.severity - right.severity).slice(0, 10);
}

function renderMarkdown(summary) {
  const { overall, sections, topIssues } = summary;

  return `# Fliprop QA Report

- Timestamp: ${summary.generatedAt}
- Run ID: ${summary.runId}
- Environment: ${summary.environment.baseUrl}
- Score: ${overall.score}/100 (${overall.band.label})
- Release readiness: ${overall.band.readiness}

## Section Scores

| Section | Score | Status |
| --- | ---: | --- |
| Functionality | ${sections.functionality.score}/100 | ${sections.functionality.pass ? "Pass" : "Fail"} |
| Accessibility | ${sections.accessibility.score}/100 | ${sections.accessibility.pass ? "Pass" : "Fail"} |
| Performance | ${sections.performance.score}/100 | ${sections.performance.pass ? "Pass" : "Fail"} |
| Usability / AI UX | ${sections.usability.score ?? "Skipped"}${sections.usability.score !== null ? "/100" : ""} | ${sections.usability.pass === null ? "Skipped" : sections.usability.pass ? "Pass" : "Fail"} |
| Polish / Trust | ${sections.polish.score ?? "Skipped"}${sections.polish.score !== null ? "/100" : ""} | ${sections.polish.pass === null ? "Skipped" : sections.polish.pass ? "Pass" : "Fail"} |

- Functional quality on tested flows: ${sections.functionality.details.qualityScore ?? 0}/100
- Functional coverage: ${sections.functionality.details.coverage?.percent ?? 0}% of weighted flows exercised
- Billing-gated flow weight: ${sections.functionality.details.coverage?.blockedWeight ?? 0}/${sections.functionality.details.coverage?.totalWeight ?? 0}

## Top Issues To Fix First

${topIssues.length ? topIssues.map((issue) => `- [${issue.area}] ${issue.text}`).join("\n") : "- No major issues surfaced."}

## Functional Results

${Object.entries(sections.functionality.details.flows)
  .map(([flowId, flow]) => {
    if (flow.status === "blocked" && flow.blockedReason) {
      return `- ${flow.title || flowId}: blocked (${flow.blockedReason})`;
    }
    if (flow.status === "skipped" && flow.skipReasons?.length) {
      return `- ${flow.title || flowId}: skipped (${flow.skipReasons[0]})`;
    }
    return `- ${flow.title || flowId}: ${flow.status}`;
  })
  .join("\n")}

## Accessibility Findings

${sections.accessibility.details.pages
  .map((page) => page.status === "blocked"
    ? `- ${page.label}: blocked (${page.blockedReason})`
    : `- ${page.label}: ${page.violations.length} violations, score ${page.score}`)
  .join("\n")}

## Lighthouse Scores

${sections.performance.details.pages
  .map(
    (page) =>
      page.status === "blocked"
        ? `- ${page.label}: blocked (${page.blockedReason})`
        : `- ${page.label}: perf ${page.scores.performance}, a11y ${page.scores.accessibility}, best practices ${page.scores.bestPractices}, seo ${page.scores.seo}`
  )
  .join("\n")}

## UX Review

${sections.usability.details.screens.length
  ? sections.usability.details.screens
      .map((screen) => {
        if (screen.review?.status === "blocked") {
          return `- ${screen.label}: blocked (${screen.review.reason})`;
        }
        return `- ${screen.label}: ${["completed", "heuristic_fallback"].includes(screen.review?.status) ? `${screen.review.score}/10` : screen.review?.status || "pending"}`;
      })
      .join("\n")
  : "- No UX screens were captured."}
`;
}

function renderHtml(summary) {
  const markdown = renderMarkdown(summary)
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^\| (.*) \|$/gm, "<pre>$&</pre>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Fliprop QA Report</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px auto; max-width: 1100px; padding: 0 20px; color: #2f251d; background: #f7f2ea; }
      h1, h2 { color: #1f1914; }
      .score { font-size: 40px; font-weight: 700; margin: 0; }
      .card { background: #fff; border: 1px solid rgba(47, 37, 29, 0.08); border-radius: 20px; padding: 20px; margin: 18px 0; box-shadow: 0 10px 22px rgba(47, 37, 29, 0.06); }
      ul { padding-left: 20px; }
      pre { white-space: pre-wrap; background: #f2ece3; padding: 12px; border-radius: 12px; }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="score">${summary.overall.score}/100</p>
      <p>${summary.overall.band.label} • ${summary.overall.band.readiness}</p>
    </div>
    <div class="card"><p>${markdown}</p></div>
  </body>
</html>`;
}

const functionalRaw = await readJson(functionalReportFile, {});
const a11yRaw = await readJson(a11yReportFile, {});
const lighthouseRaw = await readJson(lighthouseReportFile, {});
const uxRaw = await readJson(uxReportFile, {});

const functionality = parseFunctionalReport(functionalRaw);
const accessibility = scoreA11y(a11yRaw);
const performance = scoreLighthouse(lighthouseRaw);
const ux = scoreUx(uxRaw);

const sections = {
  functionality: {
    score: functionality.score,
    pass: functionality.pass,
    details: functionality,
  },
  accessibility: {
    score: accessibility.score,
    pass: accessibility.pass,
    details: accessibility,
  },
  performance: {
    score: performance.score,
    pass: performance.pass,
    details: performance,
  },
  usability: {
    score: ux.score,
    pass: ux.pass,
    details: ux,
  },
  polish: {
    score: ux.polishScore,
    pass: ux.polishPass,
    details: ux,
  },
};

const overall = computeOverallScore({
  functionality: sections.functionality,
  accessibility: sections.accessibility,
  performance: sections.performance,
  usability: sections.usability,
  polish: sections.polish,
});
overall.band = getReleaseBand(overall.score);

const summary = {
  generatedAt: new Date().toISOString(),
  runId,
  environment: {
    baseUrl: process.env.QA_BASE_URL || process.env.QA_SERVER_URL || "http://127.0.0.1:4173",
    resultsDir,
    nodeVersion: process.version,
  },
  pagesAndFlowsTested: {
    functional: Object.keys(functionalFlowWeights),
    lighthouse: (lighthouseRaw.pages || []).map((page) => page.label),
    accessibility: (a11yRaw.pages || []).map((page) => page.label),
    ux: (uxRaw.screens || []).map((screen) => screen.label),
  },
  sections,
  overall,
};

summary.topIssues = buildTopIssues(functionality, accessibility, performance, ux);

await writeJson(summaryReportFile, summary);
await writeText(markdownReportFile, renderMarkdown(summary));
await writeText(htmlReportFile, renderHtml(summary));

process.stdout.write(`\nCombined report written to ${summaryReportFile}\n`);
