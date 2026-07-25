import { getProducts } from "../api/productionApi";
import { enrichApiProduct } from "../data/productsMasterData";

/** Load products from API and local storage (smrt_products). */
export async function fetchProductsWithFallback() {
  try {
    const res = await getProducts().catch(() => null);
    const apiProds = res?.data || [];
    const stored = localStorage.getItem("smrt_products");
    const localProds = stored ? JSON.parse(stored) : [];
    const deletedStored = localStorage.getItem("smrt_deleted_products");
    const deletedIds = (deletedStored ? JSON.parse(deletedStored) : []).map((d) => String(d).trim().toLowerCase());

    const prodMap = new Map();
    [...apiProds, ...localProds].forEach((p, i) => {
      const enriched = enrichApiProduct(p, i);
      const name = enriched.name;
      const code = enriched.product_code || enriched.sku || enriched.id;
      const cleanName = String(name || "").trim();
      const lower = cleanName.toLowerCase();
      const idStr = String(enriched.id || code || cleanName).trim().toLowerCase();

      if (deletedIds.includes(lower) || deletedIds.includes(idStr)) return;

      if (cleanName) {
        prodMap.set(lower, enriched);
      }
    });

    return Array.from(prodMap.values());
  } catch {
    const stored = localStorage.getItem("smrt_products");
    const localProds = stored ? JSON.parse(stored) : [];
    const deletedStored = localStorage.getItem("smrt_deleted_products");
    const deletedIds = (deletedStored ? JSON.parse(deletedStored) : []).map((d) => String(d).trim().toLowerCase());

    const prodMap = new Map();
    localProds.forEach((p, i) => {
      const enriched = enrichApiProduct(p, i);
      const name = enriched.name;
      const code = enriched.product_code || enriched.sku || enriched.id;
      const cleanName = String(name || "").trim();
      const lower = cleanName.toLowerCase();
      const idStr = String(enriched.id || code || cleanName).trim().toLowerCase();

      if (deletedIds.includes(lower) || deletedIds.includes(idStr)) return;

      if (cleanName) {
        prodMap.set(lower, enriched);
      }
    });

    return Array.from(prodMap.values());
  }
}
