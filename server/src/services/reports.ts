import { prisma } from "../lib/prisma";
import {
  buildFact,
  byCountry,
  byDepartment,
  genderGapSummary,
  salaryDistribution,
  summarize,
  genderPayGap,
  type RawSalaryRow,
  type SalaryFact,
} from "../lib/aggregate";

async function fetchSalaryRows(): Promise<RawSalaryRow[]> {
  return prisma.$queryRaw<RawSalaryRow[]>`
    SELECT e.id AS employeeId, e.gender,
           e.country_id AS countryId, c.name AS countryName, c.code AS countryCode,
           c.currencyCode AS currencyCode, e.department_id AS departmentId,
           d.name AS departmentName, e.job_title AS jobTitle,
           s.amount, s.pay_frequency AS payFrequency, c.fx_to_usd AS fxToUsd
    FROM employees e
    JOIN salaries s ON s.employee_id = e.id AND s.effective_to IS NULL
    JOIN countries c ON c.id = e.country_id
    JOIN departments d ON d.id = e.department_id`;
}

export async function getReportData() {
  const rows = await fetchSalaryRows();
  const facts: SalaryFact[] = rows.map(buildFact);
  return {
    summary: summarize(facts),
    byCountry: byCountry(facts),
    byDepartment: byDepartment(facts),
    distribution: salaryDistribution(facts, 20000),
    genderGap: genderPayGap(facts),
    genderGapSummary: genderGapSummary(facts),
  };
}
