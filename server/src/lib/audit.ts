// Lightweight structured security logging.
// IMPORTANT: never log secrets or full PII here — only identifiers/metadata.

export type SecurityEvent =
  | "login_success"
  | "login_failure"
  | "logout"
  | "token_rejected"
  | "employee_create"
  | "employee_update"
  | "employee_delete"
  | "salary_change";

export function audit(event: SecurityEvent, detail: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({ ts: new Date().toISOString(), type: "security", event, ...detail }),
  );
}
