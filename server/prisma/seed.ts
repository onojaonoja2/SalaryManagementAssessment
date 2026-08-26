import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---- Deterministic PRNG (mulberry32) so seeds are reproducible for tests ----
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260101);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

const COUNTRIES = [
  { code: "US", name: "United States", currencyCode: "USD", currencySymbol: "$", fxToUsd: 1.0, baseLocal: 95000 },
  { code: "GB", name: "United Kingdom", currencyCode: "GBP", currencySymbol: "£", fxToUsd: 1.27, baseLocal: 62000 },
  { code: "DE", name: "Germany", currencyCode: "EUR", currencySymbol: "€", fxToUsd: 1.08, baseLocal: 72000 },
  { code: "FR", name: "France", currencyCode: "EUR", currencySymbol: "€", fxToUsd: 1.08, baseLocal: 68000 },
  { code: "IN", name: "India", currencyCode: "INR", currencySymbol: "₹", fxToUsd: 0.012, baseLocal: 1800000 },
  { code: "NG", name: "Nigeria", currencyCode: "NGN", currencySymbol: "₦", fxToUsd: 0.00065, baseLocal: 18000000 },
  { code: "BR", name: "Brazil", currencyCode: "BRL", currencySymbol: "R$", fxToUsd: 0.18, baseLocal: 180000 },
  { code: "JP", name: "Japan", currencyCode: "JPY", currencySymbol: "¥", fxToUsd: 0.0067, baseLocal: 9000000 },
  { code: "CA", name: "Canada", currencyCode: "CAD", currencySymbol: "C$", fxToUsd: 0.73, baseLocal: 110000 },
  { code: "AU", name: "Australia", currencyCode: "AUD", currencySymbol: "A$", fxToUsd: 0.66, baseLocal: 130000 },
  { code: "ZA", name: "South Africa", currencyCode: "ZAR", currencySymbol: "R", fxToUsd: 0.052, baseLocal: 650000 },
  { code: "SG", name: "Singapore", currencyCode: "SGD", currencySymbol: "S$", fxToUsd: 0.74, baseLocal: 110000 },
  { code: "AE", name: "United Arab Emirates", currencyCode: "AED", currencySymbol: "د.إ", fxToUsd: 0.27, baseLocal: 300000 },
  { code: "MX", name: "Mexico", currencyCode: "MXN", currencySymbol: "$", fxToUsd: 0.058, baseLocal: 900000 },
  { code: "KE", name: "Kenya", currencyCode: "KES", currencySymbol: "KSh", fxToUsd: 0.0077, baseLocal: 3500000 },
];

const DEPARTMENTS = [
  "Engineering", "Sales", "Marketing", "Finance", "Human Resources",
  "Operations", "Customer Support", "Legal", "Product", "Data & Analytics",
];

const MALE_FIRST = ["James", "Mohammed", "David", "Carlos", "Wei", "Raj", "John", "Omar", "Chen", "Liam", "Noah", "Arjun", "Tobias", "Hiroshi", "Kwame"];
const FEMALE_FIRST = ["Mary", "Aisha", "Sarah", "Maria", "Mei", "Priya", "Emma", "Fatima", "Yuki", "Olivia", "Sofia", "Nalini", "Anna", "Grace", "Zara"];
const LAST = ["Smith", "Khan", "Johnson", "Garcia", "Li", "Patel", "Brown", "Okafor", "Tanaka", "Muller", "Silva", "Nguyen", "Kim", "Mbeki", "Rossi", "Oba", "Cohen", "Singh"];
const JOB_TITLES = ["Associate", "Specialist", "Engineer", "Senior Engineer", "Manager", "Senior Manager", "Director", "VP", "Analyst", "Lead"];

const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
const NOW = new Date(2026, 0, 1);

