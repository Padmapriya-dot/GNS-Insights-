/**
 * Post-login dashboard path by role.
 * JWT is issued only after successful login; then redirect here.
 */
export function getDashboardPathForRole(role) {
  const name = String(role || "").trim();
  switch (name) {
    case "GNS Super Admin":
    case "Super Admin":
      return "/gns-admin";
    case "Admin":
      return "/";
    case "Sales Manager":
      return "/sales/dashboard";
    case "Production Manager":
      return "/production/dashboard";
    case "Store Manager":
      return "/inventory";
    case "HR Manager":
      return "/hr";
    case "Accountant":
      return "/accounts";
    case "Operator":
      return "/factory-monitor/live-production";
    default:
      return "/";
  }
}
