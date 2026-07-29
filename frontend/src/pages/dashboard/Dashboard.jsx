import { Navigate } from "react-router-dom";

import ReferenceDashboard from "../../components/dashboard/reference/ReferenceDashboard";
import useAuth from "../../hooks/useAuth";
import { isStoreManager } from "../../config/permissions";

export default function Dashboard() {
  const { user } = useAuth();
  if (isStoreManager(user)) {
    return <Navigate to="/inventory" replace />;
  }
  return <ReferenceDashboard />;
}
