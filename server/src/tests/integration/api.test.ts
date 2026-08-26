import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prisma } from "../../lib/prisma";

const app = createApp();

async function login(): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username: "hrmanager", password: "hr@2026!" });
  expect(res.status).toBe(200);
  return res.body.token;
}

let token: string;
let countryId: number;
let departmentId: number;

beforeAll(async () => {
  await prisma.salary.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.country.deleteMany({});

  const country = await prisma.country.create({
    data: { code: "US", name: "United States", currencyCode: "USD", currencySymbol: "$", fxToUsd: 1 },
  });
  const dept = await prisma.department.create({ data: { name: "Engineering" } });
  countryId = country.id;
  departmentId = dept.id;

  // Two employees with known salaries for deterministic report assertions.
  await prisma.employee.create({
    data: {
      employeeCode: "EMP00001",
      firstName: "Alice", lastName: "Test", email: "alice@acme.example",
      gender: "FEMALE", dateOfBirth: new Date("1990-01-01"), hireDate: new Date("2020-01-01"),
      jobTitle: "Engineer", countryId, departmentId, managerId: null,
      salaries: { create: { amount: 10000, currencyCode: "USD", payFrequency: "MONTHLY", effectiveFrom: new Date("2020-01-01") } },
    },
  });
  await prisma.employee.create({
    data: {
      employeeCode: "EMP00002",
      firstName: "Bob", lastName: "Test", email: "bob@acme.example",
      gender: "MALE", dateOfBirth: new Date("1988-01-01"), hireDate: new Date("2019-01-01"),
      jobTitle: "Manager", countryId, departmentId, managerId: null,
      salaries: { create: { amount: 20000, currencyCode: "USD", payFrequency: "MONTHLY", effectiveFrom: new Date("2019-01-01") } },
    },
  });

  token = await login();
});

afterAll(async () => {
  await prisma.salary.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.$disconnect();
});

describe("auth", () => {
  it("rejects invalid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "hrmanager", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("requires a token for protected routes", async () => {
    const res = await request(app).get("/api/employees");
    expect(res.status).toBe(401);
  });
});

describe("reference", () => {
  it("returns countries and departments", async () => {
    const res = await request(app).get("/api/reference");
    expect(res.status).toBe(200);
    expect(res.body.countries.length).toBeGreaterThan(0);
    expect(res.body.departments.length).toBeGreaterThan(0);
  });
});

describe("employees", () => {
  let createdId: number;

  it("lists employees with pagination", async () => {
    const res = await request(app).get("/api/employees?pageSize=10").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.length).toBe(2);
  });

  it("creates an employee with salary", async () => {
    const res = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Carol", lastName: "New", email: "carol@acme.example",
        gender: "FEMALE", dateOfBirth: "1992-05-05T00:00:00.000Z", hireDate: "2021-05-05T00:00:00.000Z",
        jobTitle: "Analyst", countryId, departmentId, managerId: null,
        salary: { amount: 15000, currencyCode: "USD", payFrequency: "MONTHLY" },
      });
    expect(res.status).toBe(201);
    expect(res.body.currentSalary.annualUsd).toBe(180000);
    createdId = res.body.id;
  });

  it("records a salary change and keeps history", async () => {
    const before = await request(app).get(`/api/employees/${createdId}`).set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .post(`/api/employees/${createdId}/salaries`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 20000, currencyCode: "USD", payFrequency: "MONTHLY" });
    expect(res.status).toBe(201);
    expect(res.body.salaryHistory.length).toBe(before.body.salaryHistory.length + 1);
  });

  it("deletes the created employee", async () => {
    const res = await request(app).delete(`/api/employees/${createdId}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const check = await request(app).get(`/api/employees/${createdId}`).set("Authorization", `Bearer ${token}`);
    expect(check.status).toBe(404);
  });
});

describe("reports", () => {
  it("aggregates payroll across all employees", async () => {
    const res = await request(app).get("/api/reports").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    // Alice 120k + Bob 240k = 360k total annual USD
    expect(res.body.summary.headcount).toBe(2);
    expect(res.body.summary.totalAnnualPayrollUsd).toBe(360000);
    expect(res.body.summary.averageAnnualSalaryUsd).toBe(180000);
    expect(res.body.byCountry[0].name).toBe("United States");
    expect(res.body.genderGapSummary.available).toBe(true);
    expect(res.body.genderGapSummary.gapUsd).toBe(120000);
  });
});
