import { useContext, useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { AuthContext } from "../../context/AuthContext.jsx";

export default function RowActionMenu({ rowId, openMenu, setOpenMenu, items = [] }) {
  const auth = useContext(AuthContext);
  const role = (auth?.user?.role ?? auth?.user?.role_name ?? "").toLowerCase();
  const isOperator = role === "operator";

  // Operators cannot take any row-level actions
  if (isOperator) return null;
  const [localOpen, setLocalOpen] = useState(false);
  const menuRef = useRef(null);

  const isControlled = openMenu !== undefined && setOpenMenu !== undefined;
  const isOpen = isControlled ? openMenu === rowId : localOpen;

  const setIsOpen = (val) => {
    if (isControlled) {
      setOpenMenu(val ? rowId : null);
    } else {
      setLocalOpen(val);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        aria-label="Open actions"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[60] mt-1 w-40 origin-top-right rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-slate-700 dark:bg-slate-800">
          {items.map((item, index) => {
            if (!item) return null;
            const label = String(item.label || "");
            const labelLower = label.toLowerCase();

            let colorClass = "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50";
            if (item.danger || labelLower.includes("delete") || labelLower.includes("remove") || labelLower.includes("reject") || labelLower.includes("cancel")) {
              colorClass = "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20";
            }

            return (
              <button
                key={`${label}-${index}`}
                type="button"
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsOpen(false);
                  item.onClick?.();
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors ${colorClass}`}
              >
                {item.icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
