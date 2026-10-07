const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const KEY = "tv_admin_token";

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem(KEY));
export const setToken = (t: string) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    method: opts.method || "GET",
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data as T;
}

// ---- date helpers (YYYY-MM-DD, local time) ----
export const toStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = () => toStr(new Date());
export const addDays = (s: string, n: number) => {
  const [y, m, d] = s.split("-").map(Number);
  return toStr(new Date(y, m - 1, d + n));
};
export const prettyDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
export const weekday = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" });
};

export type Member = {
  _id: string;
  name: string;
  phone: string;
  address: string;
  vehicle: "scooter" | "bike" | "car";
  planDays: 7 | 15 | 30;
  amount: number;
  amountPaid: number;
  due: number;
  startDate: string;
  endDate: string;
  notes: string;
  status?: "upcoming" | "active" | "completed";
  presentCount?: number;
  attendance?: { date: string; status: "present" | "absent" }[];
};

export type Review = {
  _id: string;
  name: string;
  text: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export const money = (n: number) => `Rs ${Number(n || 0).toLocaleString()}`;

export const VEHICLES = ["scooter", "bike", "car"] as const;
export const PLAN_KEYS = ["d7", "d15", "d30"] as const;
export type Pricing = Record<(typeof VEHICLES)[number], Record<(typeof PLAN_KEYS)[number], number>>;

export type AppNotification = {
  _id: string;
  member: string;
  memberName: string;
  date: string;
  message: string;
  read: boolean;
};
