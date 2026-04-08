import React from "react";

import CompsSavedReportView from "./CompsSavedReportView";

const ProjectCompsTab = ({ snapshot = null }) => (
  <CompsSavedReportView
    report={snapshot?.compsAnalysis || null}
    emptyEyebrow="Saved comps"
    emptyTitle="No comps snapshot was saved"
    emptyMessage="This project did not have a saved lead comps analysis at the time it moved into project management."
    tableIntro="This is the comps snapshot that was carried over from the potential property before it moved into project management."
  />
);

export default ProjectCompsTab;
