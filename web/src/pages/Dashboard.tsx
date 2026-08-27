import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatUsd, formatNumber } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["reports"], queryFn: api.reports });

  if (isLoading) return <p className="text-muted-foreground">Loading dashboard…</p>;
  if (error || !data) return <p className="text-destructive">Failed to load reports.</p>;

  const topCountries = [...data.byCountry].slice(0, 10).map((c) => ({
    name: c.name,
    payroll: Math.round(c.totalAnnualPayrollUsd / 1_000_000 * 100) / 100,
  }));
  const deptData = data.byDepartment.map((d) => ({
    name: d.name,
    avg: Math.round(d.averageAnnualSalaryUsd),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Headcount" value={formatNumber(data.summary.headcount)} />
        <Kpi label="Total Annual Payroll" value={formatUsd(data.summary.totalAnnualPayrollUsd)} />
        <Kpi label="Average Salary" value={formatUsd(data.summary.averageAnnualSalaryUsd)} />
        <Kpi label="Median Salary" value={formatUsd(data.summary.medianAnnualSalaryUsd)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payroll by Country (USD millions)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCountries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="payroll" fill="hsl(222 47% 31%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Salary by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                <Tooltip formatter={(v: number) => formatUsd(v)} />
                <Bar dataKey="avg" fill="hsl(222 47% 51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {data.genderGapSummary.available && (
        <Card>
          <CardHeader>
            <CardTitle>Gender Pay Gap</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Female average is{" "}
              <span className="font-semibold">{data.genderGapSummary.femaleToMalePct}%</span> of male
              average. Gap: <span className="font-semibold">{formatUsd(data.genderGapSummary.gapUsd)}</span>{" "}
              (ratio {data.genderGapSummary.ratio}).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
