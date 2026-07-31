import { useCallback } from "react";

import ResourcePage from "../../components/common/ResourcePage";
import { useToast } from "../../context/ToastContext";
import useTenantId from "../../hooks/useTenantId";
import { getTasks, createTask, updateTask } from "../../api/tasksApi";

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "closed", label: "Closed" },
  { value: "on_hold", label: "On Hold" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const MODULES = [
  { value: "production", label: "Production" },
  { value: "quality", label: "Quality" },
  { value: "maintenance", label: "Maintenance" },
  { value: "procurement", label: "Procurement" },
  { value: "inventory", label: "Inventory" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "HR" },
  { value: "accounts", label: "Accounts" },
  { value: "general", label: "General" },
];

export default function TaskManagement() {
  const { addToast } = useToast();
  const tenantId = useTenantId();

  const rowActions = useCallback(
    (row, reload) => {
      if (
        row.status === "completed" ||
        row.status === "cancelled" ||
        row.status === "closed"
      ) {
        return <span className="text-xs text-slate-400">Closed</span>;
      }
      const next =
        row.status === "open"
          ? { status: "in_progress", label: "Start" }
          : { status: "completed", label: "Complete" };
      return (
        <button
          type="button"
          onClick={async () => {
            try {
              await updateTask(row.id, { status: next.status });
              addToast("Task updated");
              await reload();
            } catch (err) {
              addToast(err.response?.data?.detail || "Update failed", "error");
            }
          }}
          className="rounded-lg border border-teal-200 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50"
        >
          {next.label}
        </button>
      );
    },
    [addToast]
  );

  return (
    <ResourcePage
      title="Task Management"
      subtitle="Assign and track production and operations tasks."
      fetcher={() => getTasks()}
      createFn={(payload) => createTask({ ...payload, tenant_id: tenantId })}
      createLabel="+ New Task"
      emptyTitle="No tasks yet"
      emptyDescription="Create tasks to assign work across your team."
      searchKeys={["title", "status", "priority", "assigned_to_name", "module"]}
      filters={[
        { key: "status", label: "Status", placeholder: "All statuses", options: STATUSES },
        { key: "priority", label: "Priority", placeholder: "All priorities", options: PRIORITIES },
        { key: "module", label: "Module", placeholder: "All modules", options: MODULES },
      ]}
      columns={[
        { key: "title", label: "Title" },
        {
          key: "assigned_to_name",
          label: "Assigned To",
          render: (r) => r.assigned_to_name || "—",
        },
        {
          key: "module",
          label: "Module",
          render: (r) =>
            r.module
              ? r.module.charAt(0).toUpperCase() + r.module.slice(1)
              : "—",
        },
        { key: "priority", label: "Priority", statusBadge: true },
        { key: "status", label: "Status", statusBadge: true },
        {
          key: "start_date",
          label: "Start Date",
          render: (r) => (r.start_date ? String(r.start_date).slice(0, 10) : "—"),
        },
        {
          key: "due_date",
          label: "Due Date",
          render: (r) => (r.due_date ? String(r.due_date).slice(0, 10) : "—"),
        },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "description", label: "Description", type: "textarea", full: true },
        { name: "assigned_to_name", label: "Assigned To" },
        {
          name: "module",
          label: "Module / Department",
          type: "select",
          options: MODULES,
          defaultValue: "general",
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: PRIORITIES,
          defaultValue: "medium",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: STATUSES,
          defaultValue: "open",
        },
        { name: "start_date", label: "Start Date", type: "date" },
        { name: "due_date", label: "Due Date", type: "date" },
      ]}
      rowActions={rowActions}
    />
  );
}
