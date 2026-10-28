import express from "express";
import type { HealthResponse } from "@workspace/shared";

import { checkDatabase } from "./db";
import { env } from "./env";
import { authRouter } from "./auth/routes";

const app = express();

app.use(express.json({ limit: "10kb" }));

app.use("/api/auth", authRouter);

app.get("/api/health", async (_req, res) => {
  const database = await checkDatabase();

  const body: HealthResponse = {
    status: database === "up" ? "ok" : "degraded",
    database,
    timestamp: new Date().toISOString(),
  };

  res.json(body);
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
