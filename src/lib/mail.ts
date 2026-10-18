import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email delivery over SMTP (any provider: Gmail, Yandex, Mail.ru, a hosting mailbox).
 *
 * Configured with SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_FROM. Until SMTP_HOST is
 * set, letters are written to the server log instead — the same way SMS codes are in
 * development — so the "forgot password" flow stays testable without a mailbox.
 */

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type MailResult = { ok: true; transport: "smtp" | "console" } | { ok: false };

export const isMailSimulated = !process.env.SMTP_HOST;

let transporter: Transporter | null = null;

function smtp(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is TLS from the first byte; 587 and 25 upgrade with STARTTLS.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  if (isMailSimulated) {
    console.info(`\n[mail → ${message.to}] ${message.subject}\n${message.text}\n`);
    return { ok: true, transport: "console" };
  }
  try {
    await smtp().sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { ok: true, transport: "smtp" };
  } catch (error) {
    console.error("[mail] could not send", error);
    return { ok: false };
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A plain branded letter with one call to action. Table layout and inline styles only:
 * mail clients ignore stylesheets and most of modern CSS.
 */
export function actionEmailHtml(input: {
  heading: string;
  paragraphs: string[];
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
}): string {
  const paragraphs = input.paragraphs
    .map((text) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2f4d63">${escapeHtml(text)}</p>`)
    .join("");
  const url = escapeHtml(input.buttonUrl);
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#eef3f7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f7;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif">
<tr><td style="background:linear-gradient(135deg,#073b52,#0b6a8f 55%,#12a3b8);background-color:#0b6a8f;padding:24px 32px">
<span style="font-size:18px;font-weight:800;letter-spacing:.04em;color:#ffffff">BILIM</span>
<span style="font-size:11px;font-weight:700;letter-spacing:.3em;color:#ffd08a;margin-left:6px">MERKEZI</span>
</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0b2233">${escapeHtml(input.heading)}</h1>
${paragraphs}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border-radius:12px;background:#073b52">
<a href="${url}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${escapeHtml(input.buttonLabel)}</a>
</td></tr></table>
<p style="margin:0;font-size:12px;line-height:1.6;color:#6a8299;word-break:break-all">${url}</p>
</td></tr>
<tr><td style="padding:18px 32px;background:#e2ebf2;font-size:12px;line-height:1.6;color:#6a8299">${escapeHtml(input.footer)}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
