import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type MemberDetail, type Plan } from "../api";
import {
  initialSubscription,
  SubscriptionFields,
  toSubscriptionInput,
  type SubscriptionFormState,
} from "../components/SubscriptionFields";
import { ErrorBox, PageHeader, Spinner, StatusBadge } from "../components/ui";
import { daysText, formatDate } from "../format";
import { translate, useI18n } from "../i18n";

export default function Renew() {
  const { t } = useI18n();
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [sub, setSub] = useState<SubscriptionFormState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoadError("");
    try {
      const [m, p] = await Promise.all([api.member(id), api.plans(true)]);
      setMember(m);
      setPlans(p);
      // Keep their current plan if it's still offered.
      const keep = p.some((plan) => plan.id === m.plan_id) ? (m.plan_id as number) : "";
      setSub(initialSubscription(m.next_start_date, keep));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : translate("common.couldNotLoad"));
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!sub) return;
    const input = toSubscriptionInput(sub);
    if (typeof input === "string") return setError(t(input));
    setSaving(true);
    try {
      await api.renew(id, input);
      navigate(`/members/${id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("renew.error"));
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("renew.title")} back={`/members/${id}`} />
      {loadError ? (
        <ErrorBox message={loadError} onRetry={load} />
      ) : !member || !plans || !sub ? (
        <Spinner />
      ) : (
        <form onSubmit={submit} className="space-y-5 p-4">
          <div className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-bold">{member.name}</p>
              <StatusBadge status={member.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {t("renew.current", { plan: member.plan_name ?? "", date: formatDate(member.end_date), days: daysText(member) })}
            </p>
          </div>
          <SubscriptionFields plans={plans} value={sub} onChange={setSub} />
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button type="submit" className="btn-primary w-full text-lg" disabled={saving}>
            {saving ? t("common.saving") : t("renew.save")}
          </button>
        </form>
      )}
    </div>
  );
}
