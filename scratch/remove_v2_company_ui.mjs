/**
 * Remove visible "v2" badges and page-header company selectors from frontend pages.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve("frontend/src");

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(name)) out.push(p);
  }
  return out;
}

function removeV2Badges(src) {
  return src.replace(/\s*<span\b[^>]*>\s*[vV]2\s*<\/span>/g, "");
}

function removeCompanyMenuComponent(src) {
  return src.replace(
    /\nfunction CompanyMenu\(\{ company \}\) \{[\s\S]*?\n\}\n(?=\n(?:function |export |const |\/\/))/g,
    "\n"
  );
}

function removeCompanySelectorBlocks(src) {
  // Interactive dropdown wrapper
  src = src.replace(
    /\s*<div className="relative" ref=\{companyRef\}>[\s\S]*?<Building2\b[\s\S]*?\{company\}[\s\S]*?<ChevronDown\b[\s\S]*?<\/div>\s*(?=\n\s*<\/div>)/g,
    ""
  );

  // Plain company pill buttons
  src = src.replace(
    /\s*<button\b[^>]*>[\s\S]*?<Building2\b[\s\S]*?\{company\}[\s\S]*?<ChevronDown\b[\s\S]*?<\/button>/g,
    ""
  );

  src = src.replace(/\s*<CompanyMenu\s+company=\{company\}\s*\/>/g, "");
  return src;
}

function removeCompanyDropdownState(src) {
  if (!/companyOpen|companyRef/.test(src)) return src;

  const stillHasSelector =
    /ref=\{companyRef\}/.test(src) ||
    (/setCompanyOpen/.test(src) && /Building2/.test(src) && /ChevronDown/.test(src));

  if (stillHasSelector) return src;

  src = src.replace(/\n\s*const \[companyOpen, setCompanyOpen\] = useState\(false\);\n/g, "\n");
  src = src.replace(/\n\s*const companyRef = useRef\(null\);\n/g, "\n");
  src = src.replace(
    /\n\s*useEffect\(\(\) => \{\n\s*if \(!companyOpen\) return[^\n]*\n[\s\S]*?setCompanyOpen\(false\);[\s\S]*?\}, \[companyOpen\]\);\n/g,
    "\n"
  );
  return src;
}

function simplifyTitleWrappers(src) {
  return src.replace(
    /<div className="([^"]*flex items-center gap-2[^"]*)">\s*(<h1[\s\S]*?<\/h1>)\s*<\/div>/g,
    (match, cls, inner) => {
      if (/justify-between/.test(cls)) return match;
      return inner;
    }
  );
}

function simplifyJustifyBetweenHeader(src) {
  return src.replace(
    /<div className="([^"]*justify-between[^"]*)">\s*(<(?:div|h1)[\s\S]*?<\/(?:div|h1)>)\s*<\/div>/g,
    (match, cls, inner) => {
      const trimmed = inner.trim();
      const onlyH1InDiv = trimmed.match(
        /^<div className="[^"]*">\s*(<h1[\s\S]*?<\/h1>)\s*<\/div>$/
      );
      if (onlyH1InDiv) {
        const newCls = cls
          .replace(/\bjustify-between\b/g, "")
          .replace(/\bflex-wrap\b/g, "")
          .replace(/\s+/g, " ")
          .trim();
        return `<div className="${newCls}">\n          ${onlyH1InDiv[1]}\n        </div>`;
      }
      if (/^<h1\b/.test(trimmed)) {
        const newCls = cls
          .replace(/\bjustify-between\b/g, "")
          .replace(/\bflex-wrap\b/g, "")
          .replace(/\s+/g, " ")
          .trim();
        return `<div className="${newCls}">\n          ${trimmed}\n        </div>`;
      }
      return match;
    }
  );
}

function removeUnusedCompanyState(src) {
  const withoutDecls = src
    .replace(/const \{ companyName[^}]*\} = useSettings\(\);/g, "")
    .replace(/const company = companyName\?\.trim\(\) \|\| "My Company";/g, "");
  if (!/\{company\}/.test(withoutDecls) && !/`[^`]*\$\{company\}/.test(withoutDecls)) {
    src = src.replace(
      /\n\s*const \{ companyName \} = useSettings\(\);\n\s*const company = companyName\?\.trim\(\) \|\| "My Company";\n/g,
      "\n"
    );
    src = src.replace(
      /\n\s*const \{ companyName, ([^}]+) \} = useSettings\(\);\n\s*const company = companyName\?\.trim\(\) \|\| "My Company";\n/g,
      "\n  const { $1 } = useSettings();\n"
    );
  }
  return src;
}

function cleanupImports(src) {
  src = src.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["'];?/g,
    (match, names) => {
      let list = names.split(",").map((s) => s.trim()).filter(Boolean);
      const afterImport = src.replace(match, "");
      list = list.filter((n) => {
        const id = n.split(/\s+as\s+/).pop().trim();
        const count = (afterImport.match(new RegExp(`\\b${id}\\b`, "g")) || []).length;
        return count > 0;
      });
      if (list.length === 0) return "";
      return `import { ${list.join(", ")} } from "lucide-react";`;
    }
  );

  {
    const usages = src.match(/\buseSettings\b/g) || [];
    if (usages.length <= 1) {
      src = src.replace(/\n?import useSettings from ["'][^"']+["'];?\n?/g, "\n");
    }
  }

  {
    const usages = src.match(/\bcreatePortal\b/g) || [];
    if (usages.length <= 1) {
      src = src.replace(/\n?import \{ createPortal \} from ["']react-dom["'];?\n?/g, "\n");
    }
  }

  src = src.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']react["'];?/g,
    (match, names) => {
      let list = names.split(",").map((s) => s.trim()).filter(Boolean);
      const after = src.replace(match, "");
      list = list.filter((n) => {
        const id = n.trim();
        const count = (after.match(new RegExp(`\\b${id}\\b`, "g")) || []).length;
        return count > 0;
      });
      if (list.length === 0) return "";
      return `import { ${list.join(", ")} } from "react";`;
    }
  );

  src = src.replace(/\n{3,}/g, "\n\n");
  return src;
}

const files = walk(ROOT);
let changed = 0;
const touched = [];

for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  const interested =
    />\s*[vV]2\s*</.test(src) ||
    /CompanyMenu/.test(src) ||
    (/Building2/.test(src) && /\{company\}/.test(src) && /ChevronDown/.test(src));
  if (!interested) continue;

  const before = src;
  src = removeV2Badges(src);
  src = removeCompanySelectorBlocks(src);
  src = removeCompanyMenuComponent(src);
  src = removeCompanyDropdownState(src);
  src = simplifyTitleWrappers(src);
  src = simplifyJustifyBetweenHeader(src);
  src = removeUnusedCompanyState(src);
  src = cleanupImports(src);

  if (src !== before) {
    fs.writeFileSync(file, src);
    changed++;
    touched.push(path.relative(process.cwd(), file));
  }
}

console.log(`Updated ${changed} files:`);
touched.forEach((f) => console.log(" -", f));
