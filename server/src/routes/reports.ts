import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../lib/asyncHandler";
import { getReportData } from "../services/reports";

const router = Router();
router.use(authMiddleware);

router.get(
  "/",
  wrap(async (_req, res) => {
    res.json(await getReportData());
  }),
);

export default router;
