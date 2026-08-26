import { describe, it, expect } from "vitest";
import {
  toAnnualUsd,
  buildFact,
  summarize,
  byCountry,
  byDepartment,
  salaryDistribution,
  genderPayGap,
  genderGapSummary,
  type SalaryFact,
} from "../../lib/aggregate";
import type { RawSalaryRow } from "../../lib/aggregate";

function fact(over: Partial<SalaryFact>): SalaryFact {
  return {
    employeeId: 1,
    gender: "MALE",
    countryId: 1,
    countryName: "United States",
    countryCode: "US",
    currencyCode: "USD",
    departmentId: 1,
    departmentName: "Engineering",
    jobTitle: "Engineer",
    annualUsd: 100000,
    ...over,
  };
}

describe("toAnnualUsd", () => {
  it("annual frequency is unchanged", () => {
    expect(toAnnualUsd(1000, "ANNUAL", 1)).toBe(1000);
  });
  it("monthly frequency multiplies by 12", () => {
    expect(toAnnualUsd(1000, "MONTHLY", 1)).toBe(12000);
  });
  it("applies fx conversion", () => {
    expect(toAnnualUsd(1000, "MONTHLY", 2)).toBe(24000);
  });
});

describe("buildFact", () => {
  it("computes annual USD from a raw row", () => {
    const row: RawSalaryRow = {
      employeeId: 9,
      gender: "FEMALE",
      countryId: 2,
      countryName: "Germany",
      countryCode: "DE",
      currencyCode: "EUR",
      departmentId: 3,
      departmentName: "Sales",
      jobTitle: "Manager",
      amount: 5000,
      payFrequency: "MONTHLY",
      fxToUsd: 1.0,
    };
    const f = buildFact(row);
    expect(f.annualUsd).toBe(60000);
    expect(f.employeeId).toBe(9);
  });
});

describe("summarize", () => {
  it("computes headcount, payroll, average and median", () => {
    const facts = [fact({ annualUsd: 100 }), fact({ annualUsd: 200 }), fact({ annualUsd: 300 })];
    const s = summarize(facts);
    expect(s.headcount).toBe(3);
    expect(s.totalAnnualPayrollUsd).toBe(600);
    expect(s.averageAnnualSalaryUsd).toBe(200);
    expect(s.medianAnnualSalaryUsd).toBe(200);
  });

  it("median of even count averages the two middle values", () => {
    const facts = [fact({ annualUsd: 100 }), fact({ annualUsd: 200 }), fact({ annualUsd: 300 }), fact({ annualUsd: 400 })];
    expect(summarize(facts).medianAnnualSalaryUsd).toBe(250);
  });
});

describe("byCountry", () => {
  it("groups by country and sorts by payroll desc", () => {
    const facts = [
      fact({ countryId: 1, countryName: "US", annualUsd: 100 }),
      fact({ countryId: 1, countryName: "US", annualUsd: 100 }),
      fact({ countryId: 2, countryName: "DE", annualUsd: 1000 }),
    ];
    const result = byCountry(facts);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(2);
    expect(result[0].totalAnnualPayrollUsd).toBe(1000);
    expect(result[0].headcount).toBe(1);
    expect(result[1].id).toBe(1);
    expect(result[1].headcount).toBe(2);
  });
});

describe("byDepartment", () => {
  it("groups by department", () => {
    const facts = [
      fact({ departmentId: 1, departmentName: "Eng", annualUsd: 500 }),
      fact({ departmentId: 2, departmentName: "Sales", annualUsd: 1500 }),
    ];
    const result = byDepartment(facts);
    expect(result).toHaveLength(2);
    const sales = result.find((r) => r.name === "Sales")!;
    expect(sales.totalAnnualPayrollUsd).toBe(1500);
    expect(sales.averageAnnualSalaryUsd).toBe(1500);
  });
});

describe("salaryDistribution", () => {
  it("buckets salaries by size", () => {
    const facts = [fact({ annualUsd: 10000 }), fact({ annualUsd: 30000 }), fact({ annualUsd: 90000 })];
    const buckets = salaryDistribution(facts, 20000);
    expect(buckets[0].count).toBe(1); // 0-20k
    expect(buckets[1].count).toBe(1); // 20-40k
    expect(buckets[4].count).toBe(1); // 80-100k
  });
});

describe("genderPayGap", () => {
  it("averages per gender", () => {
    const facts = [
      fact({ gender: "MALE", annualUsd: 200 }),
      fact({ gender: "MALE", annualUsd: 400 }),
      fact({ gender: "FEMALE", annualUsd: 300 }),
    ];
    const gap = genderPayGap(facts);
    const male = gap.find((g) => g.gender === "MALE")!;
    const female = gap.find((g) => g.gender === "FEMALE")!;
    expect(male.averageAnnualSalaryUsd).toBe(300);
    expect(female.averageAnnualSalaryUsd).toBe(300);
  });
});

describe("genderGapSummary", () => {
  it("computes gap and ratio between male and female", () => {
    const facts = [
      fact({ gender: "MALE", annualUsd: 200 }),
      fact({ gender: "FEMALE", annualUsd: 100 }),
    ];
    const s = genderGapSummary(facts);
    expect(s.available).toBe(true);
    expect(s.gapUsd).toBe(100);
    expect(s.ratio).toBe(2);
    expect(s.femaleToMalePct).toBe(50);
  });

  it("reports unavailable when a gender is missing", () => {
    const facts = [fact({ gender: "MALE", annualUsd: 200 })];
    expect(genderGapSummary(facts).available).toBe(false);
  });
});
