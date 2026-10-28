import { useEffect, useState } from "react";

import type { HealthResponse } from "@workspace/shared";

/**
 * A discriminated union beats three separate booleans: the compiler
 * knows `data` only exists in the "loaded" case, so you cannot read it
 * while still loading.
 */
type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; data: HealthResponse };

export default function App() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    // StrictMode mounts effects twice in development. Aborting on cleanup
    // stops the first, discarded fetch from resolving into state.
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/health", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        // A cast, not a guarantee: nothing validates the body at runtime
        // yet. Parsing this with Zod is a later improvement.
        const data = (await response.json()) as HealthResponse;
        setState({ kind: "loaded", data });
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState({
          kind: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    void load();

    return () => controller.abort();
  }, []);

  return (
    <main style={{ padding: "2rem", minWidth: "22rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Team Workspace</h1>

      {state.kind === "loading" && <p>Checking API health…</p>}

      {state.kind === "error" && (
        <p style={{ color: "#b00020" }}>Could not reach the API: {state.message}</p>
      )}

      {state.kind === "loaded" && (
        <dl
          style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem" }}
        >
          <dt>Status</dt>
          <dd style={{ margin: 0 }}>{state.data.status}</dd>

          <dt>Database</dt>
          <dd style={{ margin: 0 }}>{state.data.database}</dd>

          <dt>Checked at</dt>
          <dd style={{ margin: 0 }}>{state.data.timestamp}</dd>
        </dl>
      )}
    </main>
  );
}
