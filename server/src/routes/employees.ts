import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../lib/asyncHandler";
import { audit } from "../lib/audit";
import { AppError } from "../lib/errors";
import {
  employeeCreateSchema,
  employeeListQuerySchema,
  employeeUpdateSchema,
  salaryInputSchema,
} from "../validation/schemas";
import * as employees from "../services/employees";

const router = Router();
router.use(authMiddleware);

router.get(
  "/",
  wrap(async (req, res) => {
    const parsed = employeeListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }
    res.json(await employees.listEmployees(parsed.data));
  }),
);

router.get(
  "/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new AppError("Invalid id", 400);
    res.json(await employees.getEmployee(id));
  }),
);

router.post(
  "/",
  wrap(async (req, res) => {
    const parsed = employeeCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        400,
      );
    }
    const created = await employees.createEmployee(parsed.data);
    audit("employee_create", { id: created.id, code: created.employeeCode });
    res.status(201).json(created);
  }),
);

router.put(
  "/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new AppError("Invalid id", 400);
    const parsed = employeeUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        400,
      );
    }
    const updated = await employees.updateEmployee(id, parsed.data);
    audit("employee_update", { id });
    res.json(updated);
  }),
);

router.delete(
  "/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new AppError("Invalid id", 400);
    const result = await employees.deleteEmployee(id);
    audit("employee_delete", { id });
    res.json(result);
  }),
);

router.post(
  "/:id/salaries",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new AppError("Invalid id", 400);
    const parsed = salaryInputSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid salary", 400);
    }
    const updated = await employees.addSalary(id, parsed.data);
    audit("salary_change", { id });
    res.status(201).json(updated);
  }),
);

export default router;
