import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { num, round2 } from "../lib/numeric";
import type {
  EmployeeCreateInput,
  EmployeeListQuery,
  EmployeeUpdateInput,
  SalaryInput,
} from "../validation/schemas";

function toIso(d: Date): string {
  return d.toISOString();
}

async function currentSalaryView(employeeId: number) {
  const rows = await prisma.$queryRaw<{
    amount: unknown;
    payFrequency: string;
    fxToUsd: unknown;
    currencyCode: string;
    effectiveFrom: Date;
  }[]>`
    SELECT s.amount, s.currency_code AS currencyCode, s.pay_frequency AS payFrequency,
           c.fx_to_usd AS fxToUsd, s.effective_from AS effectiveFrom
    FROM salaries s
    JOIN employees e ON e.id = s.employee_id
    JOIN countries c ON c.id = e.country_id
    WHERE s.employee_id = ${employeeId} AND s.effective_to IS NULL
    ORDER BY s.effective_from DESC
    LIMIT 1`;
  if (rows.length === 0) return null;
  const salary = rows[0];
  const fx = num(salary.fxToUsd);
  const annualLocal =
    salary.payFrequency === "MONTHLY" ? num(salary.amount) * 12 : num(salary.amount);
  return {
    amount: num(salary.amount),
    currencyCode: salary.currencyCode,
    payFrequency: salary.payFrequency,
    effectiveFrom: toIso(salary.effectiveFrom),
    annualUsd: round2(annualLocal * fx),
  };
}

