"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createFhevmInstance } from "../fhevm/internal/fhevm";

export function useFhevm(provider: any, chainId?: number) {
  const [instance, setInstance] = useState<any | undefined>(undefined);
  const [status, setStatus] = useState<"idle"|"loading"|"ready"|"error">("idle");
  const [error, setError] = useState<Error|undefined>(undefined);
  const abortRef = useRef<AbortController|undefined>(undefined);

  const refresh = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setInstance(undefined);
    setError(undefined);
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (!provider) return;
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        const inst = await createFhevmInstance(provider);
        if (!cancelled) {
          setInstance(inst);
          setStatus("ready");
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e);
          setStatus("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [provider, chainId]);

  return { instance, status, error, refresh };
}



