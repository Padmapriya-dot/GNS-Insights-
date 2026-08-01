/**
 * Post-login dashboard path by role.
 * JWT is issued only after successful login; then redirect here.
 */
export function getDashboardPathForRole(role) {
  const name = String(role || "").trim().toLowerCase();

  if (name.includes("super admin") || name === "gns super admin") {
    return "/gns-admin";
  }
  return "/";
}
