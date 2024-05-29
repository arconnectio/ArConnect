import { useEffect, useRef } from "react";

export function usePatchWorker() {
  const initialWorkerRef = useRef<typeof Worker | null>(window.Worker);

  useEffect(() => {
    if (window.Worker && !initialWorkerRef.current) {
      initialWorkerRef.current = window.Worker;
    }

    if (!window.Worker && initialWorkerRef.current) {
      window.Worker = initialWorkerRef.current;
    }
  }, [window.Worker]);
}
