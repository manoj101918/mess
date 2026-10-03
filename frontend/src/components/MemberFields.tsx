import type { MemberInput } from "../api";
import { useI18n, type TKey } from "../i18n";
import { Field } from "./ui";

export interface MemberFormState {
  name: string;
  phone: string; // 10 digits, no +91
  room_or_address: string;
  notes: string;
}

export const emptyMember: MemberFormState = { name: "", phone: "", room_or_address: "", notes: "" };

/** Handles pasted numbers like "+91 98765 43210" or "098765 43210". */
function cleanPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  else if (d.length > 10 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

/** Returns the payload, or a translation key describing what is wrong. */
export function toMemberInput(m: MemberFormState): MemberInput | TKey {
  if (!m.name.trim()) return "mf.errName";
  if (!/^[6-9]\d{9}$/.test(m.phone)) return "mf.errPhone";
  return {
    name: m.name.trim(),
    phone: m.phone,
    room_or_address: m.room_or_address.trim() || null,
    notes: m.notes.trim() || null,
  };
}

export function MemberFields({ value, onChange }: { value: MemberFormState; onChange: (v: MemberFormState) => void }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <Field label={t("mf.name")}>
        <input
          className="input"
          autoComplete="off"
          autoCapitalize="words"
          placeholder={t("mf.namePh")}
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </Field>
      <Field label={t("mf.phone")}>
        <div className="flex">
          <span className="flex items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 px-3 text-slate-600">
            +91
          </span>
          <input
            className="input rounded-l-none"
            type="tel"
            inputMode="numeric"
            placeholder={t("mf.phonePh")}
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: cleanPhone(e.target.value) })}
          />
        </div>
      </Field>
      <Field label={t("mf.room")}>
        <input
          className="input"
          placeholder={t("mf.roomPh")}
          value={value.room_or_address}
          onChange={(e) => onChange({ ...value, room_or_address: e.target.value })}
        />
      </Field>
      <Field label={t("mf.notes")}>
        <textarea
          className="input min-h-20"
          placeholder={t("mf.notesPh")}
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </Field>
    </div>
  );
}
