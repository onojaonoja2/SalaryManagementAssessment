import type { Request, Response, NextFunction } from "express";

type Handler = (req: Request, res: Response) => Promise<void> | void;

export function wrap(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}