async function main() {
  // eslint-disable-next-line no-console
  console.log("Clearing existing data...");
  await prisma.salary.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.$executeRawUnsafe("ALTER TABLE employees AUTO_INCREMENT = 1");
  await prisma.$executeRawUnsafe("ALTER TABLE salaries AUTO_INCREMENT = 1");

  // eslint-disable-next-line no-console
  console.log("Inserting countries & departments...");
  await prisma.country.createMany({
    data: COUNTRIES.map((c) => ({
      code: c.code, name: c.name, currencyCode: c.currencyCode,
      currencySymbol: c.currencySymbol, fxToUsd: c.fxToUsd,
    })),
  });
  await prisma.department.createMany({ data: DEPARTMENTS.map((name) => ({ name })) });

  const countries = await prisma.country.findMany();
  const departments = await prisma.department.findMany();

  const TOTAL = 10000;
  // eslint-disable-next-line no-console
  console.log(`Generating ${TOTAL} employees...`);
  const employeesData: {
    employeeCode: string; firstName: string; lastName: string; email: string;
    gender: string; dateOfBirth: Date; hireDate: Date; jobTitle: string;
    countryId: number; departmentId: number; managerId: number | null;
  }[] = [];

  const usedEmails = new Set<string>();
  for (let i = 0; i < TOTAL; i++) {
    const gender = pick(GENDERS as unknown as string[]);
    const firstPool = gender === "MALE" ? MALE_FIRST : gender === "FEMALE" ? FEMALE_FIRST : [...MALE_FIRST, ...FEMALE_FIRST];
    const first = pick(firstPool);
    const last = pick(LAST);
    let email = `${first}.${last}${i}`.toLowerCase().replace(/[^a-z0-9.]/g, "") + "@acme.example";
    while (usedEmails.has(email)) email = email.replace("@", `${i}@`);
    usedEmails.add(email);

    const country = pick(countries);
    const department = pick(departments);
    const hireDate = new Date(2014 + intBetween(0, 11), intBetween(0, 11), intBetween(1, 28));
    const dob = new Date(hireDate.getFullYear() - intBetween(22, 58), intBetween(0, 11), intBetween(1, 28));
    const managerId = i > 0 && rand() < 0.85 ? intBetween(1, i) : null;

    employeesData.push({
      employeeCode: `EMP${(i + 1).toString().padStart(5, "0")}`,
      firstName: first, lastName: last, email, gender,
      dateOfBirth: dob, hireDate, jobTitle: pick(JOB_TITLES),
      countryId: country.id, departmentId: department.id, managerId,
    });
  }

  for (let i = 0; i < employeesData.length; i += 1000) {
    await prisma.employee.createMany({ data: employeesData.slice(i, i + 1000) });
  }

  // eslint-disable-next-line no-console
  console.log("Generating salaries...");
  const salariesData: {
    employeeId: number; amount: number; currencyCode: string;
    payFrequency: string; effectiveFrom: Date; effectiveTo: Date | null;
  }[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const emp = employeesData[i];
    const countryIdx = countries.findIndex((c) => c.id === emp.countryId);
    const country = COUNTRIES[countryIdx];
    const seniorityYears = NOW.getFullYear() - emp.hireDate.getFullYear();
    const factor = between(0.7, 1.7) * (1 + seniorityYears * 0.04);
    const annualLocal = country.baseLocal * factor;

    const totalSteps = intBetween(1, 3);
    const span = NOW.getTime() - emp.hireDate.getTime();
    for (let h = 0; h < totalSteps; h++) {
      const frac = totalSteps === 1 ? 1 : h / (totalSteps - 1);
      const effMs = emp.hireDate.getTime() + frac * span;
      const effectiveFrom = new Date(effMs);
      const isCurrent = h === totalSteps - 1;
      const stepAmount = Math.round(annualLocal * (0.8 + frac * 0.2));
      const monthly = rand() < 0.7;
      salariesData.push({
        employeeId: i + 1,
        amount: monthly ? Math.round(stepAmount / 12) : stepAmount,
        currencyCode: country.currencyCode,
        payFrequency: monthly ? "MONTHLY" : "ANNUAL",
        effectiveFrom,
        effectiveTo: isCurrent ? null : new Date(NOW.getTime() - 1),
      });
    }
  }

  for (let i = 0; i < salariesData.length; i += 2000) {
    await prisma.salary.createMany({ data: salariesData.slice(i, i + 2000) });
  }

  const counts = await prisma.employee.count();
  const salaryCount = await prisma.salary.count();
  // eslint-disable-next-line no-console
  console.log(`Done. Employees: ${counts}, Salaries: ${salaryCount}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
