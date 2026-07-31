import BulkImportPage from "../../components/masters/BulkImportPage";
import { createProduct } from "../../api/productsApi";
import useTenantId from "../../hooks/useTenantId";

const COLUMNS = [
  "ProductName",
  "Description",
  "HSN",
  "Unit",
  "Rate",
  "GST Tax",
  "CESS",
  "Opening balance",
];

const SAMPLE_ROWS = [
  ["Laptop", "15.6 inch, 8GB RAM, 512GB SSD", "84713010", "Nos", "55000", "18", "0", "25"],
  ["Smartphone", "6.5 inch, 8GB RAM, 128GB", "85171211", "Nos", "22000", "18", "0", "40"],
  ["LED TV", "43 inch Smart TV", "85287215", "Nos", "32000", "28", "0", "15"],
];

const TEMPLATE_CSV =
  "ProductName,Description,HSN,Unit,Rate,GST Tax,CESS,Opening balance\n" +
  "Laptop,\"15.6 inch, 8GB RAM, 512GB SSD\",84713010,Nos,55000,18,0,25\n";

function pick(row, ...keys) {
  for (const key of keys) {
    const found = Object.entries(row).find(
      ([k]) => k.replace(/\s+/g, " ").trim().toLowerCase() === key.toLowerCase()
    );
    if (found && found[1] !== undefined && found[1] !== "") return found[1];
  }
  for (const [k, v] of Object.entries(row)) {
    const n = k.replace(/\s+/g, "").toLowerCase();
    if (keys.some((key) => key.replace(/\s+/g, "").toLowerCase() === n) && v !== "") return v;
  }
  return "";
}

export default function BulkImportProduct() {
  const tenantId = useTenantId();

  return (
    <BulkImportPage
      title="Upload Bulk Product"
      backTo="/masters/products"
      banner="INSERT MULTIPLE PRODUCT"
      columns={COLUMNS}
      sampleRows={SAMPLE_ROWS}
      templateFilename="products_import_template.csv"
      templateCsv={TEMPLATE_CSV}
      showDownloadButton
      downloadLabel="Download Format"
      warning="Product name limit must be upto 255 characters *"
      onImportRows={async (rows) => {
        let created = 0;
        let failed = 0;
        for (const row of rows) {
          const name = pick(row, "ProductName", "product name", "name");
          if (!name) {
            failed += 1;
            continue;
          }
          if (name.length > 255) {
            failed += 1;
            continue;
          }
          try {
            await createProduct({
              tenant_id: tenantId,
              name: name.slice(0, 255),
              description: pick(row, "Description") || null,
              hsn_code: pick(row, "HSN", "hsn_code") || null,
              unit: pick(row, "Unit") || "Nos",
              selling_price: Number(pick(row, "Rate", "selling_price") || 0),
              gst_percent: Number(pick(row, "GST Tax", "gst", "gst_percent") || 0),
              cess_percent: Number(pick(row, "CESS", "cess_percent") || 0),
              current_stock: Number(pick(row, "Opening balance", "opening balance", "stock") || 0),
              status: "active",
            });
            created += 1;
          } catch {
            failed += 1;
          }
        }
        return { created, failed };
      }}
    />
  );
}
