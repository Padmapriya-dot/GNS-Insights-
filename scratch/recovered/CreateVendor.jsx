import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, ChevronDown, Upload, X } from "lucide-react";

import { useToast } from "../../context/ToastContext";
import useSettings from "../../context/SettingsContext";

const PAGE_BG = "#F5F5F5";

export default function CreateVendor() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { companyName } = useSettings();
  const company = companyName?.trim() || "My Company";
  const [file, setFile] = useState(null);

  const fileName = useMemo(() => file?.name || "", [file]);

  const handleTemplate = () => {
    const csv = "Company Name,GSTIN,Address,City,State,Pincode,Mobile No.,Email\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sellers_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full" style={{ background: PAGE_BG }}>
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#1a1a1f]">
              Upload Bulk Seller
            </h1>
            <span className="rounded bg-[#d4d4d8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              v2
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[#d0d0d8] bg-white px-4 py-2 text-[14px] font-semibold text-[#1a1a1f]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F5C518]">
              <Building2 className="h-4 w-4" />
            </span>
            {company}
            <ChevronDown className="h-4 w-4 text-[#9a9aa5]" />
          </button>
        </div>

        <Link
          to="/procurement/vendors"
          className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-[#1a1a1f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Link>

        <div className="rounded-lg border border-[#d0d0d8] bg-white px-7 py-6 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-[14px] text-[#6b6b76]">Example :</p>
              <div className="rounded-md border border-[#ececf0] bg-[#fbfbfd] p-4">
                <div className="grid grid-cols-5 border border-[#d8d8e0] text-[10px] text-[#4a4a55]">
                  <div className="border-r border-[#d8d8e0] p-1 font-semibold">Company</div>
                  <div className="border-r border-[#d8d8e0] p-1 font-semibold">GSTIN</div>
                  <div className="border-r border-[#d8d8e0] p-1 font-semibold">Address</div>
                  <div className="border-r border-[#d8d8e0] p-1 font-semibold">City</div>
                  <div className="p-1 font-semibold">State</div>
                </div>
                <div className="mt-4 text-center text-[36px] font-semibold text-[#1a1a1f]">SAMPLE SHEET</div>
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-[24px] font-semibold text-[#1a1a1f]">
                Follow these Steps to upload Bulk items
              </h2>
              <div className="space-y-2 text-[14px] text-[#1a1a1f]">
                <p>
                  Step 1 : Download Excel File template for import{" "}
                  <button
                    type="button"
                    onClick={handleTemplate}
                    className="font-semibold text-[#1d4ed8] underline"
                  >
                    click here
                  </button>
                </p>
                <p>Step 2 : Fill the Seller data in Excel file according to columns.</p>
                <p>Step 3 : Upload Excel File</p>
              </div>

              <label className="mt-4 block cursor-pointer rounded-lg border border-dashed border-[#222] bg-white p-5 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Upload className="mx-auto h-12 w-12 text-[#1a1a1f]" />
                <p className="mt-2 text-[13px] text-[#4a4a55]">
                  Drop your file(s) here, or click on above icon select them.
                </p>
                {fileName ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded bg-[#f3f3f6] px-2 py-1 text-[12px]">
                    {fileName}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </label>

              <button
                type="button"
                onClick={() => {
                  if (!file) {
                    addToast("Select a file first", "error");
                    return;
                  }
                  addToast("Bulk import started. Processing file…", "success");
                  navigate("/procurement/vendors");
                }}
                className="mt-4 inline-flex items-center gap-2 rounded px-7 py-2.5 text-[15px] font-semibold text-[#1a1a1f]"
                style={{ background: "#a18b1d" }}
              >
                Proceed <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
