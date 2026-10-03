import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { emptyMember, MemberFields, toMemberInput } from "../components/MemberFields";
import { initialSubscription, SubscriptionFields, toSubscriptionInput } from "../components/SubscriptionFields";
import { EmptyState, ErrorBox, PageHeader, Spinner } from "../components/ui";
import { todayIST } from "../format";
import { translate, useI18n, type TKey } from "../i18n";
import { useLoad } from "../useLoad";

export default function AddMember() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const plans = useLoad(() => api.plans(true));
  const [member, setMember] = useState(emptyMember);
  const [sub, setSub] = useState(() => initialSubscription(todayIST()));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const m = toMemberInput(member);
    const s = toSubscriptionInput(sub);
    if (typeof m === "string" || typeof s === "string") {
      setError(t(typeof m === "string" ? m : (s as TKey)));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await api.createMember({ ...m, ...s });
      navigate(`/members/${created.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("common.couldNotSave"));
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("add.title")} />
      {plans.loading && !plans.data ? (
        <Spinner />
      ) : plans.error ? (
        <ErrorBox message={plans.error} onRetry={() => plans.reload()} />
      ) : plans.data?.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title={t("add.planFirst")}
          hint={t("add.planFirstHint")}
          action={
            <Link to="/settings" className="btn-primary">
              {t("add.goSettings")}
            </Link>
          }
        />
      ) : (
        <form onSubmit={submit} className="space-y-6 p-4">
          <MemberFields value={member} onChange={setMember} />
          <div className="border-t border-slate-200 pt-5">
            <h2 className="mb-4 text-base font-bold">{t("add.planPayment")}</h2>
            <SubscriptionFields plans={plans.data ?? []} value={sub} onChange={setSub} />
          </div>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button type="submit" className="btn-primary w-full text-lg" disabled={saving}>
            {saving ? t("common.saving") : t("add.save")}
          </button>
        </form>
      )}
    </div>
  );
}
