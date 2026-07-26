import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createCustomer } from "../../api/salesApi";
import useTenantId from "../../hooks/useTenantId";



export default function CreateCustomer() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tenant_id: tenantId,
    name: "",
    contact_name: "",
    address_line1: "",
    address_line2: "",
    state: "",
    state_code: "",
    gstin: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createCustomer(form).catch(() => null);
    } catch {
      /* fall through to local save */
    }

    // Always persist locally so the list page shows it immediately
    const newCustomer = {
      id: `cus-${Date.now()}`,
      customer_code: `CUS${Date.now().toString().slice(-4)}`,
      company: form.name,
      name: form.name,
      contact_person: form.contact_name,
      phone: form.phone,
      email: form.email,
      gstin: form.gstin,
      state: form.state,
      billing_address: form.address_line1,
      status: "active",
      created_at: new Date().toISOString().slice(0, 10),
    };
    const stored = localStorage.getItem("smrt_customers");
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem("smrt_customers", JSON.stringify([newCustomer, ...existing]));

    setSaving(false);
    navigate("/sales/customers");
  };

  const inputStyle = { width: "100%", padding: "8px 12px", marginTop: 6, border: "1px solid #d1d5db", borderRadius: 6 };

  return (
    <div style={{ maxWidth: "640px" }}>
      <h2>New Customer</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, marginTop: 16 }}>
        {error && <div style={{ color: "#dc2626", padding: 8, background: "#fee2e2", borderRadius: 6 }}>{error}</div>}
        <label>
          Company / Name *
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            style={inputStyle}
          />
        </label>
        <label>
          Contact Name
          <input
            type="text"
            value={form.contact_name}
            onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
            style={inputStyle}
          />
        </label>
        <label>
          Address (1)
          <input
            type="text"
            value={form.address_line1}
            onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
            style={inputStyle}
          />
        </label>
        <label>
          Address (2)
          <input
            type="text"
            value={form.address_line2}
            onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
            style={inputStyle}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label>
            State
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              style={inputStyle}
            />
          </label>
          <label>
            State Code
            <input
              type="text"
              value={form.state_code}
              onChange={(e) => setForm((f) => ({ ...f, state_code: e.target.value }))}
              style={inputStyle}
            />
          </label>
        </div>
        <label>
          GSTIN
          <input
            type="text"
            value={form.gstin}
            onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
            style={inputStyle}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </label>
          <label>
            Phone
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              style={inputStyle}
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button type="submit" disabled={saving} style={{ padding: "10px 20px", background: "#14b8a6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
            Save
          </button>
          <button type="button" onClick={() => navigate("/sales/customers")} style={{ padding: "10px 20px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}