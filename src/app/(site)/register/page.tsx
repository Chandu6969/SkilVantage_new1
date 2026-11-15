import type { Metadata } from "next";
import { RegisterWizard } from "@/components/register-wizard";

export const metadata: Metadata = {
  title: "Register",
  description: "Register with SkilVantage as a student, fresher, or working professional for Data, AI, ML, Generative AI or Agentic AI training.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; program?: string; focus?: string }>;
}) {
  const params = await searchParams;
  return <RegisterWizard initialType={params.type} initialProgram={params.program} focus={params.focus} />;
}
