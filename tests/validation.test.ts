import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyOtpSchema, resetPasswordSchema } from "@/lib/validations/phone-auth";
import { credentialsSchema, registerSchema } from "@/lib/validations/auth";
import { enrollmentDocumentSchema } from "@/lib/validations/enrollment";

test("OTP code: six digits pass, anything else fails", () => {
  const base = { phone: "+993 65 12 34 56" };
  assert.equal(verifyOtpSchema.safeParse({ ...base, code: "123456" }).success, true);
  assert.equal(verifyOtpSchema.safeParse({ ...base, code: " 012345 " }).success, true);
  // Regression: the pattern used to collapse to /^d{6}$/.
  assert.equal(verifyOtpSchema.safeParse({ ...base, code: "dddddd" }).success, false);
  assert.equal(verifyOtpSchema.safeParse({ ...base, code: "12345" }).success, false);
  assert.equal(verifyOtpSchema.safeParse({ ...base, code: "1234567" }).success, false);
});

test("OTP schema normalises the phone number", () => {
  const parsed = verifyOtpSchema.parse({ phone: "8 65 123456", code: "000000" });
  assert.equal(parsed.phone, "99365123456");
});

test("password reset requires matching passwords and a valid code", () => {
  const ok = { phone: "65123456", code: "111111", password: "secret123", confirmPassword: "secret123" };
  assert.equal(resetPasswordSchema.safeParse(ok).success, true);
  assert.equal(resetPasswordSchema.safeParse({ ...ok, confirmPassword: "other123" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ ...ok, code: "abcdef" }).success, false);
});

test("password login accepts an email or a phone number", () => {
  assert.deepEqual(credentialsSchema.parse({ login: "  Parent@Mail.COM ", password: "x" }).login, {
    email: "parent@mail.com",
  });
  assert.deepEqual(credentialsSchema.parse({ login: "+993 65 12-34-56", password: "x" }).login, {
    phone: "99365123456",
  });
  assert.equal(credentialsSchema.safeParse({ login: "not an email@", password: "x" }).success, false);
  assert.equal(credentialsSchema.safeParse({ login: "12", password: "x" }).success, false);
  assert.equal(credentialsSchema.safeParse({ login: "a@b.co", password: "" }).success, false);
});

test("registration lower-cases the email and caps the password at bcrypt's limit", () => {
  const base = { name: "Айгуль", email: "Mom@Example.com", password: "password1", confirmPassword: "password1" };
  assert.equal(registerSchema.parse(base).email, "mom@example.com");
  const long = "a".repeat(73);
  assert.equal(registerSchema.safeParse({ ...base, password: long, confirmPassword: long }).success, false);
});

test("enrollment document must reference an uploaded key", () => {
  const key = "3f1c2b4a-1234-4abc-8def-0123456789ab.pdf";
  assert.equal(enrollmentDocumentSchema.safeParse({ documentNumber: "I-AŞ 123", documentFile: key }).success, true);
  assert.equal(
    enrollmentDocumentSchema.safeParse({ documentNumber: "I-AŞ 123", documentFile: "../../etc/passwd" }).success,
    false
  );
  assert.equal(enrollmentDocumentSchema.safeParse({ documentNumber: "1", documentFile: key }).success, false);
  assert.equal(enrollmentDocumentSchema.safeParse({ documentNumber: null, documentFile: null }).success, false);
});
