import { describe, expect, it } from "vitest";

import {
  PROPERTY_WORKSPACE_DEFAULT_TAB,
  buildPropertyWorkspacePath,
  resolvePropertyWorkspaceRoute,
} from "./propertyWorkspaceNavigation";

describe("propertyWorkspaceNavigation", () => {
  it("uses home as the default canonical tab", () => {
    expect(PROPERTY_WORKSPACE_DEFAULT_TAB).toBe("home");
    expect(buildPropertyWorkspacePath("abc-123")).toBe("/properties/abc-123/home");
  });

  it("maps legacy tab ids to the new canonical project tabs", () => {
    expect(buildPropertyWorkspacePath("abc-123", "overview")).toBe("/properties/abc-123/home");
    expect(buildPropertyWorkspacePath("abc-123", "work")).toBe("/properties/abc-123/execution");
    expect(buildPropertyWorkspacePath("abc-123", "financials")).toBe("/properties/abc-123/budget");
    expect(buildPropertyWorkspacePath("abc-123", "documents")).toBe("/properties/abc-123/files");
    expect(buildPropertyWorkspacePath("abc-123", "analysis")).toBe("/properties/abc-123/deal");
  });

  it("maps legacy category and section routes to the new canonical tabs", () => {
    expect(resolvePropertyWorkspaceRoute({ categoryId: "property", sectionId: "close-snapshot" }).tab.id).toBe("home");
    expect(resolvePropertyWorkspaceRoute({ categoryId: "finance", sectionId: "budget-vs-actual" }).tab.id).toBe("budget");
    expect(resolvePropertyWorkspaceRoute({ categoryId: "operations", sectionId: "vendors" }).tab.id).toBe("execution");
    expect(resolvePropertyWorkspaceRoute({ categoryId: "documents", sectionId: "overview" }).tab.id).toBe("files");
    expect(resolvePropertyWorkspaceRoute({ categoryId: "property", sectionId: "market-comps" }).tab.id).toBe("deal");
  });

  it("keeps settings routable but non-canonical for legacy aliases", () => {
    expect(resolvePropertyWorkspaceRoute({ tabId: "settings" }).tab.id).toBe("settings");
    expect(resolvePropertyWorkspaceRoute({ tabId: "overview" }).isCanonical).toBe(false);
    expect(resolvePropertyWorkspaceRoute({ tabId: "home" }).isCanonical).toBe(true);
  });
});
