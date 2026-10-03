import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { emptyMember, MemberFields, toMemberInput } from "../components/MemberFields";
import { ErrorBox, PageHeader, Spinner } from "../components/ui";
import { translate, useI18n } from "../i18n";
import { useLoad } from "../useLoad";

export default function EditMember() {
  const { t } = useI18n();
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { data, error: loadError, reload } = useLoad(() => api.member(id), [id]);
  const [form, setForm] = useState(emptyMember);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && !loaded) {
      setForm({
        name: data.name,
        phone: data.phone.replace(/\D/g, "").slice(-10),
        room_or_address: data.room_or_address ?? "",
        notes: data.notes ?? "",
      });
      setLoaded(true);
    }
  }, [data, loaded]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const input = toMemberInput(form);
    if (typeof input === "string") return setError(t(input));
    setSaving(true);
    try {
      await api.updateMember(id, input);
      navigate(`/members/${id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("common.couldNotSave"));
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("edit.title")} back={`/members/${id}`} />
      {loadError ? (
        <ErrorBox message={loadError} onRetry={() => reload()} />
      ) : !loaded ? (
        <Spinner />
      ) : (
        <form onSubmit={submit} className="space-y-6 p-4">
          <MemberFields value={form} onChange={setForm} />
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button type="submit" className="btn-primary w-full text-lg" disabled={saving}>
            {saving ? t("common.saving") : t("edit.save")}
          </button>
        </form>
      )}
    </div>
  );
}
