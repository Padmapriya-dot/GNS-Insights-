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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">Settings</p>
        <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <form onSubmit={onSave} className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea
                rows={4}
                value={form[f.name] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                className="ui-input w-full"
              />
            ) : (
              <input
                type={f.type || "text"}
                value={form[f.name] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                className="ui-input w-full"
              />
            )}
          </label>
        ))}
        <button
          type="submit"
          disabled={saving}
          className="ui-btn-primary disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
