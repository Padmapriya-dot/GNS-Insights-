import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Loader from "../../components/common/Loader";
import ManufacturingWorkflowBar from "../../components/manufacturing/ManufacturingWorkflowBar";
import { createInvoice } from "../../api/salesApi";
import useTenantId from "../../hooks/useTenantId";
import { useToast } from "../../context/ToastContext";
import {
  customerToConsigneeFields,
  fetchCustomersWithFallback,
  filterCustomers,
  resolveCustomerId,
} from "../../utils/customerOptions";
import {
  MANUFACTURING_EVENTS,
  notifyManufacturingSpine,
} from "../../utils/manufacturingEvents";

const inputStyle = { padding: "6px 10px", border: "1px solid #c4b5a0", borderRadius: 4, background: "#fff", width: "100%" };
const labelRed = { color: "#b91c1c", fontSize: "0.9rem", marginBottom: 4, display: "block" };

export default function TaxInvoiceForm() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [form, setForm] = useState({
    tenant_id: tenantId,
    customer_id: "",
    sales_order_id: searchParams.get("sales_order_id")
      ? Number(searchParams.get("sales_order_id"))
      : null,
    invoice_number: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    discount: 0,
    sgst_pct: 9,
    cgst_pct: 9,
    igst_pct: 0,
    round_off: 0,
    consignee_name: "",
    consignee_address1: "",
    consignee_address2: "",
    consignee_state: "",
    consignee_state_code: "",
    consignee_gstin: "",
    notes: "",
    packaging: "",
    p_and_f: 0,
  });
  const [items, setItems] = useState([{ item_description: "", sizes: "", grade: "", qty: 1, unit: "KGS", rate: 0, amount: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomersWithFallback()
      .then(setCustomers)
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = useMemo(
    () => filterCustomers(customers, customerSearch),
    [customers, customerSearch]
  );

  const handleCustomerChange = (customerId) => {
    const customer = customers.find((c) => String(c.id) === String(customerId));
    setForm((f) => ({
      ...f,
      customer_id: customerId,
      ...customerToConsigneeFields(customer),
    }));
  };

  const updateItem = (idx, field, val) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: val };
    if (field === "qty" || field === "rate") {
      const q = Number(next[idx].qty) || 0;
      const r = Number(next[idx].rate) || 0;
      next[idx].amount = Math.round(q * r * 100) / 100;
    }
    setItems(next);
  };

  const netAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const pAndF = Number(form.p_and_f) || 0;
  const discount = Number(form.discount) || 0;
  const subtotal = netAmount - discount + pAndF;
  const sgst = Math.round(subtotal * ((Number(form.sgst_pct) || 0) / 100) * 100) / 100;
  const cgst = Math.round(subtotal * ((Number(form.cgst_pct) || 0) / 100) * 100) / 100;
  const igst = Math.round(subtotal * ((Number(form.igst_pct) || 0) / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + sgst + cgst + igst + (Number(form.round_off) || 0)) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) {
      addToast("Please select a customer", "error");
      return;
    }
    setSaving(true);
    try {
      const customerId = await resolveCustomerId(form.customer_id, customers, tenantId);
      const res = await createInvoice({
        tenant_id: form.tenant_id,
        customer_id: customerId,
        sales_order_id: form.sales_order_id || null,
        invoice_number: form.invoice_number || String(Date.now()).slice(-6),
        issue_date: form.issue_date,
        due_date: form.due_date || null,
        subtotal: 0,
        discount: form.discount,
        sgst_pct: form.sgst_pct,
        cgst_pct: form.cgst_pct,
        igst_pct: form.igst_pct,
        grand_total: grandTotal,
        status: "issued",
        items: (() => {
        const list = items.filter((i) => i.item_description?.trim()).map((i) => ({
          item_description: (i.item_description + (i.sizes ? " | " + i.sizes : "") + (i.grade ? " | " + i.grade : "")).trim() || "Item",
          qty: Number(i.qty) || 0,
          unit: i.unit || "pcs",
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        }));
        const pf = Number(form.p_and_f) || 0;
        if (pf > 0) list.push({ item_description: "Packing & Freight", qty: 1, unit: "pcs", rate: pf, amount: pf });
        return list;
      })(),
      });
      notifyManufacturingSpine(MANUFACTURING_EVENTS.INVOICE_CREATED, {
        invoice_id: res.data?.id,
        sales_order_id: form.sales_order_id,
      });
      addToast("Invoice created — AR journal posted");
      navigate("/sales/invoices");
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.detail || "Failed to save invoice", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading..." />;

  return (
    <div style={{ background: "#f5e6d3", minHeight: "100%", padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 12 }}>
          <ManufacturingWorkflowBar currentStepId="invoice" compact />
        </div>
        <div style={{ background: "#1e3a5f", color: "#fff", padding: "8px 16px", marginBottom: 16, display: "flex", gap: 16, alignItems: "center" }}>
          <span>MASTERS</span>
          <span style={{ background: "#2d5a8a", padding: "4px 12px" }}>MAKE TAX INVOICE</span>
          <span>PRINT TAX INVOICE</span>
          <span>REPORTS TAX INVOICE</span>
          <span>TOOLS</span>
          <span>QUIT</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div><label style={labelRed}>Invoice No. :-</label><input type="text" value={form.invoice_number} onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))} style={{ ...inputStyle, width: 80 }} /></div>
            <h2 style={{ margin: 0, color: "#b91c1c" }}>Tax Invoice</h2>
            <div><label style={labelRed}>Date :-</label><input type="date" value={form.issue_date} onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))} style={{ ...inputStyle, width: 140 }} /></div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelRed}>Customer :-</label>
            <input
              type="search"
              placeholder="Search customer by name, GSTIN, state..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              style={{ ...inputStyle, maxWidth: 400, marginBottom: 8 }}
            />
            <select
              value={form.customer_id}
              onChange={(e) => handleCustomerChange(e.target.value)}
              required
              style={{ ...inputStyle, maxWidth: 400 }}
            >
              <option value="">Select customer</option>
              {filteredCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.gstin ? ` · ${c.gstin}` : ""}{c.state ? ` · ${c.state}` : ""}
                </option>
              ))}
            </select>
            {filteredCustomers.length === 0 && (
              <p style={{ fontSize: "0.85rem", color: "#b91c1c", marginTop: 6 }}>
                No customers match your search.{" "}
                <Link to="/sales/customers" style={{ color: "#0d9488" }}>Add a customer</Link>
              </p>
            )}
          </div>

          <div style={{ background: "#e8dcc8", padding: "8px 16px", marginBottom: 12, textAlign: "center", fontWeight: 700 }}>Item</div>

          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", marginBottom: 16 }}>
            <thead>
              <tr style={{ background: "#e5e7eb" }}>
                <th style={{ padding: 8, border: "1px solid #d1d5db", textAlign: "left" }}>Item</th>
                <th style={{ padding: 8, border: "1px solid #d1d5db", textAlign: "left" }}>Sizes</th>
                <th style={{ padding: 8, border: "1px solid #d1d5db", textAlign: "left" }}>Grade</th>
                <th style={{ padding: 8, border: "1px solid #d1d5db" }}>Qty</th>
                <th style={{ padding: 8, border: "1px solid #d1d5db" }}>Unit</th>
                <th style={{ padding: 8, border: "1px solid #d1d5db" }}>Rate</th>
                <th style={{ padding: 8, border: "1px solid #d1d5db" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? "#f0fdf4" : "#fff" }}>
                  <td style={{ padding: 6, border: "1px solid #e5e7eb" }}><input type="text" value={row.item_description} onChange={(e) => updateItem(idx, "item_description", e.target.value)} style={{ ...inputStyle, width: "100%", minWidth: 120 }} /></td>
                  <td style={{ padding: 6, border: "1px solid #e5e7eb" }}><input type="text" value={row.sizes} onChange={(e) => updateItem(idx, "sizes", e.target.value)} style={{ ...inputStyle, width: 80 }} /></td>
                  <td style={{ padding: 6, border: "1px solid #e5e7eb" }}><input type="text" value={row.grade} onChange={(e) => updateItem(idx, "grade", e.target.value)} style={{ ...inputStyle, width: 80 }} /></td>
                  <td style={{ padding: 6, border: "1px solid #e5e7eb" }}><input type="number" step="0.01" value={row.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} style={{ ...inputStyle, width: 70 }} /></td>
                  <td style={{ padding: 6, border: "1px solid #e5e7eb" }}><select value={row.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} style={{ ...inputStyle, width: 70 }}><option>KGS</option><option>PCS</option></select></td>
                  <td style={{ padding: 6, border: "1px solid #e5e7eb" }}><input type="number" step="0.01" value={row.rate} onChange={(e) => updateItem(idx, "rate", e.target.value)} style={{ ...inputStyle, width: 80 }} /></td>
                  <td style={{ padding: 6, border: "1px solid #e5e7eb" }}>{Number(row.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <button type="button" onClick={() => setItems([...items, { item_description: "", sizes: "", grade: "", qty: 1, unit: "KGS", rate: 0, amount: 0 }])} style={{ padding: "6px 12px", background: "#4b5563", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Add</button>
            <div>Net :- {netAmount.toFixed(2)}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ ...labelRed, textAlign: "center" }}>Consignee :</div>
              <label style={{ fontSize: "0.85rem" }}>Name :-</label><input type="text" value={form.consignee_name} onChange={(e) => setForm((f) => ({ ...f, consignee_name: e.target.value }))} style={inputStyle} />
              <label style={{ fontSize: "0.85rem", marginTop: 8, display: "block" }}>Address (1) :-</label><input type="text" value={form.consignee_address1} onChange={(e) => setForm((f) => ({ ...f, consignee_address1: e.target.value }))} style={inputStyle} />
              <label style={{ fontSize: "0.85rem", marginTop: 8, display: "block" }}>Address (2) :-</label><input type="text" value={form.consignee_address2} onChange={(e) => setForm((f) => ({ ...f, consignee_address2: e.target.value }))} style={inputStyle} />
              <label style={{ fontSize: "0.85rem", marginTop: 8, display: "block" }}>State / State Code / GSTIN</label>
              <div style={{ display: "flex", gap: 8 }}><input type="text" value={form.consignee_state} onChange={(e) => setForm((f) => ({ ...f, consignee_state: e.target.value }))} style={inputStyle} /><input type="text" value={form.consignee_state_code} onChange={(e) => setForm((f) => ({ ...f, consignee_state_code: e.target.value }))} style={inputStyle} /><input type="text" value={form.consignee_gstin} onChange={(e) => setForm((f) => ({ ...f, consignee_gstin: e.target.value }))} style={inputStyle} /></div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem" }}>Less Discount</label><input type="number" step="0.01" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} style={{ ...inputStyle, width: 80 }} />
              <label style={{ fontSize: "0.85rem", marginTop: 8 }}>P & F :-</label><input type="number" step="0.01" value={form.p_and_f} onChange={(e) => setForm((f) => ({ ...f, p_and_f: e.target.value }))} style={{ ...inputStyle, width: 80 }} />
              <label style={{ fontSize: "0.85rem", marginTop: 8 }}>SGST {form.sgst_pct}% :-</label><span>{sgst.toFixed(2)}</span>
              <label style={{ fontSize: "0.85rem", marginTop: 8 }}>CGST {form.cgst_pct}% :-</label><span>{cgst.toFixed(2)}</span>
              <label style={{ fontSize: "0.85rem", marginTop: 8 }}>IGST {form.igst_pct} :-</label><span>{igst.toFixed(2)}</span>
              <label style={{ fontSize: "0.85rem", marginTop: 8 }}>Round off :-</label><input type="number" step="0.01" value={form.round_off} onChange={(e) => setForm((f) => ({ ...f, round_off: e.target.value }))} style={{ ...inputStyle, width: 80 }} />
              <div style={{ marginTop: 16 }}><label style={labelRed}>Grand Total :-</label><div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#b91c1c" }}>{grandTotal.toFixed(2)}</div></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 16 }}>
            <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: "#4b5563", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Save</button>
            <button type="button" onClick={() => navigate("/sales/invoices")} style={{ padding: "10px 24px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Close</button>
          </div>
        </form>
      </div>
    </div>
  );
}