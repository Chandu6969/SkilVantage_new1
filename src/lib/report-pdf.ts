export type ReportTone = "student" | "professional" | "teacher";

export type ReportDocument = {
  tone: ReportTone;
  kicker: string;
  title: string;
  subtitle: string;
  generated: string;
  stats: { label: string; value: string }[];
  tableHeading?: string;
  columns: string[];
  rows: string[][];
  sections?: { heading: string; columns: string[]; rows: string[][] }[];
  footer: string;
};

const tones: Record<ReportTone, { band: Rgb; soft: Rgb; ink: Rgb }> = {
  student: { band: hex("065f46"), soft: hex("ecfdf5"), ink: hex("064e3b") },
  professional: { band: hex("312e81"), soft: hex("eef2ff"), ink: hex("1e1b4b") },
  teacher: { band: hex("9a3412"), soft: hex("fff7ed"), ink: hex("7c2d12") },
};

type Rgb = [number, number, number];

function hex(value: string): Rgb {
  return [parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255];
}

function pdfText(value: string) {
  return value
    .replaceAll("₹", "Rs ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function fit(value: string, size: number, width: number) {
  const clean = pdfText(value);
  const max = Math.max(1, Math.floor(width / (size * 0.52)));
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1))}.`;
}

function paint(color: Rgb) {
  return `${color.map((part) => part.toFixed(3)).join(" ")} rg`;
}

function statusColor(value: string): Rgb | null {
  const key = value.trim().toLowerCase();
  if (key.startsWith("present") || key === "paid" || key === "reviewed") return hex("047857");
  if (key.startsWith("absent")) return hex("be123c");
  if (key.startsWith("leave") || key === "pending" || key === "due") return hex("b45309");
  if (key.startsWith("holiday") || key === "submitted") return hex("0369a1");
  if (key.startsWith("not")) return hex("64748b");
  return null;
}

const WIDTH = 595;
const HEIGHT = 842;
const TABLE_WIDTH = WIDTH - 72;

function widthsFor(columns: string[]) {
  if (columns.length === 4) return [42, 200, 170, TABLE_WIDTH - 412];
  if (columns.length === 5) return [36, 150, 145, 96, TABLE_WIDTH - 427];
  if (columns.length === 3) return [42, 250, TABLE_WIDTH - 292];
  return columns.map(() => TABLE_WIDTH / Math.max(columns.length, 1));
}

function layout(report: ReportDocument) {
  const tone = tones[report.tone];
  const pages: string[][] = [];
  let commands: string[] = [];
  let y = 0;

  function open(continued: boolean) {
    commands = [];
    pages.push(commands);
    commands.push("1 1 1 rg", `0 0 ${WIDTH} ${HEIGHT} re f`);
    const headerBottom = continued ? 760 : 690;
    commands.push(paint(tone.band), `0 ${headerBottom} ${WIDTH} ${HEIGHT - headerBottom} re f`);
    commands.push("1 1 1 rg");
    commands.push("BT", "/F2 18 Tf", "36 804 Td", "(SKILLVANTAGE) Tj", "ET");
    commands.push("BT", "/F1 8 Tf", "36 786 Td", "(LEARN   •   PRACTICE   •   GROW) Tj", "ET");
    commands.push("BT", "/F2 13 Tf", `36 ${continued ? 768 : 758} Td`, `(${fit(report.kicker, 13, 520)}) Tj`, "ET");
    if (!continued) {
      commands.push("BT", "/F1 10 Tf", "36 738 Td", `(${fit(`${report.title}  •  ${report.subtitle}`, 10, 520)}) Tj`, "ET");
      commands.push("BT", "/F1 8 Tf", "36 722 Td", `(${fit(`Generated ${report.generated}`, 8, 520)}) Tj`, "ET");
      const stats = report.stats.slice(0, 5);
      const gap = 8;
      const cardWidth = (WIDTH - 72 - gap * (stats.length - 1)) / Math.max(stats.length, 1);
      stats.forEach((stat, index) => {
        const x = 36 + index * (cardWidth + gap);
        commands.push(paint(tone.soft), `${x.toFixed(1)} 628 ${cardWidth.toFixed(1)} 58 re f`);
        commands.push(paint(tone.ink), "BT", "/F2 16 Tf", `1 0 0 1 ${(x + 10).toFixed(1)} 654 Tm`, `(${fit(stat.value, 16, cardWidth - 16)}) Tj`, "ET");
        commands.push("BT", "/F1 7 Tf", `1 0 0 1 ${(x + 10).toFixed(1)} 638 Tm`, `(${fit(stat.label, 7, cardWidth - 16)}) Tj`, "ET");
      });
      y = 608;
    } else {
      y = 736;
    }
  }

  function drawTable(heading: string, columns: string[], rows: string[][]) {
    const widths = widthsFor(columns);
    if (heading) {
      if (y - 46 < 52) open(true);
      commands.push(paint(tone.ink), "BT", "/F2 11 Tf", `1 0 0 1 36 ${(y - 16).toFixed(1)} Tm`, `(${fit(heading, 11, 520)}) Tj`, "ET");
      y -= 24;
    }
    const drawHead = () => {
      if (y - 22 < 52) open(true);
      commands.push(paint(tone.band), `36 ${(y - 22).toFixed(1)} ${TABLE_WIDTH} 22 re f`, "1 1 1 rg");
      let x = 36;
      columns.forEach((column, index) => {
        commands.push("BT", "/F2 8 Tf", `1 0 0 1 ${(x + 6).toFixed(1)} ${(y - 15).toFixed(1)} Tm`, `(${fit(column, 8, widths[index]! - 10)}) Tj`, "ET");
        x += widths[index]!;
      });
      y -= 22;
    };
    drawHead();
    const body = rows.length ? rows : [["", "Nothing recorded yet."]];
    body.forEach((row, rowIndex) => {
      if (y - 20 < 52) {
        open(true);
        drawHead();
      }
      const top = y;
      if (rowIndex % 2 === 0) commands.push("0.973 0.984 0.984 rg", `36 ${(top - 20).toFixed(1)} ${TABLE_WIDTH} 20 re f`);
      let cellX = 36;
      row.forEach((cell, index) => {
        const color = index === row.length - 1 ? statusColor(cell) : null;
        commands.push(paint(color || (rows.length ? hex("17211e") : hex("64748b"))));
        const width = widths[index] ?? widths[widths.length - 1] ?? TABLE_WIDTH;
        commands.push("BT", "/F1 9 Tf", `1 0 0 1 ${(cellX + 6).toFixed(1)} ${(top - 14).toFixed(1)} Tm`, `(${fit(cell, 9, width - 10)}) Tj`, "ET");
        cellX += widths[index] ?? width;
      });
      y -= 20;
    });
    y -= 12;
  }

  open(false);
  drawTable(report.tableHeading || "", report.columns, report.rows);
  for (const section of report.sections || []) drawTable(section.heading, section.columns, section.rows);
  const count = pages.length;
  return pages.map((page, index) => {
    page.push("0.420 0.455 0.482 rg");
    page.push("BT", "/F1 8 Tf", "36 36 Td", `(${fit(report.footer, 8, 430)}) Tj`, "ET");
    page.push("BT", "/F1 8 Tf", "500 36 Td", `(${index + 1} / ${count}) Tj`, "ET");
    return page.join("\n");
  });
}

export function buildReportPdf(report: ReportDocument): Uint8Array {
  const groups = layout(report);
  const pageCount = groups.length;
  const fontRegular = 3 + pageCount * 2;
  const fontBold = fontRegular + 1;
  const objects: { id: number; body: string }[] = [
    { id: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    {
      id: 2,
      body: `<< /Type /Pages /Kids [${groups.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pageCount} >>`,
    },
  ];
  groups.forEach((stream, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const length = new TextEncoder().encode(stream).length;
    objects.push({ id: contentId, body: `<< /Length ${length} >>\nstream\n${stream}\nendstream` });
    objects.push({
      id: pageId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> >>`,
    });
  });
  objects.push({ id: fontRegular, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" });
  objects.push({ id: fontBold, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>" });
  objects.sort((a, b) => a.id - b.id);

  let output = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const object of objects) {
    offsets[object.id] = Buffer.byteLength(output);
    output += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  }
  const xref = Buffer.byteLength(output);
  let table = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objects.length; id += 1) table += `${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`;
  output += `${table}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output);
}
