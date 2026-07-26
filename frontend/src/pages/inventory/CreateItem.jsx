import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Package, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";

import { createInventoryItem, getSuppliers, getWarehouses } from "../../api/inventoryApi";
import { Input, Select, FormRow } from "../../components/common/FormField";
import useTenantId from "../../hooks/useTenantId";

const RAW_MATERIAL_CATEGORIES = [
  "Metals", "Plastics", "Chemicals", "Liquids", "Hardware", "Rubber", "Electrical", "Raw Materials", "Consumables"
];

const FINISHED_GOOD_CATEGORIES = [
  "Finished Goods", "Assemblies", "Machined Parts", "Hardware", "Electrical", "Spare Parts"
];

const DEFAULT_WAREHOUSES = [
  "Main Store", "Raw Material Store", "Production Store", "FG Store", "QC Store", "Warehouse 1"
];

export default function CreateItem() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") === "finished_good"
    ? "finished_good"
    : "raw_material";

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [form, setForm] = useState({
    tenant_id: tenantId,
    supplier_id: "",
    sku: "",
    barcode: "",
    name: "",
    description: "",
    category: initialType === "finished_good" ? "Finished Goods" : "Metals",
    warehouse_name: "Main Store",
    batch_number: "",
    quantity: "0",
    reserved: "0",
    unit: initialType === "finished_good" ? "pcs" : "kg",
    unit_cost: "",
    reorder_level: "0",
    status: "in_stock",
    customer_name: "",
    serial_number: "",
    expiry_date: "",
    item_type: initialType,
  });

  const isFinishedGood = form.item_type === "finished_good";
  const backPath = isFinishedGood
    ? "/inventory/finished-goods"
    : "/inventory/raw-materials";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    getSuppliers(tenantId)
      .then((r) => setSuppliers(r.data || []))
      .catch(console.error);

    getWarehouses()
      .then((r) => {
        const whList = r.data || [];
        if (whList.length > 0) {
          setWarehouses(whList.map((w) => w.name));
          setForm((f) => ({ ...f, warehouse_name: whList[0].name }));
        } else {
          setWarehouses(DEFAULT_WAREHOUSES);
        }
      })
      .catch(() => setWarehouses(DEFAULT_WAREHOUSES));
  }, []);

  const handleTypeChange = (newType) => {
    setForm((f) => ({
      ...f,
      item_type: newType,
      category: newType === "finished_good" ? "Finished Goods" : "Metals",
      unit: newType === "finished_good" ? "pcs" : "kg",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name?.trim()) errs.name = `${isFinishedGood ? "Product" : "Material"} Name is required`;
    if (!form.sku?.trim()) errs.sku = `${isFinishedGood ? "Product" : "Material"} SKU is required`;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        tenant_id: Number(tenantId) || 1,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        sku: form.sku.trim(),
        barcode: form.barcode?.trim() || null,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        category: form.category || (isFinishedGood ? "Finished Goods" : "General"),
        warehouse_name: form.warehouse_name || "Main Store",
        batch_number: form.batch_number?.trim() || null,
        quantity: Number(form.quantity) || 0,
        reserved: Number(form.reserved) || 0,
        unit: form.unit || (isFinishedGood ? "pcs" : "kg"),
        unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
        reorder_level: Number(form.reorder_level) || 0,
        status: "in_stock",
        customer_name: form.customer_name?.trim() || null,
        serial_number: form.serial_number?.trim() || null,
        expiry_date: form.expiry_date || null,
        production_date: form.production_date || null,
        warranty: form.warranty?.trim() || null,
        item_type: form.item_type,
      };
      await createInventoryItem(payload);
      navigate(backPath);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d.msg || d.message).join(", ")
          : `Failed to create ${isFinishedGood ? "finished good" : "raw material"}. Please try again.`
      );
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = (isFinishedGood ? FINISHED_GOOD_CATEGORIES : RAW_MATERIAL_CATEGORIES).map(
    (c) => ({ value: c, label: c })
  );

  const warehouseOptions = warehouses.map((w) => ({ value: w, label: w }));

  return (
    <div className="max-w-3xl pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {isFinishedGood ? "Finished Goods" : "Raw Materials"}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isFinishedGood ? "Create Finished Good" : "Create Raw Material"}
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                isFinishedGood
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isFinishedGood ? "Finished Good Form" : "Raw Material Form"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isFinishedGood
              ? "Add a new manufactured finished product to your inventory catalog."
              : "Add a new raw material item to your inventory catalog."}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {isFinishedGood ? (
            <>
              <FormRow>
                <Input
                  label="Product SKU *"
                  required
                  placeholder="e.g. FG-GEAR-1001"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  error={fieldErrors.sku}
                  hint="Unique finished product SKU"
                />
                <Input
                  label="Product Name *"
                  required
                  placeholder="e.g. Precision Hydraulic Gearbox"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  error={fieldErrors.name}
                />
              </FormRow>

              <FormRow>
                <Input
                  label="Batch Number"
                  placeholder="e.g. BATCH-FG-001"
                  value={form.batch_number}
                  onChange={(e) => setForm((f) => ({ ...f, batch_number: e.target.value }))}
                />
                <Select
                  label="Warehouse"
                  value={form.warehouse_name}
                  onChange={(e) => setForm((f) => ({ ...f, warehouse_name: e.target.value }))}
                  options={warehouseOptions}
                />
              </FormRow>

              <FormRow>
                <Input
                  label="Quantity (QTY)"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  hint="Initial physical stock count"
                />
                <Input
                  label="Reserved Qty"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.reserved}
                  onChange={(e) => setForm((f) => ({ ...f, reserved: e.target.value }))}
                  hint="Allocated or reserved stock"
                />
                <Input
                  label="Unit Cost / Price (₹)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.unit_cost}
                  onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))}
                />
              </FormRow>

              <FormRow>
                <Input
                  label="Customer Name"
                  placeholder="e.g. Tata Motors / Bosch"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                />
                <Input
                  label="Production Date"
                  type="date"
                  value={form.production_date}
                  onChange={(e) => setForm((f) => ({ ...f, production_date: e.target.value }))}
                />
              </FormRow>

              <FormRow>
                <Input
                  label="Expiry Date"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                />
                <Input
                  label="Warranty Period"
                  placeholder="e.g. 12 Months / 2 Years"
                  value={form.warranty}
                  onChange={(e) => setForm((f) => ({ ...f, warranty: e.target.value }))}
                />
              </FormRow>

              <FormRow>
                <Input
                  label="Serial Number"
                  placeholder="e.g. SN-998210"
                  value={form.serial_number}
                  onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))}
                />
              </FormRow>
            </>
          ) : (
            <>
              <FormRow>
                <Input
                  label="Material SKU *"
                  required
                  placeholder="e.g. RM-STEEL-001"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  error={fieldErrors.sku}
                  hint="Unique raw material code"
                />
                <Input
                  label="Material Code"
                  placeholder="Optional material code"
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                />
              </FormRow>

              <Input
                label="Material Name *"
                required
                placeholder="e.g. Stainless Steel Sheet 2mm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                error={fieldErrors.name}
              />

              <FormRow>
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  options={categoryOptions}
                />
                <Select
                  label="Warehouse"
                  value={form.warehouse_name}
                  onChange={(e) => setForm((f) => ({ ...f, warehouse_name: e.target.value }))}
                  options={warehouseOptions}
                />
                <Input
                  label="Batch Number"
                  placeholder="e.g. BATCH-RM-001"
                  value={form.batch_number}
                  onChange={(e) => setForm((f) => ({ ...f, batch_number: e.target.value }))}
                />
              </FormRow>

              <FormRow>
                <Input
                  label="Quantity (QTY)"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  hint="Initial physical stock count"
                />
                <Input
                  label="Reserved Qty"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.reserved}
                  onChange={(e) => setForm((f) => ({ ...f, reserved: e.target.value }))}
                  hint="Allocated or reserved stock"
                />
              </FormRow>

              <FormRow>
                <Input
                  label="Unit"
                  placeholder="kg, gms, Ltr, mtr, sheet, drum"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  hint="Default: kg"
                />
                <Input
                  label="Unit Cost (₹)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.unit_cost}
                  onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))}
                />
              </FormRow>

              <FormRow>
                <Input
                  label="Reorder Level"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.reorder_level}
                  onChange={(e) => setForm((f) => ({ ...f, reorder_level: e.target.value }))}
                  hint="Alert when stock falls below this level"
                />
                <Select
                  label="Preferred Supplier"
                  value={form.supplier_id}
                  onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
                  options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="None"
                />
              </FormRow>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all ${
                isFinishedGood
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700"
                  : "bg-gradient-to-r from-teal-500 to-teal-600 shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
              }`}
            >
              <Package className="h-4 w-4" />
              {saving
                ? "Saving..."
                : isFinishedGood
                ? "Create Finished Good"
                : "Create Raw Material"}
            </button>
            <Link
              to={backPath}
              className="rounded-xl border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
