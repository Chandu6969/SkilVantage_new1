"use client";

import { useCallback, useEffect, useState } from "react";

export function useChallenge() {
  const [token, setToken] = useState("");
  const [question, setQuestion] = useState("Loading the spam check…");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/v1/form-challenge", { cache: "no-store" });
      const data = (await response.json()) as { token?: string; question?: string };
      if (!response.ok || !data.token || !data.question) throw new Error("missing");
      setToken(data.token);
      setQuestion(data.question);
      setAnswer("");
    } catch {
      setToken("");
      setQuestion("");
      setError("The spam check could not load.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { token, question, answer, setAnswer, error, refresh };
}
