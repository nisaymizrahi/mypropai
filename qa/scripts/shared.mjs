import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(scriptsDir, "../..");
export const qaToken = "qa-token";
export const defaultQaPort = Number(process.env.QA_PORT || 4173);
export const defaultBaseUrl = process.env.QA_BASE_URL || `http://127.0.0.1:${defaultQaPort}`;
export const qaUserEmail = process.env.QA_USER_EMAIL || "";
export const qaUserPassword = process.env.QA_USER_PASSWORD || "";
export const hasQaCredentials = Boolean(qaUserEmail && qaUserPassword);
export const isExternalQaTarget =
  process.env.QA_EXTERNAL_TARGET === "1" ||
  (Boolean(process.env.QA_BASE_URL) && process.env.QA_SERVER_STARTED !== "1");
export const canRunProtectedQaFlows = !isExternalQaTarget || hasQaCredentials;
export const qaTargetMode = !isExternalQaTarget
  ? "local_qa"
  : hasQaCredentials
    ? "external_authenticated"
    : "external_public";
export const runId =
  process.env.QA_RUN_ID ||
  new Date().toISOString().replace(/[:.]/g, "-");
export const resultsDir = process.env.QA_RESULTS_DIR
  ? path.resolve(process.env.QA_RESULTS_DIR)
  : path.join(projectRoot, "output", "qa", runId);
export const artifactsDir = path.join(resultsDir, "artifacts");
export const screenshotsDir = path.join(resultsDir, "screenshots");
export const functionalReportFile = path.join(resultsDir, "functional.json");
export const a11yReportFile = path.join(resultsDir, "accessibility.json");
export const lighthouseReportFile = path.join(resultsDir, "lighthouse.json");
export const uxReportFile = path.join(resultsDir, "ux-review.json");
export const summaryReportFile = path.join(resultsDir, "summary.json");
export const markdownReportFile = path.join(resultsDir, "report.md");
export const htmlReportFile = path.join(resultsDir, "report.html");

export const scoreWeights = {
  functionality: 40,
  usability: 20,
  accessibility: 15,
  performance: 15,
  polish: 10,
};

export const releaseBands = [
  { min: 92, label: "Strong", readiness: "Ready to show users" },
  { min: 78, label: "Needs Improvement", readiness: "Fix the top issues before a broad release" },
  { min: 61, label: "Risky to Ship", readiness: "High chance users hit avoidable friction" },
  { min: 0, label: "Not Ready", readiness: "Do not release without focused remediation" },
];

export const functionalFlowWeights = {
  home_landing: 10,
  property_intake: 20,
  master_report: 30,
  map_and_comps: 20,
  saved_report_export: 15,
  mobile_sanity: 5,
  protected_route_guard: 10,
};

export function getLighthousePages() {
  if (!isExternalQaTarget) {
    return [
      { id: "home", label: "Homepage", path: "/", authenticated: false },
      { id: "login", label: "Login", path: "/login", authenticated: false },
      { id: "master_report", label: "Master Deal Report", path: "/comps-report", authenticated: true },
    ];
  }

  const pages = [
    { id: "home", label: "Homepage", path: "/", authenticated: false },
    { id: "login", label: "Login", path: "/login", authenticated: false },
    { id: "product", label: "Product", path: "/product", authenticated: false },
    { id: "pricing", label: "Pricing", path: "/pricing", authenticated: false },
  ];

  if (canRunProtectedQaFlows) {
    pages.push({ id: "master_report", label: "Master Deal Report", path: "/comps-report", authenticated: true });
  }

  return pages;
}

export function getUxScreens() {
  if (!isExternalQaTarget) {
    return [
      { id: "homepage", label: "Homepage", path: "/", authenticated: false },
      { id: "master_report", label: "Master Deal Report", path: "/comps-report", authenticated: true },
      { id: "saved_report", label: "Saved Report", path: "/comps-report", authenticated: true, needsSavedTab: true },
    ];
  }

  const screens = [
    { id: "homepage", label: "Homepage", path: "/", authenticated: false },
    { id: "login", label: "Login", path: "/login", authenticated: false },
    { id: "pricing", label: "Pricing", path: "/pricing", authenticated: false },
  ];

  if (canRunProtectedQaFlows) {
    screens.push({ id: "master_report", label: "Master Deal Report", path: "/comps-report", authenticated: true });
  }

  return screens;
}

