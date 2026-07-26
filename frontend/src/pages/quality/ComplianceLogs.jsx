import ResourcePage from "../../components/common/ResourcePage";
import { StatusBadge } from "../../components/common/Table";
import { getComplianceLogs, createComplianceLog } from "../../api/qualityApi";

const DEMO_COMPLIANCE_LOGS = [
  { id: 1, log_type: "ISO 9001:2015 Audit", reference: "AUD-2026-01", logged_at: "2026-07-24 10:00", status: "completed", description: "Internal Quality Management System audit completed for Machining and Quality departments. Zero major non-conformances." },
  { id: 2, log_type: "IATF 16949 Certification Check", reference: "AUD-2026-04", logged_at: "2026-07-22 14:30", status: "completed", description: "Automotive quality management system surveillance audit by TÜV SÜD. Passed with minor observation." },
  { id: 3, log_type: "OHSAS 18001 Safety Audit", reference: "SAF-2026-09", logged_at: "2026-07-20 11:15", status: "pending", description: "Annual workplace safety and hazard identification audit for Press Shop and Maintenance." },
  { id: 4, log_type: "Environmental RoHS / REACH", reference: "ENV-2026-02", logged_at: "2026-07-18 16:00", status: "completed", description: "Hazardous substance compliance testing certificate received for all raw material lots." },
];

export default function ComplianceLogs() {
  return (
    <ResourcePage
      title="Compliance Logs"
      subtitle="Track audits, certifications, and regulatory checks."
      fetcher={getComplianceLogs}
      createFn={createComplianceLog}
      fallbackData={DEMO_COMPLIANCE_LOGS}
      createLabel="+ New Log"
      emptyTitle="No compliance logs"
      emptyDescription="Record compliance events and audits here."
      searchKeys={["log_type", "reference", "description"]}
      filters={[
        {
          key: "status",
          label: "Status",
          placeholder: "All statuses",
          options: [
            { value: "completed", label: "Completed" },
            { value: "pending", label: "Pending" },
            { value: "failed", label: "Failed" },
          ],
        },
      ]}
      columns={[
        { key: "log_type", label: "Type" },
        { key: "reference", label: "Reference" },
        { key: "logged_at", label: "Logged At" },
        {
          key: "status",
          label: "Status",
          render: (r) => <StatusBadge status={r.status} />,
        },
        { key: "description", label: "Description" },
      ]}
      fields={[
        { name: "log_type", label: "Log Type", required: true },
        { name: "reference", label: "Reference" },
        { name: "logged_at", label: "Logged At", type: "datetime", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          default: "completed",
          options: [
            { value: "completed", label: "Completed" },
            { value: "pending", label: "Pending" },
            { value: "failed", label: "Failed" },
          ],
        },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
    />
  );
}
