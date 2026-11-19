"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_CLASS_PAY } from "@/lib/faculty";
import { programChoices } from "@/lib/palette";
import type { Faculty } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#14211c] outline-none";

export function TeacherForm({ teacher, onSaved }: { teacher?: Faculty; onSaved?: (teacher: Faculty) => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(teacher?.fullName || "");
  const [phone, setPhone] = useState(teacher?.phone || "");
  const [email, setEmail] = useState(teacher?.email || "");
  const [course, setCourse] = useState(teacher?.course || programChoices[0].slug);
  const [rate, setRate] = useState(String(teacher?.rate || DEFAULT_CLASS_PAY));
  const [note, setNote] = useState(teacher?.note || "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(teacher ? `/api/v1/admin/faculty/${teacher.id}` : "/api/v1/admin/faculty", {
      method: teacher ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, email, course, rate: Number(rate), note }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; teacher?: Faculty };
    setPending(false);
    if (!response.ok || !data.ok || !data.teacher) {
      setError(data.error || "Could not save the teacher.");
      return;
    }
    if (onSaved) {
      onSaved(data.teacher);
      router.refresh();
      return;
    }
    router.push(`/admin/teacher/${data.teacher.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-3xl bg-[#f4fbf6] p-4 text-[#14211c] sm:grid-cols-2">
      <label className="text-sm">Name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className={field} /></label>
      <label className="text-sm">Phone<input required value={phone} onChange={(event) => setPhone(event.target.value)} className={field} /></label>
      <label className="text-sm">Email<input value={email} onChange={(event) => setEmail(event.target.value)} className={field} /></label>
      <label className="text-sm">Course
        <select value={course} onChange={(event) => setCourse(event.target.value as Faculty["course"])} className={field}>
          {programChoices.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="text-sm">Pay per class, in rupees<input required value={rate} onChange={(event) => setRate(event.target.value)} inputMode="numeric" className={field} /></label>
      <label className="text-sm">Note<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Weekday evenings" className={field} /></label>
      {error ? <p className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
      <button type="submit" disabled={pending} className="h-11 rounded-xl bg-[#065f46] text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit sm:px-5">
        {pending ? "Saving…" : teacher ? "Save teacher" : "Save and open teacher"}
      </button>
    </form>
  );
}
