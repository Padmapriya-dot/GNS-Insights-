import BulkImportPage from "../../components/masters/BulkImportPage";
import { createVendor } from "../../api/procurementApi";
import useTenantId from "../../hooks/useTenantId";

const COLUMNS = [
  "Company Name",
  "GSTIN",
  "Address",
  "City",
  "State",
  "Pincode",
  "Mobile No.",
  "Email",
];

const SAMPLE_ROWS = [
  [
    "R.K. Traders",
    "22AAAAA0000A1Z5",
    "Near Bus Stand",
    "Raipur",
    "Chhattisgarh",
    "492001",
    "9876543210",
    "rk@example.com",
  ],
  [
    "S.L. Logistic",
    "22BBBBB0000B1Z5",
    "Industrial Area",
    "Bhilai",
    "Chhattisgarh",
    "490026",
    "9123456780",
    "sl@example.com",
  ],
  [
    "Rahul Info Tech",
    "22CCCCC0000C1Z5",
    "VIP Road",
    "Raipur",
    "Chhattisgarh",
    "492007",
    "9988776655",
    "rahul@example.com",
  ],
];

const TEMPLATE_CSV =
  "Company Name,GSTIN,Address,City,State,Pincode,Mobile No.,Email\n" +
  "R.K. Traders,22AAAAA0000A1Z5,Near Bus Stand,Raipur,Chhattisgarh,492001,9876543210,rk@example.com\n";

function pick(row, ...keys) {
  for (const key of keys) {
    const found = Object.entries(row).find(
      ([k]) => k.replace(/\s+/g, " ").trim().toLowerCase() === key.toLowerCase()
    );
    if (found && found[1]) return found[1];
  }
  for (const [k, v] of Object.entries(row)) {
    const n = k.replace(/\s+/g, "").toLowerCase();
    if (keys.some((key) => key.replace(/\s+/g, "").toLowerCase() === n) && v) return v;
  }
  return "";
}

export default function BulkImportSeller() {
  const tenantId = useTenantId();

  return (
    <BulkImportPage
      title="Upload Bulk Seller"
      backTo="/procurement/vendors"
      columns={COLUMNS}
      sampleRows={SAMPLE_ROWS}
      templateFilename="sellers_import_template.csv"
      templateCsv={TEMPLATE_CSV}
      steps={[
        "Step 1",
        "Step 2 : Fill the Seller data in Excel file according to columns.",
        "Step 3 : Upload Excel File",
      ]}
      onImportRows={async (rows) => {
        let created = 0;
        let failed = 0;
        for (const row of rows) {
          const name = pick(row, "Company Name", "company", "name", "vendor name");
          if (!name) {
            failed += 1;
            continue;
          }
          try {
            await createVendor({
              tenant_id: tenantId,
              name,
              gstin: pick(row, "GSTIN") || null,
              address_line1: pick(row, "Address") || null,
              city: pick(row, "City") || null,
              state: pick(row, "State") || null,
              pincode: pick(row, "Pincode") || null,
              phone: pick(row, "Mobile No.", "Mobile", "phone") || null,
              email: pick(row, "Email") || null,
              vendor_type: "Raw Material Supplier",
              status: "active",
              country: "India",
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
