import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../lib/asyncHandler";
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
    res.status(201).json(await employees.createEmployee(parsed.data));
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
    res.json(await employees.updateEmployee(id, parsed.data));
  }),
);

router.delete(
  "/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new AppError("Invalid id", 400);
    res.json(await employees.deleteEmployee(id));
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
    res.status(201).json(await employees.addSalary(id, parsed.data));
  }),
);

export default router;
