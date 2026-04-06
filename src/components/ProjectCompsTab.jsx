import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import CompsSavedReportView from "./CompsSavedReportView";
import SavedCompsReportsTab from "./SavedCompsReportsTab";
import { buildSavedReportFromLegacySnapshot, normalizeMasterReport } from "../utils/compsReport";
import { getPropertyReports } from "../utils/api";

const isSavedReportsBackendUnavailable = (error) =>
  String(error?.message || "").includes("Saved reports are not available on the server yet");

const sortReportsByGeneratedAt = (reports = []) =>
  [...reports].sort(
    (left, right) =>
      new Date(right?.generatedAt || right?.createdAt || 0).valueOf() -
      new Date(left?.generatedAt || left?.createdAt || 0).valueOf()
  );

const buildProjectReportLibrary = ({
  sourceLeadId,
  snapshot,
  projectReports = [],
  leadReports = [],
}) => {
  const combinedReports = sortReportsByGeneratedAt([...projectReports, ...leadReports])
    .map((report) => normalizeMasterReport(report, snapshot || {}))
    .filter(Boolean);

  const seenReports = new Set();
  const dedupedReports = combinedReports.filter((report) => {
    const reportKey =
      String(report?._id || "").trim() ||
      [
        report?.contextType || "saved",
        report?.generatedAt || "",
        report?.title || report?.address || "",
      ].join(":");

    if (!reportKey || seenReports.has(reportKey)) {
      return false;
    }

    seenReports.add(reportKey);
    return true;
  });

  const legacyReport = buildSavedReportFromLegacySnapshot(
    snapshot || {},
    snapshot?.compsAnalysis,
    `legacy-project-report-${sourceLeadId || "snapshot"}`
  );

  if (!legacyReport) {
    return dedupedReports;
  }

  const normalizedLegacyReport = normalizeMasterReport(legacyReport, snapshot || {});
  const hasMatchingSavedReport = dedupedReports.some(
    (report) =>
      Number(new Date(report?.generatedAt || 0).valueOf()) ===
        Number(new Date(normalizedLegacyReport?.generatedAt || 0).valueOf()) &&
      String(report?.address || report?.subject?.address || "").trim() ===
        String(
          normalizedLegacyReport?.address || normalizedLegacyReport?.subject?.address || ""
        ).trim()
  );

  return hasMatchingSavedReport
    ? dedupedReports
    : sortReportsByGeneratedAt([...dedupedReports, normalizedLegacyReport]);
};

const ProjectCompsTab = ({
  investmentId = "",
  sourceLeadId = "",
  propertyWorkspaceId = "",
  snapshot = null,
}) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(investmentId || sourceLeadId));
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      if (!investmentId && !sourceLeadId) {
        setReports(
          buildProjectReportLibrary({
            sourceLeadId,
            snapshot,
          })
        );
        setIsLoading(false);
        setError("");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const [projectReports, leadReports] = await Promise.all([
          investmentId
            ? getPropertyReports({
                kind: "comps",
                contextType: "project",
                investmentId,
              }).catch((loadError) => {
                if (!isSavedReportsBackendUnavailable(loadError)) {
                  throw loadError;
                }

                return [];
              })
            : Promise.resolve([]),
          sourceLeadId
            ? getPropertyReports({
                kind: "comps",
                contextType: "lead",
                leadId: sourceLeadId,
              }).catch((loadError) => {
                if (!isSavedReportsBackendUnavailable(loadError)) {
                  throw loadError;
                }

                return [];
              })
            : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        setReports(
          buildProjectReportLibrary({
            sourceLeadId,
            snapshot,
            projectReports,
            leadReports,
          })
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setReports(
          buildProjectReportLibrary({
            sourceLeadId,
            snapshot,
          })
        );
        setError(loadError.message || "Failed to load project report history.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [investmentId, snapshot, sourceLeadId]);

  const actions = useMemo(() => {
    if (!propertyWorkspaceId) {
      return null;
    }

    return (
      <Link
        to={`/properties/${encodeURIComponent(propertyWorkspaceId)}/analysis`}
        className="secondary-action"
      >
        Open analysis workspace
      </Link>
    );
  }, [propertyWorkspaceId]);

  if (error && !reports.length) {
    return (
      <CompsSavedReportView
        report={null}
        emptyEyebrow="Project reports"
        emptyTitle="Project report history is unavailable"
        emptyMessage={error}
        actions={actions}
      />
    );
  }

  return (
    <SavedCompsReportsTab
      reports={reports}
      isLoading={isLoading}
      title="Project comps and report history"
      description="Saved Master Deal Reports stay attached to this project, with earlier lead analysis and the carried snapshot kept alongside newer execution-stage reports."
      emptyTitle="No project report history yet"
      emptyMessage="This project is carrying only the original comps snapshot right now. Save a new report from the property workspace analysis tab and it will appear here."
      actions={actions}
    />
  );
};

export default ProjectCompsTab;
