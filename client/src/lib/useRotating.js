import { useEffect, useState } from "react";

// Steps through a list of messages while `active` is true, stopping on the last one
export default function useRotating(items, active, ms = 2400) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setIndex((i) => Math.min(i + 1, items.length - 1)), ms);
    return () => {
      clearInterval(id);
      setIndex(0);
    };
  }, [active, items.length, ms]);

  return items[Math.min(index, items.length - 1)];
}
