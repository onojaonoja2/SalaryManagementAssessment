import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import employeeRoutes from "./routes/employees";
import reportRoutes from "./routes/reports";
import referenceRoutes from "./routes/reference";
import { AppError } from "./lib/errors";

dotenv.config();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export function createApp(): Express {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow same-origin (no Origin header) and explicitly configured origins only.
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );

  // Global rate limiter (per IP).
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  // Strict limiter on authentication to slow brute force / credential stuffing.
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts, please try again later." },
  });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/reference", referenceRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/reports", reportRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  // Centralized error handler. Logs only a redacted message — never raw errors/SQL/values.
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
    console.error("[error]", err instanceof Error ? err.message : "unknown error");
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
