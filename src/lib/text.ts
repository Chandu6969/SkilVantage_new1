export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function csvCell(value: string | number | null | undefined) {
  let text = String(value ?? "").replace(/\r?\n/g, " ").replace(/\t/g, " ");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: string[][]) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

export function clip(value: string, max = 180) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function safeFilename(name: string) {
  const base = name.replace(/[/\\]/g, "").replace(/[^\w.\- ()]/g, "").slice(0, 80);
  return base || "resume";
}
