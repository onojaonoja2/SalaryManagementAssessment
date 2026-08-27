import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatUsd, formatDate } from "../lib/format";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog } from "../components/ui/badge";
import { Input, Select, Label } from "../components/ui/input";

export function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const empId = Number(id);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payFrequency, setPayFrequency] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["employee", empId],
    queryFn: () => api.employee(empId),
    enabled: !Number.isNaN(empId),
  });

  const addSalary = useMutation({
    mutationFn: (body: any) => api.addSalary(empId, body),
    onSuccess: () => {
      setOpen(false);
      setAmount("");
      qc.invalidateQueries({ queryKey: ["employee", empId] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  if (Number.isNaN(empId)) return <p className="text-destructive">Invalid employee id.</p>;
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return <p className="text-destructive">Employee not found.</p>;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/employees")} className="text-sm text-primary hover:underline">
        ← Back to employees
      </button>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{data.firstName} {data.lastName}</h1>
        <Button onClick={() => setOpen(true)}>Record salary change</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Code:</span> {data.employeeCode}</p>
            <p><span className="text-muted-foreground">Email:</span> {data.email}</p>
            <p><span className="text-muted-foreground">Gender:</span> {data.gender}</p>
            <p><span className="text-muted-foreground">Hire date:</span> {formatDate(data.hireDate)}</p>
            <p><span className="text-muted-foreground">Job title:</span> {data.jobTitle}</p>
            <p><span className="text-muted-foreground">Country:</span> {data.country.name}</p>
            <p><span className="text-muted-foreground">Department:</span> {data.department.name}</p>
            {data.manager && (
              <p><span className="text-muted-foreground">Manager:</span> {data.manager.firstName} {data.manager.lastName}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Current Salary</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {data.currentSalary ? (
              <div className="space-y-1">
                <p className="text-xl font-bold">{formatUsd(data.currentSalary.annualUsd ?? 0)} <span className="text-muted-foreground text-sm">/ year (USD equiv.)</span></p>
                <p className="text-muted-foreground">
                  {data.currentSalary.amount.toLocaleString()} {data.currentSalary.currencyCode}
                  {" · "}{data.currentSalary.payFrequency.toLowerCase()} · since {formatDate(data.currentSalary.effectiveFrom)}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No salary recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Salary History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Effective to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.salaryHistory.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.amount.toLocaleString()} {s.currencyCode}</TableCell>
                  <TableCell>{s.payFrequency.toLowerCase()}</TableCell>
                  <TableCell>{formatDate(s.effectiveFrom)}</TableCell>
                  <TableCell>{s.effectiveTo ? formatDate(s.effectiveTo) : "Current"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="Record salary change">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!amount) { setError("Amount is required."); return; }
            setError(null);
            addSalary.mutate({
              amount: Number(amount),
              currencyCode: data.currentSalary?.currencyCode ?? "USD",
              payFrequency,
            });
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label>New amount ({data.currentSalary?.currencyCode ?? "USD"})</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pay frequency</Label>
            <Select value={payFrequency} onChange={(e) => setPayFrequency(e.target.value as "MONTHLY" | "ANNUAL")}>
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUAL">Annual</option>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={addSalary.isPending}>Save</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
