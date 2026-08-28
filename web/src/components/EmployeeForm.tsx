import { useState } from "react";
import { Button } from "./ui/button";
import { Input, Select, Label } from "../components/ui/input";
import type { CountryRef, DepartmentRef, Employee, EmployeeDetail } from "../lib/types";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  hireDate: string;
  jobTitle: string;
  countryId: string;
  departmentId: string;
  managerId: string;
  salaryAmount: string;
  payFrequency: "MONTHLY" | "ANNUAL";
};

function toDateInput(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export function EmployeeForm({
  mode,
  countries,
  departments,
  managers,
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  mode: "create" | "edit";
  countries: CountryRef[];
  departments: DepartmentRef[];
  managers: { id: number; label: string }[];
  initial?: Employee | EmployeeDetail;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<FormValues>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    gender: initial?.gender ?? "MALE",
    dateOfBirth: toDateInput(initial?.dateOfBirth),
    hireDate: toDateInput(initial?.hireDate),
    jobTitle: initial?.jobTitle ?? "",
    countryId: initial?.country.id ? String(initial.country.id) : "",
    departmentId: initial?.department.id ? String(initial.department.id) : "",
    managerId: initial?.managerId ? String(initial.managerId) : "",
    salaryAmount: "",
    payFrequency: "MONTHLY",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormValues, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.firstName || !values.lastName || !values.email) {
      setError("First name, last name and email are required.");
      return;
    }
    if (mode === "create" && !values.salaryAmount) {
      setError("An initial salary amount is required.");
      return;
    }
    setError(null);
    onSubmit(values);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>First name</Label>
          <Input value={values.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Last name</Label>
          <Input value={values.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Email</Label>
          <Input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select value={values.gender} onChange={(e) => set("gender", e.target.value as FormValues["gender"])}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Job title</Label>
          <Input value={values.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Date of birth</Label>
          <Input type="date" value={values.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Hire date</Label>
          <Input type="date" value={values.hireDate} onChange={(e) => set("hireDate", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={values.countryId} onChange={(e) => set("countryId", e.target.value)}>
            <option value="">Select…</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={values.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
            <option value="">Select…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Manager (optional)</Label>
          <Select value={values.managerId} onChange={(e) => set("managerId", e.target.value)}>
            <option value="">None</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </Select>
        </div>
        {mode === "create" && (
          <div className="col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Initial salary amount</Label>
              <Input
                type="number"
                value={values.salaryAmount}
                onChange={(e) => set("salaryAmount", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pay frequency</Label>
              <Select value={values.payFrequency} onChange={(e) => set("payFrequency", e.target.value as FormValues["payFrequency"])}>
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
              </Select>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </Button>
      </div>
    </form>
  );
}
