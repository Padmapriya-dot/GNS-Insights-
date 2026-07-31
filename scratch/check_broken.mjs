import fs from "fs";
import path from "path";

function walk(d, a = []) {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, a);
    else if (n.endsWith(".jsx")) a.push(p);
  }
  return a;
}

const files = walk("frontend/src/pages");
const issues = [];

for (const f of files) {
  const t = fs.readFileSync(f, "utf8");
  const rel = f.replace(/\\/g, "/");

  if (/\) : null\}\s*\r?\n\s*<\/div>/.test(t)) issues.push([rel, "orphan-:null"]);
  if (t.includes("function Toggle") && !t.includes('role="switch"')) issues.push([rel, "broken-Toggle"]);
  if (/function DeleteConfirmModal[\s\S]{0,900}value=\{query\}/.test(t)) issues.push([rel, "eaten-DeleteModal"]);
  if (!t.includes("export default") && /pages\/(settings|accounts)\//.test(rel)) issues.push([rel, "no-export"]);
  if (/>\s*v2\s*</.test(t)) issues.push([rel, "has-v2-badge"]);
  if (/Building2[\s\S]{0,200}\{company\}[\s\S]{0,120}ChevronDown/.test(t)) issues.push([rel, "has-company-selector"]);
  if (/companyOpen/.test(t) && !/setCompanyOpen\(\(o\)/.test(t) && !/setCompanyOpen\(true\)/.test(t) && !/onClick=\{\(\) => setCompanyOpen/.test(t)) {
    // state exists but maybe UI removed
    if (!/ref=\{companyRef\}/.test(t)) issues.push([rel, "orphan-companyOpen-state"]);
  }
}

for (const [f, k] of issues) console.log(`${k}\t${f}`);
console.log(`\nTotal issues: ${issues.length}`);
