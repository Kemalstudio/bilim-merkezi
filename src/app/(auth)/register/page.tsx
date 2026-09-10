import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { isGoogleAuthEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return <RegisterForm googleEnabled={isGoogleAuthEnabled} />;
}
