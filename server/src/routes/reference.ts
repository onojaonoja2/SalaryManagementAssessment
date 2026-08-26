import { Router } from "express";
import { prisma } from "../lib/prisma";
import { wrap } from "../lib/asyncHandler";

const router = Router();

router.get(
  "/",
  wrap(async (_req, res) => {
    const [countries, departments] = await Promise.all([
      prisma.country.findMany({ orderBy: { name: "asc" } }),
      prisma.department.findMany({ orderBy: { name: "asc" } }),
    ]);
    res.json({
      countries: countries.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        currencyCode: c.currencyCode,
        currencySymbol: c.currencySymbol,
      })),
      departments: departments.map((d) => ({ id: d.id, name: d.name })),
    });
  }),
);

export default router;
