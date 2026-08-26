import { num, round2 } from "./numeric";

export type SalaryFact = {
  employeeId: number;
  gender: string;
  countryId: number;
  countryName: string;
  countryCode: string;
  currencyCode: string;
  departmentId: number;
  departmentName: string;
  jobTitle: string;
  annualUsd: number;
};

export type RawSalaryRow = {
  employeeId: number | bigint;
  gender: string;
  countryId: number | bigint;
  countryName: string;
  countryCode: string;
  currencyCode: string;
  departmentId: number | bigint;
  departmentName: string;
  jobTitle: string;
  amount: unknown;
  payFrequency: string;
  fxToUsd: unknown;
};

// Convert a (possibly monthly) local-currency salary into annual USD.
export function toAnnualUsd(
  amount: number,
  payFrequency: string,
  fxToUsd: number,
): number {
  const annualLocal = payFrequency === "MONTHLY" ? amount * 12 : amount;
  return annualLocal * fxToUsd;
}

export function buildFact(row: RawSalaryRow): SalaryFact {
  const annualUsd = toAnnualUsd(
    num(row.amount),
    row.payFrequency,
    num(row.fxToUsd),
  );
  return {
    employeeId: num(row.employeeId),
    gender: row.gender,
    countryId: num(row.countryId),
    countryName: row.countryName,
    countryCode: row.countryCode,
    currencyCode: row.currencyCode,
    departmentId: num(row.departmentId),
    departmentName: row.departmentName,
    jobTitle: row.jobTitle,
    annualUsd,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export type Summary = {
  headcount: number;
  totalAnnualPayrollUsd: number;
  averageAnnualSalaryUsd: number;
  medianAnnualSalaryUsd: number;
};

export function summarize(facts: SalaryFact[]): Summary {
  const payroll = facts.reduce((sum, f) => sum + f.annualUsd, 0);
  const avg = facts.length ? payroll / facts.length : 0;
  return {
    headcount: facts.length,
    totalAnnualPayrollUsd: round2(payroll),
    averageAnnualSalaryUsd: round2(avg),
    medianAnnualSalaryUsd: round2(median(facts.map((f) => f.annualUsd))),
  };
}

export type DimensionStat = {
  id: number;
  name: string;
  code?: string;
  currencyCode?: string;
  headcount: number;
  totalAnnualPayrollUsd: number;
  averageAnnualSalaryUsd: number;
};

function groupByDimension(
  facts: SalaryFact[],
  keyId: "countryId" | "departmentId",
  keyName: "countryName" | "departmentName",
  extra?: (f: SalaryFact) => Partial<DimensionStat>,
): DimensionStat[] {
  const map = new Map<number, SalaryFact[]>();
  for (const f of facts) {
    const id = f[keyId];
    (map.get(id) ?? map.set(id, []).get(id)!).push(f);
  }
  const result: DimensionStat[] = [];
  for (const [id, group] of map) {
    const payroll = group.reduce((s, f) => s + f.annualUsd, 0);
    const stat: DimensionStat = {
      id,
      name: group[0][keyName],
      headcount: group.length,
      totalAnnualPayrollUsd: round2(payroll),
      averageAnnualSalaryUsd: round2(payroll / group.length),
      ...(extra ? extra(group[0]) : {}),
    };
    result.push(stat);
  }
  return result.sort((a, b) => b.totalAnnualPayrollUsd - a.totalAnnualPayrollUsd);
}

export function byCountry(facts: SalaryFact[]): DimensionStat[] {
  return groupByDimension(facts, "countryId", "countryName", (f) => ({
    code: f.countryCode,
    currencyCode: f.currencyCode,
  }));
}

export function byDepartment(facts: SalaryFact[]): DimensionStat[] {
  return groupByDimension(facts, "departmentId", "departmentName");
}

export type DistributionBucket = {
  label: string;
  min: number;
  max: number;
  count: number;
  share: number;
};

export function salaryDistribution(
  facts: SalaryFact[],
  bucketSize = 20000,
): DistributionBucket[] {
  if (facts.length === 0) return [];
  const values = facts.map((f) => f.annualUsd);
  const maxVal = Math.max(...values);
  const bucketCount = Math.max(1, Math.ceil(maxVal / bucketSize));
  const buckets: DistributionBucket[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const min = i * bucketSize;
    const max = (i + 1) * bucketSize;
    const count = values.filter((v) => v >= min && v < max).length;
    buckets.push({
      label: `$${min.toLocaleString()} – $${max.toLocaleString()}`,
      min,
      max,
      count,
      share: round2((count / facts.length) * 100),
    });
  }
  return buckets;
}

export type GenderGapStat = {
  gender: string;
  headcount: number;
  averageAnnualSalaryUsd: number;
};

export function genderPayGap(facts: SalaryFact[]): GenderGapStat[] {
  const map = new Map<string, SalaryFact[]>();
  for (const f of facts) {
    (map.get(f.gender) ?? map.set(f.gender, []).get(f.gender)!).push(f);
  }
  const stats: GenderGapStat[] = [];
  for (const [gender, group] of map) {
    const payroll = group.reduce((s, f) => s + f.annualUsd, 0);
    stats.push({
      gender,
      headcount: group.length,
      averageAnnualSalaryUsd: round2(payroll / group.length),
    });
  }
  return stats;
}

// Compute a simple overall gender pay gap: difference & ratio of avg salaries.
export function genderGapSummary(facts: SalaryFact[]) {
  const byGender = genderPayGap(facts);
  const male = byGender.find((g) => g.gender === "MALE");
  const female = byGender.find((g) => g.gender === "FEMALE");
  if (!male || !female) {
    return { available: false, gapUsd: 0, ratio: 1, femaleToMalePct: 100 };
  }
  const gapUsd = round2(male.averageAnnualSalaryUsd - female.averageAnnualSalaryUsd);
  const ratio = round2(male.averageAnnualSalaryUsd / female.averageAnnualSalaryUsd);
  const femaleToMalePct = round2(
    (female.averageAnnualSalaryUsd / male.averageAnnualSalaryUsd) * 100,
  );
  return { available: true, gapUsd, ratio, femaleToMalePct };
}
