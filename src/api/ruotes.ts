import { Router, Request, Response } from "express";

export function createTransactionRoutes(): Router {
  const router = Router();
  router.post("/upload", (req: Request, res: Response) => res.status(200));
  router.post("/", (req: Request, res: Response) => res.status(200));
  router.get("/", (req: Request, res: Response) => res.status(200));
  router.get("/:id", (req: Request, res: Response) => res.status(200));

  return router;
}