export async function listEmployees(query: EmployeeListQuery) {
  const where: Record<string, unknown> = {};
  if (query.search) {
    const s = query.search;
    where.OR = [
      { firstName: { contains: s } },
      { lastName: { contains: s } },
      { email: { contains: s } },
      { employeeCode: { contains: s } },
    ];
  }
  if (query.countryId) where.countryId = query.countryId;
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.gender) where.gender = query.gender;

  if (query.minUsd != null || query.maxUsd != null) {
    const ids = await prisma.$queryRaw<{ employeeId: number }[]>`
      SELECT s.employee_id AS employeeId
      FROM salaries s
      JOIN employees e ON e.id = s.employee_id
      JOIN countries c ON c.id = e.country_id
      WHERE s.effective_to IS NULL
        AND (s.amount * c.fx_to_usd * CASE s.pay_frequency WHEN 'MONTHLY' THEN 12 ELSE 1 END)
            BETWEEN ${query.minUsd ?? 0} AND ${query.maxUsd ?? 1e12}`;
    where.id = { in: ids.map((r) => r.employeeId) };
  }

  const orderBy: Record<string, string> = { asc: query.order };
  const sortMap: Record<string, unknown> = {
    name: { firstName: query.order },
    hireDate: { hireDate: query.order },
    jobTitle: { jobTitle: query.order },
    country: { country: { name: query.order } },
    department: { department: { name: query.order } },
  };
  const order = sortMap[query.sort] ?? { firstName: "asc" };

  const [total, rows] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: order as any,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        country: true,
        department: true,
        salaries: { where: { effectiveTo: null }, take: 1 },
      },
    }),
  ]);

  const data = await Promise.all(
    rows.map(async (e) => ({
      id: e.id,
      employeeCode: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      gender: e.gender,
      dateOfBirth: toIso(e.dateOfBirth),
      hireDate: toIso(e.hireDate),
      jobTitle: e.jobTitle,
      managerId: e.managerId,
      country: { id: e.country.id, name: e.country.name, code: e.country.code },
      department: { id: e.department.id, name: e.department.name },
      currentSalary: e.salaries[0]
        ? {
            amount: num(e.salaries[0].amount),
            currencyCode: e.salaries[0].currencyCode,
            payFrequency: e.salaries[0].payFrequency,
          }
        : null,
    })),
  );

  return {
    data,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getEmployee(id: number) {
  const e = await prisma.employee.findUnique({
    where: { id },
    include: {
      country: true,
      department: true,
      manager: { select: { id: true, firstName: true, lastName: true } },
      salaries: { orderBy: { effectiveFrom: "desc" } },
    },
  });
  if (!e) throw new AppError("Employee not found", 404);

  const current = await currentSalaryView(id);
  return {
    id: e.id,
    employeeCode: e.employeeCode,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    gender: e.gender,
    dateOfBirth: toIso(e.dateOfBirth),
    hireDate: toIso(e.hireDate),
    jobTitle: e.jobTitle,
    managerId: e.managerId,
    manager: e.manager,
    country: { id: e.country.id, name: e.country.name, code: e.country.code },
    department: { id: e.department.id, name: e.department.name },
    currentSalary: current,
    salaryHistory: e.salaries.map((s) => ({
      id: s.id,
      amount: num(s.amount),
      currencyCode: s.currencyCode,
      payFrequency: s.payFrequency,
      effectiveFrom: toIso(s.effectiveFrom),
      effectiveTo: s.effectiveTo ? toIso(s.effectiveTo) : null,
    })),
  };
}

async function ensureRefsExist(countryId: number, departmentId: number) {
  const [country, department] = await Promise.all([
    prisma.country.findUnique({ where: { id: countryId } }),
    prisma.department.findUnique({ where: { id: departmentId } }),
  ]);
  if (!country) throw new AppError("Country not found", 400);
  if (!department) throw new AppError("Department not found", 400);
}

export async function createEmployee(input: EmployeeCreateInput) {
  await ensureRefsExist(input.countryId, input.departmentId);
  if (input.managerId) {
    const mgr = await prisma.employee.findUnique({ where: { id: input.managerId } });
    if (!mgr) throw new AppError("Manager not found", 400);
  }
  const count = await prisma.employee.count();
  const employeeCode = `EMP${(count + 1).toString().padStart(5, "0")}`;

  const employee = await prisma.$transaction(async (tx) => {
    const created = await tx.employee.create({
      data: {
        employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        gender: input.gender,
        dateOfBirth: new Date(input.dateOfBirth),
        hireDate: new Date(input.hireDate),
        jobTitle: input.jobTitle,
        countryId: input.countryId,
        departmentId: input.departmentId,
        managerId: input.managerId ?? null,
      },
    });
    await tx.salary.create({
      data: {
        employeeId: created.id,
        amount: input.salary.amount,
        currencyCode: input.salary.currencyCode,
        payFrequency: input.salary.payFrequency,
        effectiveFrom: input.salary.effectiveFrom
          ? new Date(input.salary.effectiveFrom)
          : new Date(),
      },
    });
    return created;
  });
  return getEmployee(employee.id);
}

export async function updateEmployee(id: number, input: EmployeeUpdateInput) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new AppError("Employee not found", 404);
  if (input.countryId || input.departmentId) {
    await ensureRefsExist(
      input.countryId ?? existing.countryId,
      input.departmentId ?? existing.departmentId,
    );
  }
  if (input.managerId != null) {
    if (input.managerId === id) throw new AppError("Employee cannot manage themselves", 400);
    const mgr = await prisma.employee.findUnique({ where: { id: input.managerId } });
    if (!mgr) throw new AppError("Manager not found", 400);
  }
  await prisma.employee.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
      jobTitle: input.jobTitle,
      countryId: input.countryId,
      departmentId: input.departmentId,
      managerId: input.managerId === undefined ? undefined : input.managerId,
    },
  });
  return getEmployee(id);
}

export async function deleteEmployee(id: number) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new AppError("Employee not found", 404);
  await prisma.employee.delete({ where: { id } });
  return { success: true };
}

export async function addSalary(id: number, input: SalaryInput) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new AppError("Employee not found", 404);
  const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();

  await prisma.$transaction(async (tx) => {
    const current = await tx.salary.findFirst({
      where: { employeeId: id, effectiveTo: null },
      orderBy: { effectiveFrom: "desc" },
    });
    if (current) {
      await tx.salary.update({
        where: { id: current.id },
        data: { effectiveTo: effectiveFrom },
      });
    }
    await tx.salary.create({
      data: {
        employeeId: id,
        amount: input.amount,
        currencyCode: input.currencyCode,
        payFrequency: input.payFrequency,
        effectiveFrom,
      },
    });
  });
  return getEmployee(id);
}
