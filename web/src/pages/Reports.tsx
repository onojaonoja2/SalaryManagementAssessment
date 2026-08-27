import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatUsd, formatNumber } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

export function Reports() {
  const { data, isLoading, error } = useQuery({ queryKey: ["reports-full"], queryFn: api.reports });

  if (isLoading) return <p className="text-muted-foreground">Loading reports…</p>;
  if (error || !data) return <p className="text-destructive">Failed to load reports.</p>;

  const dist = data.distribution.map((b) => ({ label: b.label, count: b.count }));
  const colors = ["#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports &amp; Analytics</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Salary Distribution (annual USD)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dist}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(222 47% 31%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Average Salary by Country</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.byCountry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                <Tooltip formatter={(v: number) => formatUsd(v)} />
                <Bar dataKey="averageAnnualSalaryUsd" fill="hsl(222 47% 51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Headcount by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.byDepartment} dataKey="headcount" nameKey="name" outerRadius={100} label>
                  {data.byDepartment.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Gender Pay Gap</CardTitle></CardHeader>
          <CardContent>
            {data.genderGapSummary.available ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.genderGap}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="gender" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip formatter={(v: number) => formatUsd(v)} />
                    <Bar dataKey="averageAnnualSalaryUsd" fill="hsl(222 47% 41%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-2 text-sm text-muted-foreground">
                  Female average is <Badge>{data.genderGapSummary.femaleToMalePct}%</Badge> of male average.
                  Gap: <span className="font-semibold">{formatUsd(data.genderGapSummary.gapUsd)}</span>.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough gender data to compare.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payroll by Country</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead>Total Annual Payroll (USD)</TableHead>
                <TableHead>Average Salary (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byCountry.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name} ({c.code})</TableCell>
                  <TableCell>{formatNumber(c.headcount)}</TableCell>
                  <TableCell>{formatUsd(c.totalAnnualPayrollUsd)}</TableCell>
                  <TableCell>{formatUsd(c.averageAnnualSalaryUsd)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payroll by Department</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead>Total Annual Payroll (USD)</TableHead>
                <TableHead>Average Salary (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byDepartment.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{formatNumber(d.headcount)}</TableCell>
                  <TableCell>{formatUsd(d.totalAnnualPayrollUsd)}</TableCell>
                  <TableCell>{formatUsd(d.averageAnnualSalaryUsd)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
