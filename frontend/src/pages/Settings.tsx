import { useEffect, useState, type FormEvent } from "react";
import { api, type Plan, type PlanInput, type Settings as SettingsData } from "../api";
import { ConfirmDialog, EmptyState, ErrorBox, Field, PageHeader, Spinner } from "../components/ui";
import { formatINR, planDuration, todayIST } from "../format";
import { translate, useI18n, type Lang } from "../i18n";
import { useLoad } from "../useLoad";

const PLACEHOLDERS = ["{name}", "{plan}", "{end_date}", "{amount}", "{mess_name}"];

export default function Settings() {
  const { t } = useI18n();
  return (
    <div className="pb-6">
      <PageHeader title={t("set.title")} />
      <div className="space-y-8 p-4">
        <LanguageSection />
        <PlansSection />
        <MessSection />
        <BackupSection />
      </div>
    </div>
  );
}

// ---------------- Language ----------------

const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "te", label: "తెలుగు" },
];

function LanguageSection() {
  const { t, lang, setLang } = useI18n();
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">🌐 {t("set.language")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {LANGS.map((l) => (
          <button
            key={l.value}
            onClick={() => setLang(l.value)}
            className={`btn border-2 text-lg ${
              lang === l.value ? "border-brand-700 bg-brand-50 text-brand-800" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {lang === l.value && "✓ "}
            {l.label}
          </button>
        ))}
      </div>
    </section>
  );
}

// ---------------- Plans ----------------

const blankPlan: PlanInput = { name: "", duration_value: 1, duration_unit: "months", price: 0, is_active: true };

function PlansSection() {
  const { t } = useI18n();
  const { data: plans, error, loading, reload } = useLoad(() => api.plans());
  const [editing, setEditing] = useState<{ id: number | null; form: PlanInput } | null>(null);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("set.plans")}</h2>
        <button className="btn-primary min-h-10 text-sm" onClick={() => setEditing({ id: null, form: { ...blankPlan } })}>
          {t("set.newPlan")}
        </button>
      </div>
      {error && <ErrorBox message={error} onRetry={() => reload()} />}
      {loading && !plans ? (
        <Spinner />
      ) : plans?.length === 0 ? (
        <div className="card">
          <EmptyState icon="🍽️" title={t("set.noPlans")} hint={t("set.noPlansHint")} />
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {plans?.map((p) => (
            <li key={p.id}>
              <button
                className="flex w-full items-center gap-3 p-4 text-left active:bg-slate-50"
                onClick={() => setEditing({ id: p.id, form: toInput(p) })}
              >
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${p.is_active ? "" : "text-slate-400 line-through"}`}>{p.name}</p>
                  <p className="text-sm text-slate-500">
                    {planDuration(p)} · {formatINR(p.price)}
                  </p>
                </div>
                {!p.is_active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t("set.off")}</span>}
                <span className="text-slate-400">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <PlanSheet
          id={editing.id}
          initial={editing.form}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload(true);
          }}
        />
      )}
    </section>
  );
}

function toInput(p: Plan): PlanInput {
  const { name, duration_value, duration_unit, price, is_active } = p;
  return { name, duration_value, duration_unit, price, is_active };
}

