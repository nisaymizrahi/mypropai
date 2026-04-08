import { describe, expect, it } from "vitest";

import {
  PROPERTY_WORKSPACE_DEFAULT_TAB,
  buildPropertyWorkspacePath,
  buildPropertyWorkspaceSectionPath,
  buildPropertyWorkspaceViewPath,
  getDefaultPropertyWorkspaceViewId,
  normalizePropertyWorkspaceViewId,
  resolvePropertyWorkspaceRoute,
} from "./propertyWorkspaceNavigation";

describe("propertyWorkspaceNavigation", () => {
  it("uses home/today as the default canonical workspace route", () => {
    expect(PROPERTY_WORKSPACE_DEFAULT_TAB).toBe("home");
    expect(buildPropertyWorkspacePath("abc-123")).toBe("/properties/abc-123/home/today");
  });

  it("maps legacy tab ids to the new canonical project tabs and default child pages", () => {
    expect(buildPropertyWorkspacePath("abc-123", "overview")).toBe(
      "/properties/abc-123/home/today"
    );
    expect(buildPropertyWorkspacePath("abc-123", "work")).toBe(
      "/properties/abc-123/execution/tasks"
    );
    expect(buildPropertyWorkspacePath("abc-123", "financials")).toBe(
      "/properties/abc-123/budget/payments"
    );
    expect(buildPropertyWorkspacePath("abc-123", "documents")).toBe(
      "/properties/abc-123/files/all-files"
    );
    expect(buildPropertyWorkspacePath("abc-123", "analysis")).toBe(
      "/properties/abc-123/deal/summary"
    );
  });

  it("maps legacy category and section routes to the new canonical child pages", () => {
    expect(
      resolvePropertyWorkspaceRoute({ categoryId: "property", sectionId: "close-snapshot" })
    ).toMatchObject({
      tab: { id: "home" },
      view: { id: "today" },
    });
    expect(
      resolvePropertyWorkspaceRoute({ categoryId: "finance", sectionId: "budget-vs-actual" })
    ).toMatchObject({
      tab: { id: "budget" },
      view: { id: "cost-plan" },
    });
    expect(
      resolvePropertyWorkspaceRoute({ categoryId: "operations", sectionId: "vendors" })
    ).toMatchObject({
      tab: { id: "execution" },
      view: { id: "vendors" },
    });
    expect(
      resolvePropertyWorkspaceRoute({ categoryId: "documents", sectionId: "overview" })
    ).toMatchObject({
      tab: { id: "files" },
      view: { id: "all-files" },
    });
    expect(
      resolvePropertyWorkspaceRoute({ categoryId: "property", sectionId: "market-comps" })
    ).toMatchObject({
      tab: { id: "deal" },
      view: { id: "reports" },
    });
  });

  it("keeps settings routable while treating aliases and missing child pages as non-canonical", () => {
    expect(resolvePropertyWorkspaceRoute({ tabId: "settings" }).tab.id).toBe("settings");
    expect(resolvePropertyWorkspaceRoute({ tabId: "overview" }).isCanonical).toBe(false);
    expect(resolvePropertyWorkspaceRoute({ tabId: "home", viewId: "today" }).isCanonical).toBe(
      true
    );
    expect(resolvePropertyWorkspaceRoute({ tabId: "home" }).isCanonical).toBe(false);
  });

  it("builds canonical child-page links for sub-navigation and legacy helpers", () => {
    expect(buildPropertyWorkspaceViewPath("abc-123", "budget", "payments")).toBe(
      "/properties/abc-123/budget/payments"
    );
    expect(buildPropertyWorkspaceSectionPath("abc-123", "budget", "expenses")).toBe(
      "/properties/abc-123/budget/payments"
    );
    expect(buildPropertyWorkspaceSectionPath("abc-123", "deal", "reports")).toBe(
      "/properties/abc-123/deal/reports"
    );
  });

  it("normalizes invalid or legacy child page ids back to each tab default", () => {
    expect(getDefaultPropertyWorkspaceViewId("home")).toBe("today");
    expect(normalizePropertyWorkspaceViewId("budget", "missing")).toBe("payments");
    expect(normalizePropertyWorkspaceViewId("budget", "line-items")).toBe("cost-plan");
    expect(normalizePropertyWorkspaceViewId("execution", "vendors")).toBe("vendors");
  });
});
