/**
 * Minimal CSV writing for the admin exports, tuned for the spreadsheet that will open the file:
 *
 * - `;` as the separator and a UTF-8 BOM, because Excel with a Russian or Turkmen locale splits
 *   on semicolons and only reads Cyrillic correctly when the BOM is there;
 * - cells that start with `=`, `+`, `-`, `@` or a tab get a leading apostrophe, so a name like
 *   `=HYPERLINK(...)` typed into a form cannot run as a formula when an admin opens the export.
 */

const SEPARATOR = ";";
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: string | number | Date | null | undefined): string {
  if (value == null) return "";
  let text = value instanceof Date ? value.toISOString().slice(0, 19).replace("T", " ") : String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: (string | number | Date | null | undefined)[][]): string {
  const lines = [header, ...rows].map((row) => row.map(cell).join(SEPARATOR));
  return `﻿${lines.join("\r\n")}\r\n`;
}