function PlanSheet({
  id,
  initial,
  onClose,
  onSaved,
}: {
  id: number | null;
  initial: PlanInput;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({ ...initial, duration_value: String(initial.duration_value), price: String(initial.price) });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);

  async function save(isActive = form.is_active) {
    const duration = Number(form.duration_value);
    const price = Number(form.price);
    if (!form.name.trim()) return setError(t("set.errPlanName"));
    if (!Number.isInteger(duration) || duration < 1) return setError(t("set.errDuration"));
    if (Number.isNaN(price) || price < 0) return setError(t("set.errPrice"));
    const payload: PlanInput = { ...form, name: form.name.trim(), duration_value: duration, price, is_active: isActive };
    setSaving(true);
    setError("");
    try {
      if (id === null) await api.createPlan(payload);
      else await api.updatePlan(id, payload);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("common.couldNotSave"));
      setSaving(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    save();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-3xl bg-white p-5"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <h2 className="text-lg font-bold">{id === null ? t("set.newPlanTitle") : t("set.editPlanTitle")}</h2>
        <Field label={t("set.planName")}>
          <input
            className="input"
            placeholder={t("set.planNamePh")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("set.duration")}>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.duration_value}
              onChange={(e) => setForm({ ...form, duration_value: e.target.value })}
            />
          </Field>
          <Field label={t("set.unit")}>
            <select
              className="input"
              value={form.duration_unit}
              onChange={(e) => setForm({ ...form, duration_unit: e.target.value as "days" | "months" })}
            >
              <option value="months">{t("set.months")}</option>
              <option value="days">{t("set.days")}</option>
            </select>
          </Field>
        </div>
        <Field label={t("set.price")}>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </Field>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
        {id !== null &&
          (form.is_active ? (
            <button type="button" className="btn w-full text-red-700" onClick={() => setConfirmOff(true)}>
              {t("set.turnOff")}
            </button>
          ) : (
            <button type="button" className="btn w-full text-brand-700" onClick={() => save(true)}>
              {t("set.turnOn")}
            </button>
          ))}
        <ConfirmDialog
          open={confirmOff}
          title={t("set.turnOffTitle")}
          message={t("set.turnOffMsg")}
          confirmLabel={t("set.turnOffBtn")}
          busy={saving}
          onConfirm={() => save(false)}
          onCancel={() => setConfirmOff(false)}
        />
      </form>
    </div>
  );
}

// ---------------- Mess name + reminders ----------------

function MessSection() {
  const { t } = useI18n();
  const { data, error, reload } = useLoad(api.settings);
  const [form, setForm] = useState<SettingsData | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      setForm(await api.saveSettings({ ...form, expiring_window_days: Number(form.expiring_window_days) }));
      setMessage({ ok: true, text: t("set.saved") });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : t("common.couldNotSave") });
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorBox message={error} onRetry={() => reload()} />;
  if (!form) return <Spinner />;

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{t("set.mess")}</h2>
      <form onSubmit={submit} className="card space-y-4 p-4">
        <Field label={t("set.messName")}>
          <input className="input" value={form.mess_name} onChange={(e) => setForm({ ...form, mess_name: e.target.value })} />
        </Field>
        <Field label={t("set.window")}>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            max={30}
            value={form.expiring_window_days}
            onChange={(e) => setForm({ ...form, expiring_window_days: e.target.value as unknown as number })}
          />
        </Field>
        <Field label={t("set.expiringTpl")}>
          <textarea
            className="input min-h-28"
            value={form.expiring_template}
            onChange={(e) => setForm({ ...form, expiring_template: e.target.value })}
          />
        </Field>
        <Field label={t("set.expiredTpl")}>
          <textarea
            className="input min-h-28"
            value={form.expired_template}
            onChange={(e) => setForm({ ...form, expired_template: e.target.value })}
          />
        </Field>
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <p className="mb-1">{t("set.tplTip")}</p>
          <p className="mb-1 font-semibold">{t("set.placeholders")}</p>
          <p className="flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map((p) => (
              <code key={p} className="rounded bg-white px-1.5 py-0.5 ring-1 ring-slate-200">
                {p}
              </code>
            ))}
          </p>
        </div>
        {message && (
          <p className={`rounded-xl p-3 text-sm ${message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {message.text}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? t("common.saving") : t("set.saveSettings")}
        </button>
      </form>
    </section>
  );
}

// ---------------- Backup ----------------

function BackupSection() {
  const { t } = useI18n();
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{t("set.backup")}</h2>
      <div className="card space-y-3 p-4">
        <p className="text-sm text-slate-600">
          {t("set.backupText")}
        </p>
        <a href="/api/backup" download={`mess-backup-${todayIST()}.xlsx`} className="btn-secondary w-full">
          {t("set.backupBtn")}
        </a>
      </div>
    </section>
  );
}
