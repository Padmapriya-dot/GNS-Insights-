import { useEffect, useState } from "react";

import Loader from "../../components/common/Loader";
import {
  getInventoryDashboard,
  getWarehouses,
  recordStockMovement,
} from "../../api/inventoryApi";
import useTenantId from "../../hooks/useTenantId";



export default function StockMovement() {
  const tenantId = useTenantId();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({
    warehouse_id: "",
    item_id: "",
    quantity: "",
    movement_type: "in",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [itemsRes, whRes] = await Promise.all([
          getInventoryDashboard(),
          getWarehouses(tenantId),
        ]);
        setItems(itemsRes.data || []);
        setWarehouses(whRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await recordStockMovement({
        tenant_id: tenantId,
        warehouse_id: Number(form.warehouse_id),
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        movement_type: form.movement_type,
      });
      setMessage("Movement recorded.");
      setForm({ warehouse_id: "", item_id: "", quantity: "", movement_type: "in" });
    } catch (err) {
      setMessage("Failed to record movement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading..." />;

  return (
    <div style={{ maxWidth: "480px" }}>
      <h2>Stock Movement</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "12px", marginTop: "16px" }}
      >
        <label>
          Type
          <select
            value={form.movement_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, movement_type: e.target.value }))
            }
            style={{ width: "100%", padding: "8px", marginTop: "6px" }}
          >
            <option value="in">In</option>
            <option value="out">Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </label>
        <label>
          Warehouse
          <select
            value={form.warehouse_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, warehouse_id: e.target.value }))
            }
            required
            style={{ width: "100%", padding: "8px", marginTop: "6px" }}
          >
            <option value="">Select</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </label>
        <label>
          Item
          <select
            value={form.item_id}
            onChange={(e) => setForm((f) => ({ ...f, item_id: e.target.value }))}
            required
            style={{ width: "100%", padding: "8px", marginTop: "6px" }}
          >
            <option value="">Select</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.sku} - {i.name} (Stock: {i.total_quantity ?? 0})
              </option>
            ))}
          </select>
        </label>
        <label>
          Quantity
          <input
            type="number"
            value={form.quantity}
            onChange={(e) =>
              setForm((f) => ({ ...f, quantity: e.target.value }))
            }
            required
            min="1"
            style={{ width: "100%", padding: "8px", marginTop: "6px" }}
          />
        </label>
        {message && (
          <div
            style={{
              color: message.includes("Failed") ? "#b91c1c" : "#166534",
            }}
          >
            {message}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 16px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {submitting ? "Saving..." : "Record"}
        </button>
      </form>
    </div>
  );
}