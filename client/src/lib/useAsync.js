import { useState } from "react";

// Tracks loading + error for any async action: const { loading, error, run } = useAsync();
export default function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(fn) {
    setLoading(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, run };
}
