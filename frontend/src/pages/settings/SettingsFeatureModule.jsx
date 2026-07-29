import { useLocation } from "react-router-dom";
import FeatureSettingsPage from "../settings/FeatureSettingsPage";

const CONFIG = {
  "/settings/change-template": {
    title: "Change Template",
    settingKey: "change_template",
    description: "Choose the default invoice / document template.",
    fields: [{ name: "template", label: "Template name", type: "text" }],
  },
  "/settings/change-format": {
    title: "Change Format",
    settingKey: "change_format",
    description: "Number and date formats for documents.",
    fields: [
      { name: "date_format", label: "Date format", type: "text" },
      { name: "number_format", label: "Number format", type: "text" },
    ],
  },
  "/settings/invoice-settings": {
    title: "Invoice Settings",
    settingKey: "invoice_settings",
    description: "Defaults for Invoice v2.",
    fields: [
      { name: "default_prefix", label: "Default prefix", type: "text" },
      { name: "terms", label: "Default terms", type: "textarea" },
    ],
  },
  "/settings/expense-settings": {
    title: "Expense Settings",
    settingKey: "expense_settings",
    fields: [{ name: "default_category", label: "Default category", type: "text" }],
  },
  "/settings/sector-settings": {
    title: "Sector Settings",
    settingKey: "sector_settings",
    fields: [{ name: "sector", label: "Business sector", type: "text" }],
  },
  "/settings/inventory-settings": {
    title: "Inventory Settings",
    settingKey: "inventory_settings",
    fields: [{ name: "valuation", label: "Valuation method", type: "text" }],
  },
  "/settings/merge-products": {
    title: "Merge Products",
    settingKey: "merge_products",
    description: "Map duplicate product names (JSON or notes).",
    fields: [{ name: "notes", label: "Merge notes", type: "textarea" }],
  },
  "/settings/merge-buyers": {
    title: "Merge Buyers",
    settingKey: "merge_buyers",
    fields: [{ name: "notes", label: "Merge notes", type: "textarea" }],
  },
  "/settings/merge-sellers": {
    title: "Merge Sellers",
    settingKey: "merge_sellers",
    fields: [{ name: "notes", label: "Merge notes", type: "textarea" }],
  },
  "/settings/prefix-management": {
    title: "Prefix Management",
    settingKey: "prefix_management",
    fields: [
      { name: "invoice_prefix", label: "Invoice prefix", type: "text" },
      { name: "po_prefix", label: "PO prefix", type: "text" },
    ],
  },
  "/settings/sequence-reset": {
    title: "Sequence Reset Setting",
    settingKey: "sequence_reset",
    description: "Reset document sequences for the new financial year.",
    fields: [{ name: "financial_year", label: "Financial year (e.g. 2026-27)", type: "text" }],
  },
};

export default function SettingsFeatureModule() {
  const { pathname } = useLocation();
  const cfg = CONFIG[pathname] || {
    title: "Settings",
    settingKey: "generic",
    fields: [{ name: "value", label: "Value", type: "text" }],
  };
  return <FeatureSettingsPage {...cfg} />;
}