export function getA11yPages() {
  if (!isExternalQaTarget) {
    return [
      { id: "homepage", label: "Homepage" },
      { id: "master_report", label: "Master Deal Report" },
      { id: "saved_report", label: "Saved Report" },
    ];
  }

  const pages = [
    { id: "homepage", label: "Homepage" },
    { id: "login", label: "Login" },
    { id: "pricing", label: "Pricing" },
  ];

  if (canRunProtectedQaFlows) {
    pages.push({ id: "master_report", label: "Master Deal Report" });
  }

  return pages;
}

export async function ensureDir(targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
}

export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function writeText(filePath, text) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, text, "utf8");
}

export async function readJson(filePath, fallback = null) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    return fallback;
  }
}

export async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export function getReleaseBand(score) {
  return releaseBands.find((band) => score >= band.min) || releaseBands[releaseBands.length - 1];
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const placeholderHosts = new Set([
  "your-staging-or-prod-url",
  "example.com",
  "www.example.com",
  "your-domain.com",
]);

export async function validateQaBaseUrl(rawBaseUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(rawBaseUrl);
  } catch (error) {
    throw new Error(
      `QA_BASE_URL must be a full URL like https://staging.fliprop.com. Received: ${rawBaseUrl}`
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(
      `QA_BASE_URL must start with http:// or https://. Received: ${rawBaseUrl}`
    );
  }

  if (
    placeholderHosts.has(parsedUrl.hostname) ||
    /your-.*url/i.test(parsedUrl.hostname)
  ) {
    throw new Error(
      `QA_BASE_URL is still using the placeholder host "${parsedUrl.hostname}". Replace it with a real environment URL such as https://staging.fliprop.com or unset QA_BASE_URL to let the local QA server start automatically.`
    );
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });

    if (!response) {
      throw new Error("No response received");
    }
  } catch (error) {
    throw new Error(
      `Could not reach QA_BASE_URL at ${parsedUrl.toString()}. Make sure the host resolves and the site is online before running the QA suite. Original error: ${error.message}`
    );
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

export async function waitForUrl(url, { timeoutMs = 120000, intervalMs = 1000 } = {}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok || response.status === 304) {
        return;
      }
    } catch (error) {
      // Ignore connection failures while the server is still starting.
    }

    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export async function runCommand(command, args, { cwd = projectRoot, env = {}, label } = {}) {
  await ensureDir(resultsDir);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const context = label ? `${label} failed` : `${command} ${args.join(" ")} failed`;
      reject(new Error(`${context} with exit code ${code}`));
    });
  });
}

async function findFreshBuildArtifacts(buildStartedAtMs) {
  const buildDir = path.join(projectRoot, "dist");
  const assetDir = path.join(buildDir, "assets");

  try {
    const [indexStat, assetFiles] = await Promise.all([
      fs.stat(path.join(buildDir, "index.html")),
      fs.readdir(assetDir),
    ]);

    const mainBundle = assetFiles.find((fileName) => fileName.endsWith(".js"));
    if (!mainBundle) {
      return null;
    }

    const mainBundleStat = await fs.stat(path.join(assetDir, mainBundle));
    const newestMtimeMs = Math.max(indexStat.mtimeMs, mainBundleStat.mtimeMs);

    if (newestMtimeMs < buildStartedAtMs) {
      return null;
    }

    return {
      newestMtimeMs,
      mainBundle,
    };
  } catch (error) {
    return null;
  }
}

async function waitForBuildArtifacts(buildStartedAtMs, { timeoutMs = 60000, idleMs = 5000 } = {}) {
  const startedAt = Date.now();
  let lastSeenMtimeMs = 0;
  let lastChangedAt = 0;

  while (Date.now() - startedAt < timeoutMs) {
    const artifacts = await findFreshBuildArtifacts(buildStartedAtMs);

    if (artifacts) {
      if (artifacts.newestMtimeMs !== lastSeenMtimeMs) {
        lastSeenMtimeMs = artifacts.newestMtimeMs;
        lastChangedAt = Date.now();
      }

      if (lastChangedAt && Date.now() - lastChangedAt >= idleMs) {
        return artifacts;
      }
    }

    await sleep(1000);
  }

  return null;
}

