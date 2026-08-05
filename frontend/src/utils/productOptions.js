import { getProducts } from "../api/productionApi";
import { enrichApiProduct } from "../data/productsMasterData";

/** Load products from API and local storage (smrt_products). */
export async function fetchProductsWithFallback() {
  try {
    const res = await getProducts().catch(() => null);
    if (res !== null) {
      const apiProds = Array.isArray(res) ? res : (res?.data || []);
      return apiProds.map((p, i) => enrichApiProduct(p, i));
    }
    const stored = localStorage.getItem("smrt_products");
    const localProds = stored ? JSON.parse(stored) : [];
    return localProds.map((p, i) => enrichApiProduct(p, i));
  } catch {
    const stored = localStorage.getItem("smrt_products");
    const localProds = stored ? JSON.parse(stored) : [];
    return localProds.map((p, i) => enrichApiProduct(p, i));
  }
}
