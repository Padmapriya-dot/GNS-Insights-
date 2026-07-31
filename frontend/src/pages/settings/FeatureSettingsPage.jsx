import { useEffect, useState } from "react";
import { getFeatureSetting, putFeatureSetting } from "../../api/bizDocumentsApi";
import { useToast } from "../../context/ToastContext";
import Loader from "../../components/common/Loader";
import { apiErrorMessage } from "../../utils/apiError";

export default function FeatureSettingsPage({
  title,
  settingKey,
  description,
  fields = [{ name: "value", label: "Value", type: "text" }],
}) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    getFeatureSetting(settingKey)
      .then((r) => {
        const v = r.data?.value;
        if (v && typeof v === "object") setForm(v);
        else if (fields.length === 1) setForm({ [fields[0].name]: v ?? "" });
        else setForm({});
      })
      .catch(() => setForm({}))
      .finally(() => setLoading(false));
  }, [settingKey, fields]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const value = fields.length === 1 ? form[fields[0].name] : form;
      await putFeatureSetting(settingKey, value);
      addToast("Settings saved");
    } catch (err) {
      addToast(apiErrorMessage(err, "Save failed"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading…" />;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <form onSubmit={onSave} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea
                rows={4}
                value={form[f.name] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            ) : (
              <input
                type={f.type || "text"}
                value={form[f.name] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            )}
          </label>
        ))}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#F5C518] px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
