import { useEffect, useRef, useState } from "react";
import type { GenerateRequest } from "../contract/api.schema.js";
import type { ApiClient, ClientFailure } from "../store/api-client.js";
import type { WorldVersion } from "../store/types.js";
import { checkGenerated } from "./check-generated.js";

export function useGeneration(
  api: ApiClient,
  onReady: (version: WorldVersion) => void,
  onFailure: () => void,
) {
  const [phase, setPhase] = useState<"idle" | "requesting" | "checking">("idle");
  const [failure, setFailure] = useState<ClientFailure | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pending = useRef(false);
  const sequence = useRef(0);
  const started = useRef(0);
  const lastRequest = useRef<GenerateRequest | null>(null);

  useEffect(() => {
    let current = true;
    void api.health().then((result) => {
      if (current && result.ok) setModelId(result.data.modelId);
    });
    return () => {
      current = false;
    };
  }, [api]);

  useEffect(() => {
    if (phase === "idle") return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started.current) / 1000));
    }, 250);
    return () => {
      clearInterval(timer);
    };
  }, [phase]);

  function clear() {
    sequence.current += 1;
    pending.current = false;
    setPhase("idle");
    setFailure(null);
  }

  async function submit(request: GenerateRequest) {
    if (pending.current) return;
    pending.current = true;
    const id = ++sequence.current;
    lastRequest.current = request;
    started.current = Date.now();
    setElapsed(0);
    setFailure(null);
    setPhase("requesting");
    try {
      const response = await api.generate(request);
      if (sequence.current !== id) return;
      if (!response.ok) {
        setFailure(response.failure);
        onFailure();
        return;
      }
      setPhase("checking");
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
      if (sequence.current !== id) return;
      const checked = checkGenerated(response.data);
      if (checked.ok) onReady(checked.data);
      else {
        setFailure(checked.failure);
        onFailure();
      }
    } catch {
      if (sequence.current !== id) return;
      setFailure({
        code: "INTERNAL",
        message: "The world could not be opened. Retry or open the example world.",
        retryable: true,
        suggestion: null,
        status: null,
      });
      onFailure();
    } finally {
      if (sequence.current === id) {
        pending.current = false;
        setPhase("idle");
      }
    }
  }

  function retry() {
    if (lastRequest.current) void submit(lastRequest.current);
  }

  return { phase, failure, modelId, elapsed, submit, retry, clear };
}
