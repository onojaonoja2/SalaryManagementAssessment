import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Employee } from "../lib/types";
import { formatUsd } from "../lib/format";
import { Button } from "../components/ui/button";
import { Input, Select } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog } from "../components/ui/badge";
import { EmployeeForm } from "../components/EmployeeForm";

type Filters = {
  search: string;
  countryId: string;
  departmentId: string;
  gender: string;
  minUsd: string;
  maxUsd: string;
  sort: string;
  order: string;
};

const EMPTY: Filters = {
  search: "", countryId: "", departmentId: "", gender: "", minUsd: "", maxUsd: "", sort: "name", order: "asc",
};

export function Employees() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [dialog, setDialog] = useState<null | { mode: "create" } | { mode: "edit"; employee: Employee }>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reference = useQuery({ queryKey: ["reference"], queryFn: api.reference });
  const managers = useQuery({
    queryKey: ["managers"],
    queryFn: () => api.employees({ pageSize: 200, sort: "name", order: "asc" }),
  });

  const list = useQuery({
    queryKey: ["employees", page, filters],
    queryFn: () =>
      api.employees({
        page,
        pageSize: 25,
        search: filters.search || undefined,
        countryId: filters.countryId || undefined,
        departmentId: filters.departmentId || undefined,
        gender: filters.gender || undefined,
        minUsd: filters.minUsd || undefined,
        maxUsd: filters.maxUsd || undefined,
        sort: filters.sort,
        order: filters.order,
      }),
  });

  // Reset to first page whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["employees"] });
    qc.invalidateQueries({ queryKey: ["reports"] });
  };

  const createMut = useMutation({
    mutationFn: (values: any) => {
      const country = reference.data?.countries.find((c) => c.id === Number(values.countryId));
      return api.createEmployee({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        gender: values.gender,
        dateOfBirth: new Date(values.dateOfBirth).toISOString(),
        hireDate: new Date(values.hireDate).toISOString(),
        jobTitle: values.jobTitle,
        countryId: Number(values.countryId),
        departmentId: Number(values.departmentId),
        managerId: values.managerId ? Number(values.managerId) : null,
        salary: {
          amount: Number(values.salaryAmount),
          currencyCode: country?.currencyCode ?? "USD",
          payFrequency: values.payFrequency,
        },
      });
    },
    onSuccess: () => { setDialog(null); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (values: any) =>
      api.updateEmployee(Number(values.id), {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        gender: values.gender,
        dateOfBirth: new Date(values.dateOfBirth).toISOString(),
        hireDate: new Date(values.hireDate).toISOString(),
        jobTitle: values.jobTitle,
        countryId: Number(values.countryId),
        departmentId: Number(values.departmentId),
        managerId: values.managerId ? Number(values.managerId) : null,
      }),
    onSuccess: () => { setDialog(null); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteEmployee(id),
    onSuccess: () => invalidate(),
    onError: (e: Error) => setError(e.message),
  });

  const countries = reference.data?.countries ?? [];
  const departments = reference.data?.departments ?? [];
  const managerOptions = (managers.data?.data ?? []).map((m) => ({
    id: m.id,
    label: `${m.firstName} ${m.lastName} (${m.employeeCode})`,
  }));

  const onSubmit = (values: any) => {
    setSubmitting(true);
    setError(null);
    const run = dialog?.mode === "edit"
      ? updateMut.mutateAsync({ ...values, id: (dialog as any).employee.id })
      : createMut.mutateAsync(values);
    run.finally(() => setSubmitting(false));
  };

  const onDelete = (emp: Employee) => {
    if (confirm(`Delete ${emp.firstName} ${emp.lastName}? This cannot be undone.`)) {
      deleteMut.mutate(emp.id);
    }
  };

  const setF = (k: keyof Filters, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={() => setDialog({ mode: "create" })}>+ Add employee</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Input
          className="col-span-2"
          placeholder="Search name / email / code"
          value={filters.search}
          onChange={(e) => setF("search", e.target.value)}
        />
        <Select value={filters.countryId} onChange={(e) => setF("countryId", e.target.value)}>
          <option value="">All countries</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={filters.departmentId} onChange={(e) => setF("departmentId", e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select value={filters.gender} onChange={(e) => setF("gender", e.target.value)}>
          <option value="">Any gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </Select>
        <Input placeholder="Min USD" value={filters.minUsd} onChange={(e) => setF("minUsd", e.target.value)} />
        <Input placeholder="Max USD" value={filters.maxUsd} onChange={(e) => setF("maxUsd", e.target.value)} />
        <div className="col-span-2 flex gap-2">
          <Select value={filters.sort} onChange={(e) => setF("sort", e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="hireDate">Sort: Hire date</option>
            <option value="jobTitle">Sort: Job title</option>
            <option value="country">Sort: Country</option>
            <option value="department">Sort: Department</option>
          </Select>
          <Button variant="outline" onClick={() => setF("order", filters.order === "asc" ? "desc" : "asc")}>
            {filters.order === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Job title</TableHead>
            <TableHead>Current salary (USD/yr)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.data?.data.map((emp) => (
            <TableRow key={emp.id}>
              <TableCell>{emp.employeeCode}</TableCell>
              <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
              <TableCell>{emp.department.name}</TableCell>
              <TableCell>{emp.country.name}</TableCell>
              <TableCell>{emp.jobTitle}</TableCell>
              <TableCell>{emp.currentSalary?.annualUsd ? formatUsd(emp.currentSalary.annualUsd) : "—"}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/employees/${emp.id}`)}>View</Button>
                <Button variant="ghost" size="sm" onClick={() => setDialog({ mode: "edit", employee: emp })}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(emp)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
          {list.data?.data.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No employees found.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {list.data ? `Page ${list.data.page} of ${list.data.totalPages} · ${list.data.total} total` : ""}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= (list.data?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? "Edit employee" : "Add employee"}
      >
        {dialog && (
          <EmployeeForm
            mode={dialog.mode}
            countries={countries}
            departments={departments}
            managers={managerOptions}
            initial={dialog.mode === "edit" ? dialog.employee : undefined}
            onSubmit={onSubmit}
            onCancel={() => setDialog(null)}
            submitting={submitting}
          />
        )}
      </Dialog>
    </div>
  );
}
