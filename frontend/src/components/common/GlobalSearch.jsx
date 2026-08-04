import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, SearchX, X } from "lucide-react";

import useAuth from "../../hooks/useAuth";
import { userCanAccessPath } from "../../config/permissions";
import { flattenNavForSearch } from "../../config/sidebarNav";

const EXTRA_ROUTES = [
  { path: "/alerts", labelKey: "erpNav.allAlerts", module: "alerts", sectionKey: null },
  { path: "/production/reports", labelKey: "erpNav.dailyProductionReports", module: "production", sectionKey: "erpNav.production" },
  { path: "/settings", labelKey: "erpNav.settings", module: "admin", sectionKey: null },
];

function routeLabel(route, t) {
  if (route.labelKey) {
    const translated = t(route.labelKey);
    if (translated && translated !== route.labelKey) return translated;
  }
  return route.label || route.path;
}

function getSectionName(route, t) {
  if (!route.sectionKey) return null;
  const translated = t(route.sectionKey);
  if (translated && translated !== route.sectionKey) return translated;
  return route.sectionKey;
}

export default function GlobalSearch({ onSelect, placeholderKey = "common.searchMenuReports" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const routes = useMemo(() => {
    const all = [...flattenNavForSearch(), ...EXTRA_ROUTES];
    const seen = new Set();
    return all.filter((r) => {
      if (!r.path || seen.has(r.path) || !userCanAccessPath(user, r.path)) return false;
      seen.add(r.path);
      return true;
    });
  }, [user]);

  const matches = useMemo(() => {
    if (!query.trim()) return routes.slice(0, 8);
    const q = query.toLowerCase().trim();
    return routes
      .filter((r) => {
        const label = routeLabel(r, t).toLowerCase();
        const section = (getSectionName(r, t) || "").toLowerCase();
        const path = r.path.toLowerCase();
        return label.includes(q) || section.includes(q) || path.includes(q);
      })
      .slice(0, 12);
  }, [query, routes, t]);

  const showDropdown = open && (focus || query.trim().length > 0);
  const hasQuery = Boolean(query.trim());

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setFocus(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    const handleGlobalShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        setFocus(true);
      }
    };
    document.addEventListener("keydown", handleGlobalShortcut);
    return () => document.removeEventListener("keydown", handleGlobalShortcut);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!showDropdown || !listRef.current) return;
    if (highlight === 0) {
      listRef.current.scrollTop = 0;
    } else {
      const el = listRef.current.querySelector(`[data-index="${highlight}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlight, showDropdown]);

  const handleSelect = useCallback(
    (path) => {
      navigate(path);
      setQuery("");
      setOpen(false);
      setFocus(false);
      onSelect?.();
      inputRef.current?.blur();
    },
    [navigate, onSelect]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!showDropdown) return;
      if (e.key === "Escape") {
        setOpen(false);
        setFocus(false);
        inputRef.current?.blur();
      }
      if (matches.length === 0) return;
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

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" aria-hidden />
        <input
          ref={inputRef}
          type="text"
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
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          aria-label={t("common.search")}
          aria-expanded={showDropdown}
          aria-controls="global-search-results"
          aria-activedescendant={
            showDropdown && matches[highlight] ? `global-search-option-${highlight}` : undefined
          }
          role="combobox"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <span className="pointer-events-none absolute right-3 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
            Ctrl K
          </span>
        )}
      </div>

      {showDropdown && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl sm:min-w-[22rem]"
        >
          {!hasQuery && (
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Suggested Pages
            </div>
          )}

          <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
            {matches.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-8 text-center" role="status">
                <SearchX className="mb-2 h-8 w-8 text-slate-300" aria-hidden />
                <p className="text-sm font-medium text-slate-700">
                  No results for “{query.trim()}”
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try searching for inventory, sales, production, or work orders.
                </p>
                <button
                  type="button"
                  className="mt-3 text-xs font-semibold text-[#2563EB] hover:underline"
                  onClick={clearSearch}
                >
                  Clear search
                </button>
              </div>
            ) : (
              matches.map((r, i) => {
                const label = routeLabel(r, t);
                const sectionName = getSectionName(r, t);
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
                    onClick={() => handleSelect(r.path)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                      selected
                        ? "bg-blue-50/80 text-[#2563EB]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    {sectionName && (
                      <span className="ml-2 shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        {sectionName}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