async function buildFrontendForQa() {
  const buildDir = path.join(projectRoot, "dist");
  const buildStartedAtMs = Date.now();

  await fs.rm(buildDir, { recursive: true, force: true });

  const child = spawn("npm", ["run", "build"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      CI: "true",
      GENERATE_SOURCEMAP: "false",
      REACT_APP_ENABLE_QA_MOCKS: "true",
      REACT_APP_MAPBOX_TOKEN: "qa-mapbox-token",
    },
    stdio: "pipe",
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk.toString());
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk.toString());
  });

  const exitPromise = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code));
  });

  const outcome = await Promise.race([
    exitPromise.then((code) => ({ type: "exit", code })),
    waitForBuildArtifacts(buildStartedAtMs).then((artifacts) => ({ type: "artifacts", artifacts })),
  ]);

  if (outcome.type === "exit") {
    if (outcome.code !== 0) {
      throw new Error(`Frontend build failed with exit code ${outcome.code}`);
    }

    return {
      mode: "build",
      forcedExit: false,
    };
  }

  if (!outcome.artifacts) {
    child.kill("SIGTERM");
    await Promise.race([exitPromise, sleep(1500)]);
    throw new Error("Frontend build timed out before QA artifacts were ready");
  }

  process.stdout.write(
    `Detected complete QA build artifacts (${outcome.artifacts.mainBundle}); continuing after the output stabilized.\n`
  );

  child.kill("SIGTERM");
  await Promise.race([exitPromise, sleep(1500)]);

  return {
    mode: "build",
    forcedExit: true,
  };
}

async function resolveQaPort(preferredPort = defaultQaPort) {
  const tryPort = (port) =>
    new Promise((resolve, reject) => {
      const server = net.createServer();

      server.unref();
      server.on("error", reject);
      server.listen(port, "127.0.0.1", () => {
        const address = server.address();
        server.close(() => resolve(address?.port || port));
      });
    });

  try {
    return await tryPort(preferredPort);
  } catch (error) {
    return tryPort(0);
  }
}

async function stopChild(child) {
  child.kill("SIGTERM");
  await sleep(300);
  if (!child.killed) {
    child.kill("SIGKILL");
  }
}

function wireChildLogs(child) {
  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk.toString());
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk.toString());
  });
}

async function startStaticQaServer() {
  const buildDetails = await buildFrontendForQa();
  process.stdout.write(`QA server mode: ${buildDetails.mode}${buildDetails.forcedExit ? " (forced build teardown)" : ""}\n`);
  const qaPort = await resolveQaPort();
  const baseUrl = `http://127.0.0.1:${qaPort}`;

  const child = spawn(
    "npx",
    ["serve", "-s", "dist", "-l", String(qaPort)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
      },
      stdio: "pipe",
    }
  );

  wireChildLogs(child);

  await waitForUrl(baseUrl);

  return {
    baseUrl,
    mode: "build",
    stop: async () => {
      await stopChild(child);
    },
  };
}

async function startDevQaServer() {
  const qaPort = await resolveQaPort();
  const baseUrl = `http://127.0.0.1:${qaPort}`;

  const child = spawn("npm", ["start"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      CI: "true",
      HOST: "127.0.0.1",
      PORT: String(qaPort),
      REACT_APP_ENABLE_QA_MOCKS: "true",
      REACT_APP_MAPBOX_TOKEN: "qa-mapbox-token",
    },
    stdio: "pipe",
  });

  wireChildLogs(child);
  await waitForUrl(baseUrl, { timeoutMs: 180000 });

  return {
    baseUrl,
    mode: "dev",
    stop: async () => {
      await stopChild(child);
    },
  };
}

export async function startLocalQaServer() {
  if (process.env.QA_SERVER_STARTED === "1" || process.env.QA_BASE_URL) {
    const resolvedBaseUrl = process.env.QA_BASE_URL
      ? await validateQaBaseUrl(process.env.QA_BASE_URL)
      : defaultBaseUrl;

    return {
      baseUrl: resolvedBaseUrl,
      mode: "external",
      stop: async () => {},
    };
  }

  if (process.env.QA_SERVER_MODE === "build") {
    return startStaticQaServer();
  }

  if (process.env.QA_SERVER_MODE === "dev") {
    return startDevQaServer();
  }

  try {
    return await startStaticQaServer();
  } catch (error) {
    process.stderr.write(
      `Production QA server bootstrap failed (${error.message}). Falling back to a QA-mode dev server.\n`
    );
    return startDevQaServer();
  }
}
