/**
 * SAFE removal: only v2 badge spans + short header company pills.
 * Does not use greedy cross-button matching.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve("frontend/src/pages");

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".jsx")) out.push(p);
  }
  return out;
}

function strip(src) {
  // 1) v2 badges
  src = src.replace(/\s*<span\b[^>]*>\s*[vV]2\s*<\/span>/g, "");

  // 2) CompanyMenu usage + component (Sector/Sequence)
  src = src.replace(/\s*<CompanyMenu\s+company=\{company\}\s*\/>/g, "");
  src = src.replace(
    /\nfunction CompanyMenu\(\{ company \}\) \{[\s\S]*?\n\}\n(?=\n(?:function |export |const ))/g,
    "\n"
  );

  // 3) Compact company pill button (max ~500 chars between button tags)
  src = src.replace(
    /\s*<button\b(?=[^>]{0,200}(?:type="button"|className="[^"]*rounded-full[^"]*"))[^>]{0,300}>[\s\S]{0,500}?<Building2\b[\s\S]{0,200}?\{company\}[\s\S]{0,120}?<ChevronDown\b[\s\S]{0,80}?<\/button>/g,
    ""
  );

  // 4) Interactive company dropdown wrapper (BalanceSheet/ProfitLoss style)
  src = src.replace(
    /\s*<div className="relative" ref=\{companyRef\}>[\s\S]{0,900}?<\/div>(?=\s*\n\s*<\/div>)/g,
    (m) => (/Building2/.test(m) && /\{company\}/.test(m) ? "" : m)
  );

  // 5) Unwrap title-only flex gap-2 wrappers
  src = src.replace(
    /<div className="([^"]*\bflex items-center gap-2\b[^"]*)">\s*(<h1[\s\S]*?<\/h1>)\s*<\/div>/g,
    (match, cls, h1) => (/justify-between/.test(cls) ? match : h1)
  );

  // 6) Simplify justify-between headers that only have one child left (title)
  src = src.replace(
    /<div className="([^"]*\bjustify-between\b[^"]*)">\s*<div className="[^"]*">\s*(<h1[\s\S]*?<\/h1>)\s*<\/div>\s*<\/div>/g,
    (match, cls, h1) => {
      const newCls = cls
        .replace(/\bjustify-between\b/g, "")
        .replace(/\bflex-wrap\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return `<div className="${newCls}">\n          ${h1}\n        </div>`;
    }
  );

  // 7) Drop unused companyOpen state if UI gone
  if (!/ref=\{companyRef\}/.test(src) && !/setCompanyOpen\(/.test(src)) {
    src = src.replace(/\n\s*const \[companyOpen, setCompanyOpen\] = useState\(false\);\n/g, "\n");
    src = src.replace(/\n\s*const companyRef = useRef\(null\);\n/g, "\n");
    src = src.replace(
      /\n\s*useEffect\(\(\) => \{\n\s*if \(!companyOpen\) return[^\n]*\n[\s\S]*?\}, \[companyOpen\]\);\n/g,
      "\n"
    );
  }

  // 8) Drop company/useSettings if {company} unused
  const body = src
    .replace(/const \{ companyName[^}]*\} = useSettings\(\);/g, "")
    .replace(/const company = companyName\?\.trim\(\) \|\| "My Company";/g, "");
  if (!/\{company\}/.test(body)) {
    src = src.replace(
      /\n\s*const \{ companyName \} = useSettings\(\);\n\s*const company = companyName\?\.trim\(\) \|\| "My Company";\n/g,
      "\n"
    );
    src = src.replace(
      /\n\s*const \{ companyName, ([^}]+) \} = useSettings\(\);\n\s*const company = companyName\?\.trim\(\) \|\| "My Company";\n/g,
      "\n  const { $1 } = useSettings();\n"
    );
  }

  // 9) Clean lucide imports for unused Building2/ChevronDown
  src = src.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["'];?/g,
    (match, names) => {
      const after = src.replace(match, "");
      const list = names
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((n) => {
          const id = n.split(/\s+as\s+/).pop().trim();
          return (after.match(new RegExp(`\\b${id}\\b`, "g")) || []).length > 0;
        });
      if (!list.length) return "";
      return `import { ${list.join(", ")} } from "lucide-react";`;
    }
  );

  if ((src.match(/\buseSettings\b/g) || []).length <= 1) {
    src = src.replace(/\n?import useSettings from ["'][^"']+["'];?\n?/g, "\n");
  }
  if ((src.match(/\bcreatePortal\b/g) || []).length <= 1) {
    src = src.replace(/\n?import \{ createPortal \} from ["']react-dom["'];?\n?/g, "\n");
  }

  src = src.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']react["'];?/g,
    (match, names) => {
      const after = src.replace(match, "");
      const list = names
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((n) => (after.match(new RegExp(`\\b${n}\\b`, "g")) || []).length > 0);
      if (!list.length) return "";
      return `import { ${list.join(", ")} } from "react";`;
    }
  );

  return src.replace(/\n{3,}/g, "\n\n");
}

const files = walk(ROOT);
let n = 0;
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  if (!/>\s*[vV]2\s*</.test(before) && !/CompanyMenu/.test(before) && !(/Building2/.test(before) && /\{company\}/.test(before))) {
    continue;
  }
  const after = strip(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    n++;
    console.log("updated", path.relative(process.cwd(), file));
  }
}
console.log("done", n);
