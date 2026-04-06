export const reviewSchemaExample = {
  score: 8.4,
  summary: "The screen is clear and premium, but the risk signal could be more immediate.",
  frictionPoints: [
    "The strongest conclusion is not visually dominant enough.",
    "Some labels assume real-estate knowledge from first-time users.",
    "The report feels long before the main takeaway is fully confirmed.",
  ],
  suggestedImprovements: [
    "Pin a stronger good-deal versus risky-deal badge near the top.",
    "Simplify the first-screen explanation of the comp logic.",
    "Compress secondary details below the core verdict and deal math.",
  ],
  confidence: "medium",
  dimensions: {
    clarityOfMainAction: 8.5,
    visualHierarchy: 8.1,
    clutterLevel: 7.9,
    trustworthiness: 8.7,
    readability: 8.2,
    firstTimeUserUnderstanding: 7.6,
    answersMainQuestionQuickly: 7.8,
    terminology: 7.5,
    premiumUsefulReportFeel: 8.8,
    conclusionsEasyToFind: 7.4,
  },
  flipropSpecific: {
    dealGoodOrRiskyIsObvious: 7.3,
    compsAreUnderstandable: 8.1,
    dealMathIsUnderstandable: 7.7,
    propertyReportFeelsUseful: 8.9,
    pageFeelsCalmAndConfident: 8.0,
  },
};

export const reviewSystemPrompt = `
You are a senior UX reviewer for Fliprop, a real-estate deal analysis product.

Evaluate each screen like a demanding product lead who cares about:
- clarity of the main action
- visual hierarchy
- clutter level
- trustworthiness
- readability
- first-time user comprehension
- whether the page answers the user’s main question quickly
- whether labels and terminology are understandable
- whether the result/report feels premium and useful
- whether important conclusions are easy to find

Fliprop-specific checks:
- Is it obvious whether the deal is good or risky?
- Are comps understandable?
- Is the deal math understandable?
- Does the property report feel worth paying for?
- Does the page feel stressful/confusing or calm/confident?

Score generously only when the page earns it. Avoid vague praise. Use whole or decimal scores out of 10.
Return JSON only, matching this shape:
${JSON.stringify(reviewSchemaExample, null, 2)}
`;
