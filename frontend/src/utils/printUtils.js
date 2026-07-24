/**
 * Shared Print Templates for Production Planning & Work Orders
 * Standardized header: "Production | Welcome, [User] | GNS Insights"
 */

export function printProductionOrder(order, user) {
  if (!order) return;
  const printedBy = user?.full_name || user?.name || "";
  const planned  = Number(order.planned_quantity || 0);
  const produced = Number(order.produced_quantity || 0);
  const balance  = Math.max(planned - produced, 0);
  const startDate = order.start_date ? new Date(order.start_date).toLocaleDateString() : "—";
  const dueDate   = order.due_date   ? new Date(order.due_date).toLocaleDateString()   : "—";
  const priority  = order.priority ? order.priority.charAt(0).toUpperCase() + order.priority.slice(1) : "—";
  const status    = order.status   ? order.status.charAt(0).toUpperCase()   + order.status.slice(1).replace(/_/g," ") : "—";
  const priorityColor = { high:"#f59e0b", urgent:"#ef4444", medium:"#f59e0b", low:"#22c55e" }[order.priority] || "#94a3b8";

  const html = `<!DOCTYPE html><html><head><title>Production Order ${order.order_number || ""}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;font-size:13px}
  .page{padding:28px 36px}
  .top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;font-size:11px;color:#555}
  .brand{color:#2563eb;font-weight:700;font-size:12px;letter-spacing:.5px}
  .title{font-size:26px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px}
  .subtitle{font-size:12px;color:#555;padding-bottom:14px;border-bottom:2px solid #111;margin-bottom:22px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:0}
  .section{padding:16px 0;border-bottom:1px solid #e2e8f0}
  .section:last-child{border-bottom:none}
  .section-label{font-size:9px;font-weight:700;letter-spacing:1.2px;color:#64748b;text-transform:uppercase;margin-bottom:6px}
  .section-value{font-size:15px;font-weight:700;color:#0f172a}
  .section-sub{font-size:12px;color:#475569;margin-top:2px}
  .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700;margin-right:6px}
  .badge-priority{background:#fef3c7;color:#92400e}
  .badge-status{background:#f1f5f9;color:#1e293b;border:1px solid #cbd5e1}
  .qty-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:4px}
  .qty-box .num{font-size:26px;font-weight:800;color:#0f172a}
  .qty-box .lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-top:2px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body><div class="page">

<div class="top-bar">
  <div>
    <span style="font-weight:700;color:#2563eb;font-size:11px;letter-spacing:.3px">Production</span>
    ${printedBy ? `<span style="margin-left:10px;color:#555">Welcome, ${printedBy}</span>` : ""}
  </div>
  <span class="brand">GNS Insights</span>
</div>

<div class="title">Production Order Details</div>
<div class="subtitle">Order # ${order.order_number || "—"} &nbsp;|&nbsp; Printed on ${new Date().toLocaleDateString()} ${printedBy ? `&nbsp;|&nbsp; By: ${printedBy}` : ""}</div>

<div class="grid">
  <div class="section">
    <div class="section-label">Product Information</div>
    <div class="section-value">${order.product_name || "—"}</div>
    <div class="section-sub">BOM Version: ${order.bom_version || "BOM v1.0"}</div>
  </div>
  <div class="section">
    <div class="section-label">Customer</div>
    <div class="section-value">${order.customer_name || "Internal"}</div>
  </div>
</div>

<div class="grid">
  <div class="section">
    <div class="section-label">Priority &amp; Status</div>
    <div style="margin-top:6px">
      <span class="badge badge-priority" style="background:#fef3c7;border-left:3px solid ${priorityColor}">${priority}</span>
      <span class="badge badge-status">${status}</span>
    </div>
  </div>
  <div class="section">
    <div class="section-label">Production Quantities</div>
    <div class="qty-grid">
      <div class="qty-box"><div class="num">${planned}</div><div class="lbl">Planned</div></div>
      <div class="qty-box"><div class="num">${produced}</div><div class="lbl">Produced</div></div>
      <div class="qty-box"><div class="num">${balance}</div><div class="lbl">Balance</div></div>
    </div>
  </div>
</div>

<div class="grid">
  <div class="section">
    <div class="section-label">Schedule</div>
    <div style="margin-top:4px;line-height:1.8">
      <div><strong>Start:</strong> ${startDate}</div>
      <div><strong>Due:</strong> ${dueDate}</div>
    </div>
  </div>
  <div class="section">
    <div class="section-label">Assignment</div>
    <div style="margin-top:4px;line-height:1.8">
      <div><strong>Machine:</strong> ${order.machine_name || "—"}</div>
      <div><strong>Shift:</strong> ${order.shift || "—"}</div>
    </div>
  </div>
</div>

</div></body></html>`;

  const win = window.open("", "_blank", "width=750,height=680");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

export function printWorkOrder(workOrder, user) {
  if (!workOrder) return;
  const printedBy = user?.full_name || user?.name || "";
  const planned  = Number(workOrder.planned_quantity || 0);
  const produced = Number(workOrder.produced_quantity ?? workOrder.actual_quantity ?? 0);
  const balance  = Math.max(planned - produced, 0);
  const startDate = workOrder.planned_start ? new Date(workOrder.planned_start).toLocaleDateString() : "—";
  const dueDate   = workOrder.planned_end   ? new Date(workOrder.planned_end).toLocaleDateString()   : "—";
  const priority  = workOrder.priority ? workOrder.priority.charAt(0).toUpperCase() + workOrder.priority.slice(1) : "—";
  const status    = workOrder.status   ? workOrder.status.charAt(0).toUpperCase()   + workOrder.status.slice(1).replace(/_/g," ") : "—";
  const priorityColor = { high:"#f59e0b", urgent:"#ef4444", medium:"#f59e0b", low:"#22c55e" }[workOrder.priority] || "#94a3b8";

  const html = `<!DOCTYPE html><html><head><title>Work Order ${workOrder.work_order_number || ""}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;font-size:13px}
  .page{padding:28px 36px}
  .top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;font-size:11px;color:#555}
  .brand{color:#2563eb;font-weight:700;font-size:12px;letter-spacing:.5px}
  .title{font-size:26px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px}
  .subtitle{font-size:12px;color:#555;padding-bottom:14px;border-bottom:2px solid #111;margin-bottom:22px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:0}
  .section{padding:16px 0;border-bottom:1px solid #e2e8f0}
  .section:last-child{border-bottom:none}
  .section-label{font-size:9px;font-weight:700;letter-spacing:1.2px;color:#64748b;text-transform:uppercase;margin-bottom:6px}
  .section-value{font-size:15px;font-weight:700;color:#0f172a}
  .section-sub{font-size:12px;color:#475569;margin-top:2px}
  .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700;margin-right:6px}
  .badge-priority{background:#fef3c7;color:#92400e}
  .badge-status{background:#f1f5f9;color:#1e293b;border:1px solid #cbd5e1}
  .qty-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:4px}
  .qty-box .num{font-size:26px;font-weight:800;color:#0f172a}
  .qty-box .lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-top:2px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body><div class="page">

<div class="top-bar">
  <div>
    <span style="font-weight:700;color:#2563eb;font-size:11px;letter-spacing:.3px">Production</span>
    ${printedBy ? `<span style="margin-left:10px;color:#555">Welcome, ${printedBy}</span>` : ""}
  </div>
  <span class="brand">GNS Insights</span>
</div>

<div class="title">Work Order Details</div>
<div class="subtitle">Order # ${workOrder.work_order_number || "—"} &nbsp;|&nbsp; Printed on ${new Date().toLocaleDateString()} ${printedBy ? `&nbsp;|&nbsp; By: ${printedBy}` : ""}</div>

<div class="grid">
  <div class="section">
    <div class="section-label">Product Information</div>
    <div class="section-value">${workOrder.product_name || "—"}</div>
    ${workOrder.production_order_number ? `<div class="section-sub">Production Order: ${workOrder.production_order_number}</div>` : ""}
    ${workOrder.department ? `<div class="section-sub">Department: ${workOrder.department}</div>` : ""}
  </div>
  <div class="section">
    <div class="section-label">Customer</div>
    <div class="section-value">${workOrder.customer_name || "—"}</div>
  </div>
</div>

<div class="grid">
  <div class="section">
    <div class="section-label">Priority &amp; Status</div>
    <div style="margin-top:6px">
      <span class="badge badge-priority" style="background:#fef3c7;border-left:3px solid ${priorityColor}">${priority}</span>
      <span class="badge badge-status">${status}</span>
      ${workOrder.materials_issued ? '<span class="badge" style="background:#dcfce7;color:#166534">Materials ✔</span>' : ""}
    </div>
  </div>
  <div class="section">
    <div class="section-label">Production Quantities</div>
    <div class="qty-grid">
      <div class="qty-box"><div class="num">${planned}</div><div class="lbl">Planned</div></div>
      <div class="qty-box"><div class="num">${produced}</div><div class="lbl">Produced</div></div>
      <div class="qty-box"><div class="num">${balance}</div><div class="lbl">Balance</div></div>
    </div>
  </div>
</div>

<div class="grid">
  <div class="section">
    <div class="section-label">Schedule</div>
    <div style="margin-top:4px;line-height:1.8">
      <div><strong>Start:</strong> ${startDate}</div>
      <div><strong>Due:</strong> ${dueDate}</div>
    </div>
  </div>
  <div class="section">
    <div class="section-label">Assignment</div>
    <div style="margin-top:4px;line-height:1.8">
      <div><strong>Machine:</strong> ${workOrder.machine_name || "—"}</div>
      <div><strong>Operator:</strong> ${workOrder.operator_name || "—"}</div>
      <div><strong>Shift:</strong> ${workOrder.shift || "—"}</div>
    </div>
  </div>
</div>

</div></body></html>`;

  const win = window.open("", "_blank", "width=750,height=680");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}
