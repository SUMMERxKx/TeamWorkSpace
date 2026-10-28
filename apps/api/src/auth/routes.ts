import { Router } from "express";
import { z } from "zod";

import type { PublicUser } from "@workspace/shared";

import { pool } from "../db";
import { hashPassword } from "./password";

const registerSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(1).max(60),
});

/** Postgres raises 23505 when a unique constraint is violated. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "invalid_body",
      issues: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  const { email, password, displayName } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at`,
      [email, passwordHash, displayName],
    );

    const row = result.rows[0];

    const user: PublicUser = {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      createdAt: row.created_at.toISOString(),
    };

    res.status(201).json(user);
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "email_taken" });
      return;
    }
    throw error;
  }
});
