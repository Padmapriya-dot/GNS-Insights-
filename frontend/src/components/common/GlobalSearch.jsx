import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, SearchX } from "lucide-react";

import useAuth from "../../hooks/useAuth";
import { userCanAccess } from "../../config/permissions";
import { flattenNavForSearch } from "../../config/sidebarNav";

const EXTRA_ROUTES = [
  { path: "/alerts", labelKey: "nav.allAlerts", module: "alerts", sectionKey: null },
  { path: "/production/reports", labelKey: "nav.dailyProductionReports", module: "production", sectionKey: "erpNav.production" },
  { path: "/settings", labelKey: "erpNav.settings", module: "admin", sectionKey: null },
];

function routeLabel(route, t) {
  return t(route.labelKey);
}

export default function GlobalSearch({ onSelect, placeholderKey = "common.searchMenuReports" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const routes = useMemo(() => {
    const all = [...flattenNavForSearch(), ...EXTRA_ROUTES];
    const seen = new Set();
    return all.filter((r) => {
      if (seen.has(r.path) || !userCanAccess(user, r.module)) return false;
      seen.add(r.path);
      return true;
    });
  }, [user]);

  const matches = useMemo(() => {
    if (!query.trim()) return routes.slice(0, 8);
    const q = query.toLowerCase();
    return routes
      .filter(
        (r) =>
          routeLabel(r, t).toLowerCase().includes(q) ||
          t(r.labelKey).toLowerCase().includes(q) ||
          r.path.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, routes, t]);

  const showDropdown = open && (focus || query);
  const hasQuery = Boolean(query.trim());

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (!showDropdown || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, showDropdown]);

  const handleSelect = useCallback(
    (path) => {
      navigate(path);
      setQuery("");
      setOpen(false);
      setFocus(false);
      onSelect?.();
    },
    [navigate, onSelect]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
      if (!showDropdown || matches.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % matches.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + matches.length) % matches.length);
      }
      if (e.key === "Enter" && matches[highlight]) {
        e.preventDefault();
        handleSelect(matches[highlight].path);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showDropdown, matches, highlight, handleSelect]);

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        placeholder={t(placeholderKey)}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setFocus(true);
        }}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
        aria-label={t("common.search")}
        aria-expanded={showDropdown}
        aria-controls="global-search-results"
        aria-activedescendant={
          showDropdown && matches[highlight] ? `global-search-option-${highlight}` : undefined
        }
        role="combobox"
        autoComplete="off"
      />
      {showDropdown && (
        <div
          id="global-search-results"
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl sm:min-w-[22rem]"
        >
          {!hasQuery ? (
            <p className="border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Suggested pages
            </p>
          ) : null}

          {matches.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-8 text-center" role="status">
              <SearchX className="mb-2 h-8 w-8 text-slate-300" aria-hidden />
              <p className="text-sm font-medium text-slate-700">
                No results for “{query.trim()}”
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try another keyword like inventory, sales, or work orders.
              </p>
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-[#2563EB] hover:underline"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                Clear search
              </button>
            </div>
          ) : (
            matches.map((r, i) => {
              const label = routeLabel(r, t);
              const selected = i === highlight;
              return (
                <button
                  key={r.path}
                  id={`global-search-option-${i}`}
                  data-index={i}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  title={label}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(r.path)}
                  className={`flex w-full items-center px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    selected
                      ? "bg-blue-50 text-[#2563EB]"
                      : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
