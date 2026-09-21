import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPhone, maskPhone, normalizePhone, realEmail, placeholderEmail } from "@/lib/phone";
import { detectAllowedType, detectFileType } from "@/lib/file-signature";
import { applyPromo, isPromoUsable } from "@/lib/pricing";
import { safeCallbackUrl } from "@/lib/safe-redirect";

test("normalizePhone handles the formats parents type", () => {
  assert.equal(normalizePhone("+993 65 12 34 56"), "99365123456");
  assert.equal(normalizePhone("8 65 123456"), "99365123456");
  assert.equal(normalizePhone("65-12-34-56"), "99365123456");
  assert.equal(normalizePhone("993 71 123456"), "99371123456");
  assert.equal(normalizePhone("123"), null);
  assert.equal(normalizePhone(""), null);
});

test("normalizePhone accepts only serviced Turkmen numbers", () => {
  // Every operator prefix in service.
  for (const prefix of ["61", "62", "63", "64", "65", "71", "72"]) {
    assert.equal(normalizePhone(`+993 ${prefix} 123456`), `993${prefix}123456`);
  }
  // Prefixes that no operator uses.
  assert.equal(normalizePhone("+993 66 123456"), null);
  assert.equal(normalizePhone("+993 12 123456"), null);
  assert.equal(normalizePhone("+993 73 123456"), null);
  // Foreign numbers cannot receive our SMS.
  assert.equal(normalizePhone("+7 912 345 67 89"), null);
  assert.equal(normalizePhone("+90 532 123 45 67"), null);
  // Wrong number of subscriber digits.
  assert.equal(normalizePhone("+993 65 12345"), null);
  assert.equal(normalizePhone("+993 65 1234567"), null);
});

test("phone display helpers", () => {
  assert.equal(formatPhone("99365123456"), "+993 65 12 34 56");
  assert.equal(maskPhone("99365123456"), "+993 65 •• •• 56");
  assert.equal(realEmail(placeholderEmail("99365123456")), null);
  assert.equal(realEmail("mom@example.com"), "mom@example.com");
  assert.equal(realEmail(null), null);
});

const padded = (values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)]);
const bytes = (...values: number[]) => padded(values);
const text = (value: string) => padded([...Buffer.from(value)]);

test("file type comes from the bytes, not the name", () => {
  assert.equal(detectFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext, "png");
  assert.equal(detectFileType(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext, "jpg");
  assert.equal(detectFileType(text("%PDF-1.7"))?.ext, "pdf");
  assert.equal(detectFileType(text("<html><script>alert(1)</script>")), null);
  assert.equal(detectFileType(text('<svg xmlns="http://www.w3.org/2000/svg">')), null);
});

test("detectAllowedType enforces the allow-list", () => {
  const disguised = { name: "cover.png", type: "image/png" };
  assert.equal(detectAllowedType(text("<html>"), ["png", "jpg"], disguised), null);
  assert.equal(detectAllowedType(text("%PDF-1.4"), ["png", "jpg"], disguised), null);
  assert.equal(detectAllowedType(text("%PDF-1.4"), ["pdf"], disguised)?.ext, "pdf");

  const zip = bytes(0x50, 0x4b, 0x03, 0x04);
  assert.equal(detectAllowedType(zip, ["docx", "zip"], { name: "plan.docx", type: "" })?.ext, "docx");
  assert.equal(detectAllowedType(zip, ["docx", "zip"], { name: "files.zip", type: "application/zip" })?.ext, "zip");
  assert.equal(detectAllowedType(zip, ["pdf"], { name: "plan.docx", type: "" }), null);
});

test("promo codes: percent, fixed, never below zero", () => {
  assert.equal(applyPromo(120, { discountType: "PERCENT", discountValue: 10 }), 108);
  assert.equal(applyPromo(1990, { discountType: "PERCENT", discountValue: "15" }), 1692);
  assert.equal(applyPromo(50, { discountType: "FIXED", discountValue: 20 }), 30);
  assert.equal(applyPromo(50, { discountType: "FIXED", discountValue: 80 }), 0);
  assert.equal(applyPromo(50, { discountType: "PERCENT", discountValue: 100 }), 0);
});

test("promo usability: active, not expired, uses left", () => {
  const now = new Date("2026-09-17T12:00:00Z");
  const promo = {
    active: true,
    expiresAt: null,
    maxUses: 5,
    usedCount: 4,
    discountType: "PERCENT" as const,
    discountValue: 10,
  };
  assert.equal(isPromoUsable(promo, now), true);
  assert.equal(isPromoUsable({ ...promo, usedCount: 5 }, now), false);
  assert.equal(isPromoUsable({ ...promo, active: false }, now), false);
  assert.equal(isPromoUsable({ ...promo, expiresAt: new Date("2026-09-01") }, now), false);
  assert.equal(isPromoUsable({ ...promo, maxUses: null, usedCount: 999 }, now), true);
  assert.equal(isPromoUsable(null, now), false);
});

test("safeCallbackUrl only allows same-site paths", () => {
  assert.equal(safeCallbackUrl("/courses/math", "/account"), "/courses/math");
  assert.equal(safeCallbackUrl("//evil.com", "/account"), "/account");
  assert.equal(safeCallbackUrl("/\\evil.com", "/account"), "/account");
  assert.equal(safeCallbackUrl("https://evil.com", "/account"), "/account");
  assert.equal(safeCallbackUrl(null, "/account"), "/account");
  assert.equal(safeCallbackUrl("/account", "/bilim/admin", "/bilim/admin"), "/bilim/admin");
  assert.equal(safeCallbackUrl("/bilim/admin/users", "/bilim/admin", "/bilim/admin"), "/bilim/admin/users");
});
