import { Navigate } from "react-router-dom";

/**
 * Deep-link create: open Customers list with the create modal.
 * Bulk import lives at `/sales/customers/bulk-import` — do not overload this path.
 */
export default function CreateCustomer() {
  return <Navigate to="/sales/customers?create=1" replace />;
}
