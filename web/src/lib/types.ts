export type Gender = "MALE" | "FEMALE" | "OTHER";
export type PayFrequency = "MONTHLY" | "ANNUAL";

export type CountryRef = { id: number; code: string; name: string; currencyCode: string; currencySymbol: string };
export type DepartmentRef = { id: number; name: string };

export type SalaryView = {
  amount: number;
  currencyCode: string;
  payFrequency: PayFrequency;
  effectiveFrom?: string;
  annualUsd?: number;
};

export type Employee = {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender;
  dateOfBirth: string;
  hireDate: string;
  jobTitle: string;
  managerId: number | null;
  manager?: { id: number; firstName: string; lastName: string } | null;
  country: { id: number; name: string; code: string };
  department: { id: number; name: string };
  currentSalary: SalaryView | null;
};

export type EmployeeListResponse = {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SalaryHistoryEntry = {
  id: number;
  amount: number;
  currencyCode: string;
  payFrequency: PayFrequency;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type EmployeeDetail = Employee & {
  currentSalary: (SalaryView & { effectiveFrom: string }) | null;
  salaryHistory: SalaryHistoryEntry[];
};

export type DimensionStat = {
  id: number;
  name: string;
  code?: string;
  currencyCode?: string;
  headcount: number;
  totalAnnualPayrollUsd: number;
  averageAnnualSalaryUsd: number;
};

export type DistributionBucket = {
  label: string;
  min: number;
  max: number;
  count: number;
  share: number;
};

export type GenderGapStat = {
  gender: string;
  headcount: number;
  averageAnnualSalaryUsd: number;
};

export type ReportSummary = {
  headcount: number;
  totalAnnualPayrollUsd: number;
  averageAnnualSalaryUsd: number;
  medianAnnualSalaryUsd: number;
};

export type GenderGapSummary = {
  available: boolean;
  gapUsd: number;
  ratio: number;
  femaleToMalePct: number;
};

export type ReportData = {
  summary: ReportSummary;
  byCountry: DimensionStat[];
  byDepartment: DimensionStat[];
  distribution: DistributionBucket[];
  genderGap: GenderGapStat[];
  genderGapSummary: GenderGapSummary;
};

export type ReferenceData = {
  countries: CountryRef[];
  departments: DepartmentRef[];
};
