import { useEffect, useRef, useState } from "react";
import { api, type PaymentMode, type Plan, type SubscriptionInput } from "../api";
import { formatDate, formatINR, planDuration } from "../format";
import { useI18n, type TKey } from "../i18n";
import { Field } from "./ui";

export interface SubscriptionFormState {
  plan_id: number | "";
  start_date: string;
  end_date: string;
  amount: string;
  payment_mode: PaymentMode;
}

export function initialSubscription(start: string, planId: number | "" = ""): SubscriptionFormState {
  return { plan_id: planId, start_date: start, end_date: "", amount: "", payment_mode: "cash" };
}

/** Validates the form and turns it into an API payload, or returns a translation key for the error. */
export function toSubscriptionInput(s: SubscriptionFormState): SubscriptionInput | TKey {
  if (s.plan_id === "") return "sf.errPlan";
  if (!s.start_date) return "sf.errStart";
  if (s.end_date && s.end_date < s.start_date) return "sf.errDates";
  const amount = s.amount.trim() === "" ? undefined : Number(s.amount);
  if (amount !== undefined && (Number.isNaN(amount) || amount < 0)) return "sf.errAmount";
  return {
    plan_id: s.plan_id,
    start_date: s.start_date,
    end_date: s.end_date || undefined,
    amount_paid: amount,
    payment_mode: s.payment_mode,
  };
}

/**
 * Plan, dates, amount, payment mode. The end date and amount follow the plan
 * automatically until the owner types their own value.
 */
export function SubscriptionFields({
  plans,
  value,
  onChange,
}: {
  plans: Plan[];
  value: SubscriptionFormState;
  onChange: (v: SubscriptionFormState) => void;
}) {
  const { t } = useI18n();
  const [endEdited, setEndEdited] = useState(false);
  const [amountEdited, setAmountEdited] = useState(false);
  const latest = useRef(value);
  latest.current = value;

  const plan = plans.find((p) => p.id === value.plan_id);

  // Most messes have a single plan — pick it so the owner doesn't have to.
  useEffect(() => {
    if (value.plan_id === "" && plans.length === 1) onChange({ ...latest.current, plan_id: plans[0].id });
  }, [plans, value.plan_id]);

  // Recompute the end date from the server whenever plan or start date changes.
  useEffect(() => {
    if (!plan || !value.start_date || endEdited) return;
    let stale = false;
    api
      .previewEndDate(plan.id, value.start_date)
      .then((r) => {
        if (!stale) onChange({ ...latest.current, end_date: r.end_date });
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [plan?.id, value.start_date, endEdited]);

  // Default the amount to the plan price.
  useEffect(() => {
    if (plan && !amountEdited) onChange({ ...latest.current, amount: String(plan.price) });
  }, [plan?.id, amountEdited]);

  return (
    <div className="space-y-4">
      <Field label={t("sf.plan")}>
        <select
          className="input"
          value={value.plan_id}
          onChange={(e) => onChange({ ...value, plan_id: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="">{t("sf.choosePlan")}</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {planDuration(p)} · {formatINR(p.price)}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("sf.startDate")}>
          <input
            type="date"
            className="input"
            value={value.start_date}
            onChange={(e) => onChange({ ...value, start_date: e.target.value })}
          />
        </Field>
        <Field
          label={t("sf.endDate")}
          hint={
            endEdited ? (
              <button type="button" className="font-semibold text-brand-700 underline" onClick={() => setEndEdited(false)}>
                {t("sf.resetAuto")}
              </button>
            ) : (
              t("sf.endAuto")
            )
          }
        >
          <input
            type="date"
            className="input"
            value={value.end_date}
            min={value.start_date}
            onChange={(e) => {
              setEndEdited(true);
              onChange({ ...value, end_date: e.target.value });
            }}
          />
        </Field>
      </div>
      {value.end_date && (
        <p className="-mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {t("sf.planRuns", { start: formatDate(value.start_date), end: formatDate(value.end_date) })}
        </p>
      )}

      <Field label={t("sf.amount")}>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          className="input"
          value={value.amount}
          placeholder={plan ? String(plan.price) : "0"}
          onChange={(e) => {
            setAmountEdited(true);
            onChange({ ...value, amount: e.target.value });
          }}
        />
      </Field>

      <div>
        <span className="label">{t("sf.paidBy")}</span>
        <div className="grid grid-cols-2 gap-3">
          {(["cash", "upi"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ ...value, payment_mode: mode })}
              className={`btn border-2 ${
                value.payment_mode === mode
                  ? "border-brand-700 bg-brand-50 text-brand-800"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {mode === "cash" ? t("sf.cash") : t("sf.upi")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
