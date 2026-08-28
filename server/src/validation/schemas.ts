import { z } from "zod";

export const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
export const payFrequencyEnum = z.enum(["MONTHLY", "ANNUAL"]);

export const salaryInputSchema = z.object({
  amount: z.number().positive(),
  currencyCode: z.string().length(3),
  payFrequency: payFrequencyEnum,
  effectiveFrom: z.string().datetime().optional(),
});

export const employeeCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  gender: genderEnum,
  dateOfBirth: z.string().datetime(),
  hireDate: z.string().datetime(),
  jobTitle: z.string().min(1).max(150),
  countryId: z.number().int().positive(),
  departmentId: z.number().int().positive(),
  managerId: z.number().int().positive().optional().nullable(),
  salary: salaryInputSchema,
});

export const employeeUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  gender: genderEnum.optional(),
  dateOfBirth: z.string().datetime().optional(),
  hireDate: z.string().datetime().optional(),
  jobTitle: z.string().min(1).max(150).optional(),
  countryId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional(),
  managerId: z.number().int().positive().nullable().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const signupSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(25),
  search: z.string().optional(),
  countryId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  gender: genderEnum.optional(),
  minUsd: z.coerce.number().positive().optional(),
  maxUsd: z.coerce.number().positive().optional(),
  sort: z
    .enum(["name", "hireDate", "jobTitle", "country", "department"])
    .default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
export type SalaryInput = z.infer<typeof salaryInputSchema>;
