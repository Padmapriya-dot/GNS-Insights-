/**
 * Pub/sub + BroadcastChannel for real-time cross-role & cross-tab synchronization.
 */

const listeners = new Set();
const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("gns_manufacturing_spine") : null;

if (bc) {
  bc.onmessage = (e) => {
    if (e.data && e.data.type) {
      listeners.forEach((fn) => {
        try {
          fn(e.data);
        } catch {
          /* ignore listener errors */
        }
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("gns:manufacturing", { detail: e.data }));
      }
    }
  };
}

export const MANUFACTURING_EVENTS = {
  WORK_ORDER_UPDATED: "work_order_updated",
  PLANNING_UPDATED: "planning_updated",
  MATERIALS_ISSUED: "materials_issued",
  WORK_ORDER_COMPLETED: "work_order_completed",
  MRP_RUN: "mrp_run",
  MATERIAL_REQUEST_CONVERTED: "material_request_converted",
  PURCHASE_ORDER_CREATED: "purchase_order_created",
  GRN_RECEIVED: "grn_received",
  GRN_QC_PASSED: "grn_qc_passed",
  ORDER_PACKED: "order_packed",
  ORDER_SHIPPED: "order_shipped",
  INVOICE_CREATED: "invoice_created",
  PAYMENT_RECORDED: "payment_recorded",
  INVENTORY_CHANGED: "inventory_changed",
  DASHBOARD_REFRESH: "dashboard_refresh",
};

export function emitManufacturingEvent(type, payload = {}) {
  const event = { type, payload, at: Date.now() };
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      /* ignore listener errors */
    }
  });
  if (bc) {
    try {
      bc.postMessage(event);
    } catch {
      /* ignore broadcast error */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gns:manufacturing", { detail: event }));
  }
}

export function subscribeManufacturingEvents(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

/** After WO complete / material issue / priority change — refresh spine modules. */
export function notifyManufacturingSpine(type, payload = {}) {
  emitManufacturingEvent(type, payload);
  emitManufacturingEvent(MANUFACTURING_EVENTS.INVENTORY_CHANGED, payload);
  emitManufacturingEvent(MANUFACTURING_EVENTS.DASHBOARD_REFRESH, payload);
}
