import type {
  EmployeeDetail,
  EmployeeListResponse,
  ReferenceData,
  ReportData,
} from "./types";

const TOKEN_KEY = "salary_mgmt_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

const API_URL = import.meta.env.VITE_API_URL ?? "";

type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 401) {
    clearToken();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { username: string; role: string } }>("/auth/login", {
      method: "POST",
      body: { username, password },
    }),
  employees: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.append(k, String(v));
    });
    return request<EmployeeListResponse>(`/employees?${qs.toString()}`, { auth: true });
  },
  employee: (id: number) => request<EmployeeDetail>(`/employees/${id}`, { auth: true }),
  createEmployee: (data: unknown) =>
    request<EmployeeDetail>("/employees", { method: "POST", body: data, auth: true }),
  updateEmployee: (id: number, data: unknown) =>
    request<EmployeeDetail>(`/employees/${id}`, { method: "PUT", body: data, auth: true }),
  deleteEmployee: (id: number) =>
    request<{ success: boolean }>(`/employees/${id}`, { method: "DELETE", auth: true }),
  addSalary: (id: number, data: unknown) =>
    request<EmployeeDetail>(`/employees/${id}/salaries`, { method: "POST", body: data, auth: true }),
  reports: () => request<ReportData>("/reports", { auth: true }),
  reference: () => request<ReferenceData>("/reference", { auth: false }),
};
