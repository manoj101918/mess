import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { EmptyState, ErrorBox, PageHeader, Spinner, StatusBadge } from "../components/ui";
import { daysText, displayPhone, formatDate } from "../format";
import { useI18n, type TKey } from "../i18n";
import { useLoad } from "../useLoad";

const FILTERS: { value: string; label: TKey }[] = [
  { value: "", label: "members.all" },
  { value: "active", label: "status.active" },
  { value: "expiring", label: "status.expiring" },
  { value: "expired", label: "status.expired" },
];

export default function Members() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const [search, setSearch] = useState(searchInput);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, error, loading, reload } = useLoad(() => api.members(search, status), [search, status]);

  function setStatus(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("status", value);
    else next.delete("status");
    setParams(next, { replace: true });
  }

  return (
    <div>
      <PageHeader title={t("members.title")} right={<span className="text-sm text-slate-500">{data ? data.length : ""}</span>} />
      <div className="sticky top-14 z-10 space-y-3 bg-slate-50 px-4 pt-3 pb-2">
        <input
          type="search"
          className="input"
          placeholder={t("members.search")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
                status === f.value ? "bg-brand-700 text-white" : "border border-slate-300 bg-white text-slate-700"
              }`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={() => reload()} />}
      {loading && !data ? (
        <Spinner />
      ) : data && data.length === 0 ? (
        search || status ? (
          <EmptyState icon="🔍" title={t("members.noMatch")} hint={t("members.noMatchHint")} />
        ) : (
          <EmptyState
            icon="📒"
            title={t("dash.noMembers")}
            hint={t("members.noMembersHint")}
            action={
              <Link to="/add" className="btn-primary">
                {t("dash.addMember")}
              </Link>
            }
          />
        )
      ) : (
        <ul className="space-y-2 px-4 pt-1 pb-4">
          {data?.map((m) => (
            <li key={m.id}>
              <Link to={`/members/${m.id}`} className="card flex items-center gap-3 p-4 active:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {displayPhone(m.phone)} · {m.plan_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {t("row.ends", { date: formatDate(m.end_date) })} · {daysText(m)}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
