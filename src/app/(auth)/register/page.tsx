import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { isGoogleAuthEnabled } from "@/lib/env";
import { safeCallbackUrl } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Регистрация" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const next = safeCallbackUrl(callbackUrl, "") || undefined;
  return <RegisterForm googleEnabled={isGoogleAuthEnabled} callbackUrl={next} />;
}
