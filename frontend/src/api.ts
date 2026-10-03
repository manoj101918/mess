import { translate } from "./i18n";

export type Status = "active" | "expiring" | "expired";
export type PaymentMode = "cash" | "upi";

export interface Plan {
  id: number;
  name: string;
  duration_value: number;
  duration_unit: "days" | "months";
  price: number;
  is_active: boolean;
}

export interface MemberSummary {
  id: number;
  name: string;
  phone: string;
  room_or_address: string | null;
  plan_id: number | null;
  plan_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: Status;
  days_left: number;
  days_overdue: number;
  reminded_today: boolean;
  current_subscription_id: number | null;
}

export interface Subscription {
  id: number;
  plan_id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  payment_mode: PaymentMode;
  paid_on: string;
  created_at: string | null;
}

export interface Reminder {
  id: number;
  subscription_id: number | null;
  sent_at: string;
  type: "expiring" | "expired";
}

export interface MemberDetail extends MemberSummary {
  notes: string | null;
  created_at: string | null;
  next_start_date: string;
  subscriptions: Subscription[];
  reminders: Reminder[];
}

export interface Dashboard {
  today: string;
  mess_name: string;
  expiring_window_days: number;
  counts: { active: number; expiring: number; expired: number; total: number; month_collection: number };
  expiring: MemberSummary[];
  expired: MemberSummary[];
}

export interface Settings {
  mess_name: string;
  expiring_window_days: number;
  expiring_template: string;
  expired_template: string;
}

export interface SubscriptionInput {
  plan_id: number;
  start_date?: string;
  end_date?: string;
  amount_paid?: number;
  payment_mode: PaymentMode;
}

export interface MemberInput {
  name: string;
  phone: string;
  room_or_address?: string | null;
  notes?: string | null;
}

export interface PlanInput {
  name: string;
  duration_value: number;
  duration_unit: "days" | "months";
  price: number;
  is_active: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch {
    throw new ApiError(translate("common.networkError"), 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail;
    const message = typeof detail === "string" ? detail : translate("common.genericError");
    throw new ApiError(message, res.status);
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  dashboard: () => request<Dashboard>("/dashboard"),

  members: (search = "", status = "") =>
    request<MemberSummary[]>(`/members?${new URLSearchParams({ search, status })}`),
  member: (id: number) => request<MemberDetail>(`/members/${id}`),
  createMember: (data: MemberInput & SubscriptionInput) =>
    request<MemberDetail>("/members", { method: "POST", body: json(data) }),
  updateMember: (id: number, data: MemberInput) =>
    request<MemberDetail>(`/members/${id}`, { method: "PUT", body: json(data) }),
  deleteMember: (id: number) => request<void>(`/members/${id}`, { method: "DELETE" }),
  renew: (id: number, data: SubscriptionInput) =>
    request<MemberDetail>(`/members/${id}/renew`, { method: "POST", body: json(data) }),
  remind: (id: number) =>
    request<{ reminder: Reminder; message: string; wa_link: string }>(`/members/${id}/reminders`, {
      method: "POST",
    }),

  plans: (activeOnly = false) => request<Plan[]>(`/plans${activeOnly ? "?active_only=true" : ""}`),
  createPlan: (data: PlanInput) => request<Plan>("/plans", { method: "POST", body: json(data) }),
  updatePlan: (id: number, data: PlanInput) => request<Plan>(`/plans/${id}`, { method: "PUT", body: json(data) }),
  previewEndDate: (planId: number, startDate: string) =>
    request<{ start_date: string; end_date: string }>(
      `/plans/preview-end-date?${new URLSearchParams({ plan_id: String(planId), start_date: startDate })}`,
    ),

  settings: () => request<Settings>("/settings"),
  saveSettings: (data: Settings) => request<Settings>("/settings", { method: "PUT", body: json(data) }),
};
