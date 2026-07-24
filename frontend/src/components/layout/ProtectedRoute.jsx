import { Navigate, useLocation } from "react-router-dom";

import AccessDenied from "../admin/AccessDenied";
import { getModuleForPath, userCanAccess } from "../../config/permissions";
import useAuth from "../../hooks/useAuth";

/**
 * Requires JWT auth + module permission for the current path.
 * Unauthorized users see a 403 Access Denied page (no silent redirect).
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, sessionExpired } = useAuth();
  const location = useLocation();

  // Session expiry is handled by SessionExpiredModal — avoid racing a hard redirect.
  if (!isAuthenticated) {
    if (sessionExpired) return null;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
