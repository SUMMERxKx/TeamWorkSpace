/**
 * Shape returned by GET /api/health.
 *
 * Both the API and the web app import this, so a change here is a
 * compile error on whichever side forgets to keep up. That is the
 * point of putting it in a shared package.
 */
export type HealthResponse = {
  status: "ok" | "degraded";
  database: "up" | "down";
  timestamp: string;
};
