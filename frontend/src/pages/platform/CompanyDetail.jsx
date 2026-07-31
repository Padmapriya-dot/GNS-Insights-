import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import PlatformProtectedRoute from "../../components/layout/PlatformProtectedRoute";
import {
  getCompany,
  getCompanySubscription,
  listCompanyUsers,
  resetCompanyPassword,
} from "../../api/platformApi";

function CompanyDetailContent() {
  const { tenantId } = useParams();
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, u, s] = await Promise.all([
        getCompany(tenantId),
        listCompanyUsers(tenantId),
        getCompanySubscription(tenantId),
      ]);
      setCompany(c);
      setUsers(Array.isArray(u) ? u : []);
      setSubscription(s);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return;
    const res = await resetCompanyPassword(tenantId, newPassword);
    setMessage(res.message);
    setNewPassword("");
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  if (!company) {
    return <div className="p-8 text-center text-red-600">Company not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <Link to="/gns-admin" className="mb-6 inline-flex items-center gap-1 text-sm text-teal-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to companies
      </Link>

      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{company.company_name}</h1>
          <p className="font-mono text-sm text-teal-600">{company.company_code}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Item label="Email" value={company.company_email} />
            <Item label="Phone" value={company.mobile_number} />
            <Item label="Status" value={company.status} />
            <Item label="Plan" value={company.subscription_plan} />
            <Item label="GST" value={company.gst_number || "—"} />
            <Item label="Trial Expires" value={company.trial_expires_at ? new Date(company.trial_expires_at).toLocaleDateString() : "—"} />
            <Item label="Address" value={`${company.address || ""}, ${company.city || ""}, ${company.state || ""}`} className="sm:col-span-2" />
          </dl>
        </div>

        {subscription && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Subscription & License</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Item label="License Status" value={subscription.license_status} />
              <Item label="Trial Status" value={subscription.trial_status ? "Active" : "Inactive"} />
              {subscription.license && (
                <>
                  <Item label="Max Users" value={subscription.license.max_users} />
                  <Item label="Expires" value={subscription.license.expires_at ? new Date(subscription.license.expires_at).toLocaleDateString() : "—"} />
                </>
              )}
            </dl>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Reset Company Admin Password</h2>
          {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
          <form onSubmit={handleResetPassword} className="mt-3 flex flex-wrap gap-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              minLength={8}
              required
            />
            <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
              Reset Password
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Company Users ({users.length})</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4">{u.full_name}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.role}</td>
                    <td className="py-2">{u.is_active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value, className = "" }) {
  return (
    <div className={className}>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export default function CompanyDetail() {
  return (
    <PlatformProtectedRoute>
      <CompanyDetailContent />
    </PlatformProtectedRoute>
  );
}
