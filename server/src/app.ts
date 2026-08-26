import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import employeeRoutes from "./routes/employees";
import reportRoutes from "./routes/reports";
import referenceRoutes from "./routes/reference";
import { AppError } from "./lib/errors";

dotenv.config();

export function createApp(): Express {
  const app = express();
  app.use(
    cors({
      origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(","),
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/reference", referenceRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/reports", reportRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  // Centralized error handler.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        res.status(409).json({ error: "A record with this unique value already exists" });
        return;
      }
      if (code === "P2003") {
        res.status(400).json({ error: "Referenced record does not exist" });
        return;
      }
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
