"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const password = String(new FormData(event.currentTarget).get("password") || "");
    const response = await fetch("/api/v1/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Sign-in failed.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <Link href="/"><Logo /></Link>
      <h1 className="mt-8 text-4xl text-ink">Career team desk</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        This desk is for the SkilVantage career team. Access uses a password stored as a secret, not in the website code. Registrations are saved even when sign-in is not configured yet.
      </p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label className="field">Admin or counsellor password
          <input name="password" type="password" autoComplete="current-password" required minLength={8} />
        </label>
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-ink text-paper disabled:opacity-60">
          {pending ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
