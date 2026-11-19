import { hrSignature, paidStamp } from "@/lib/brand-marks";

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
  sections?: { heading: string; columns: string[]; rows: string[][]; foot?: string }[];
  footer: string;
  signOff?: { issued: string; period: string };
  wide?: boolean;
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
    .replaceAll("•", "%%B%%")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replaceAll("%%B%%", "\\225");
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
  if (key === "p" || key.startsWith("present") || key === "paid" || key === "reviewed") return hex("047857");
  if (key === "a" || key.startsWith("absent")) return hex("be123c");
  if (key === "lj" || key.startsWith("late")) return hex("7e22ce");
  if (key === "l" || key.startsWith("leave") || key === "pending" || key === "due") return hex("b45309");
  if (key === "h" || key.startsWith("holiday") || key === "submitted") return hex("0369a1");
  if (key === "taken" || key === "active") return hex("047857");
  if (key === "wo" || key === "-" || key === "—" || key.startsWith("not")) return hex("64748b");
  return null;
}

const WIDTH = 595;
const HEIGHT = 842;
const TABLE_WIDTH = WIDTH - 72;

function widthsFor(columns: string[], tableWidth = TABLE_WIDTH) {
  if (columns.length > 12) {
    const day = 15;
    const serial = 26;
    const name = Math.max(90, tableWidth - serial - (columns.length - 2) * day);
    return [serial, name, ...columns.slice(2).map(() => day)];
  }
  if (columns.length === 8) return [80, 68, 64, 82, 64, 50, 58, tableWidth - 466];
  if (columns.length === 6) return [72, 78, 112, 124, 64, tableWidth - 450];
  if (columns.length === 4) return [42, 200, 170, tableWidth - 412];
  if (columns.length === 5 && columns[0] !== "S.No") return [128, 118, 86, 96, tableWidth - 428];
  if (columns.length === 5) return [36, 150, 145, 96, tableWidth - 427];
  if (columns.length === 3) return [42, 250, tableWidth - 292];
  return columns.map(() => tableWidth / Math.max(columns.length, 1));
}

function textWidth(value: string, size: number) {
  return pdfText(value).length * size * 0.5;
}

function drawSignOff(
  commands: string[],
  readY: () => number,
  writeY: (value: number) => void,
  nextPage: () => void,
  sign: { issued: string; period: string },
) {
  const sigW = 136;
  const sigH = sigW * (hrSignature.height / hrSignature.width);
  const stampW = 108;
  const stampH = stampW * (paidStamp.height / paidStamp.width);
  if (readY() - (Math.max(sigH, stampH) + 42) < 52) nextPage();
  const top = readY() - 4;
  const sigY = top - sigH;
  commands.push("q", `${sigW.toFixed(2)} 0 0 ${sigH.toFixed(2)} 40 ${sigY.toFixed(2)} cm`, "/Sig Do", "Q");
  const stampX = (WIDTH - stampW) / 2;
  const stampY = top - stampH + 4;
  commands.push("q", `${stampW.toFixed(2)} 0 0 ${stampH.toFixed(2)} ${stampX.toFixed(2)} ${stampY.toFixed(2)} cm`, "/Stamp Do", "Q");
  commands.push(paint(hex("17211e")));
  commands.push("BT", "/F2 9 Tf", `1 0 0 1 46 ${(sigY - 14).toFixed(1)} Tm`, "(HR) Tj", "ET");
  commands.push("BT", "/F1 8 Tf", `1 0 0 1 46 ${(sigY - 26).toFixed(1)} Tm`, "(SkilVantage) Tj", "ET");
  commands.push(paint(hex("3d4a57")));
  const caption = "Official stamp";
  commands.push("BT", "/F1 8 Tf", `1 0 0 1 ${((WIDTH - textWidth(caption, 8)) / 2).toFixed(1)} ${(stampY - 12).toFixed(1)} Tm`, "(Official stamp) Tj", "ET");
  commands.push("BT", "/F1 9 Tf", `1 0 0 1 400 ${(top - 22).toFixed(1)} Tm`, "(Issued:) Tj", "ET");
  commands.push("BT", "/F2 10 Tf", `1 0 0 1 400 ${(top - 38).toFixed(1)} Tm`, `(${fit(sign.issued, 10, 160)}) Tj`, "ET");
  commands.push("BT", "/F1 9 Tf", `1 0 0 1 400 ${(top - 56).toFixed(1)} Tm`, `(${fit(`Payment period: ${sign.period}`, 9, 170)}) Tj`, "ET");
  writeY(Math.min(sigY - 34, stampY - 22));
}

function pageBox(report: ReportDocument) {
  return report.wide ? { width: 842, height: 595 } : { width: WIDTH, height: HEIGHT };
}

function layout(report: ReportDocument) {
  const tone = tones[report.tone];
  const { width, height } = pageBox(report);
  const tableWidth = width - 72;
  const pages: string[][] = [];
  let commands: string[] = [];
  let y = 0;

  function open(continued: boolean) {
    commands = [];
    pages.push(commands);
    commands.push("1 1 1 rg", `0 0 ${width} ${height} re f`);
    if (report.signOff && !continued) {
      const headerBottom = height - 72;
      const summaryRoom = Math.min(250, width * 0.4);
      commands.push(paint(hex("0f766e")), `0 ${headerBottom} ${width} ${height - headerBottom} re f`);
      commands.push("1 1 1 rg");
      commands.push("BT", "/F2 8 Tf", `36 ${height - 24} Td`, "(SKILLVANTAGE  •  TEACHER MANAGEMENT) Tj", "ET");
      commands.push("BT", "/F2 13 Tf", `36 ${height - 46} Td`, `(${fit(report.title, 13, width - summaryRoom - 84)}) Tj`, "ET");
      const summary = fit(report.subtitle, 9, summaryRoom);
      const date = fit(`Date: ${report.signOff.issued}`, 8, summaryRoom);
      commands.push("BT", "/F1 9 Tf", `1 0 0 1 ${(width - 36 - textWidth(summary, 9)).toFixed(1)} ${height - 28} Tm`, `(${summary}) Tj`, "ET");
      commands.push("BT", "/F1 8 Tf", `1 0 0 1 ${(width - 36 - textWidth(date, 8)).toFixed(1)} ${height - 44} Tm`, `(${date}) Tj`, "ET");
    } else if (!continued) {
      const headerBottom = height - 78;
      const summaryRoom = Math.min(280, width * 0.42);
      commands.push(paint(tone.band), `0 ${headerBottom} ${width} ${height - headerBottom} re f`);
      commands.push("1 1 1 rg");
      commands.push("BT", "/F2 16 Tf", `36 ${height - 26} Td`, "(SKILLVANTAGE) Tj", "ET");
      commands.push("BT", "/F1 8 Tf", `36 ${height - 40} Td`, "(LEARN   •   PRACTICE   •   GROW) Tj", "ET");
      commands.push("BT", "/F2 12 Tf", `36 ${height - 58} Td`, `(${fit(report.kicker, 12, width - summaryRoom - 84)}) Tj`, "ET");
      const summary = fit(`${report.title}  •  ${report.subtitle}`, 9, summaryRoom);
      const generatedLine = fit(`Generated ${report.generated}`, 8, summaryRoom);
      commands.push("BT", "/F1 9 Tf", `1 0 0 1 ${(width - 36 - textWidth(summary, 9)).toFixed(1)} ${height - 32} Tm`, `(${summary}) Tj`, "ET");
      commands.push("BT", "/F1 8 Tf", `1 0 0 1 ${(width - 36 - textWidth(generatedLine, 8)).toFixed(1)} ${height - 48} Tm`, `(${generatedLine}) Tj`, "ET");
    } else {
      const headerBottom = height - 82;
      commands.push(paint(tone.band), `0 ${headerBottom} ${width} ${height - headerBottom} re f`);
      commands.push("1 1 1 rg");
      commands.push("BT", "/F2 18 Tf", `36 ${height - 38} Td`, "(SKILLVANTAGE) Tj", "ET");
      commands.push("BT", "/F1 8 Tf", `36 ${height - 56} Td`, "(LEARN   •   PRACTICE   •   GROW) Tj", "ET");
      commands.push("BT", "/F2 13 Tf", `36 ${height - 74} Td`, `(${fit(report.kicker, 13, width - 72)}) Tj`, "ET");
    }
    if (!continued) {
      const stats = report.stats.slice(0, 5);
      const gap = 8;
      const cardWidth = (width - 72 - gap * (stats.length - 1)) / Math.max(stats.length, 1);
      const cardBottom = report.signOff ? height - 142 : height - 148;
      stats.forEach((stat, index) => {
        const x = 36 + index * (cardWidth + gap);
        commands.push(paint(tone.soft), `${x.toFixed(1)} ${cardBottom} ${cardWidth.toFixed(1)} 58 re f`);
        if (report.signOff) {
          const valueColor = index === stats.length - 1 ? hex("0f766e") : tone.ink;
          commands.push(paint(hex("5d8572")), "BT", "/F1 7 Tf", `1 0 0 1 ${(x + 10).toFixed(1)} ${cardBottom + 38} Tm`, `(${fit(stat.label.toUpperCase(), 7, cardWidth - 16)}) Tj`, "ET");
          commands.push(paint(valueColor), "BT", "/F2 16 Tf", `1 0 0 1 ${(x + 10).toFixed(1)} ${cardBottom + 16} Tm`, `(${fit(stat.value, 16, cardWidth - 16)}) Tj`, "ET");
        } else {
          commands.push(paint(tone.ink), "BT", "/F2 16 Tf", `1 0 0 1 ${(x + 10).toFixed(1)} ${cardBottom + 26} Tm`, `(${fit(stat.value, 16, cardWidth - 16)}) Tj`, "ET");
          commands.push("BT", "/F1 7 Tf", `1 0 0 1 ${(x + 10).toFixed(1)} ${cardBottom + 10} Tm`, `(${fit(stat.label, 7, cardWidth - 16)}) Tj`, "ET");
        }
      });
      y = cardBottom - 18;
    } else {
      y = height - 106;
    }
  }

  function drawTable(heading: string, columns: string[], rows: string[][], foot?: string) {
    const widths = widthsFor(columns, tableWidth);
    const dense = columns.length > 12;
    const rowHeight = dense ? 16 : 20;
    const headHeight = dense ? 16 : 22;
    const pad = dense ? 2 : 4;
    if (heading) {
      if (y - 46 < 52) open(true);
      commands.push(paint(tone.ink), "BT", "/F2 11 Tf", `1 0 0 1 36 ${(y - 16).toFixed(1)} Tm`, `(${fit(heading, 11, tableWidth)}) Tj`, "ET");
      y -= 24;
    }
    const size = dense || columns.length >= 6 ? 7 : 9;
    const drawHead = () => {
      if (y - headHeight < 52) open(true);
      commands.push(paint(tone.band), `36 ${(y - headHeight).toFixed(1)} ${tableWidth} ${headHeight} re f`, "1 1 1 rg");
      let x = 36;
      const headSize = dense ? 6 : 7;
      columns.forEach((column, index) => {
        commands.push("BT", `/F2 ${headSize} Tf`, `1 0 0 1 ${(x + pad).toFixed(1)} ${(y - (dense ? 11 : 15)).toFixed(1)} Tm`, `(${fit(column, headSize, widths[index]! - pad * 2)}) Tj`, "ET");
        x += widths[index]!;
      });
      y -= headHeight;
    };
    drawHead();
    const body = rows.length ? rows : [["", "Nothing recorded yet."]];
    body.forEach((row, rowIndex) => {
      if (y - rowHeight < 52) {
        open(true);
        drawHead();
      }
      const top = y;
      if (rowIndex % 2 === 0) commands.push("0.973 0.984 0.984 rg", `36 ${(top - rowHeight).toFixed(1)} ${tableWidth} ${rowHeight} re f`);
      let cellX = 36;
      row.forEach((cell, index) => {
        const color = statusColor(cell);
        commands.push(paint(color || (rows.length ? hex("17211e") : hex("64748b"))));
        const cellWidth = widths[index] ?? widths[widths.length - 1] ?? tableWidth;
        commands.push("BT", `/F1 ${size} Tf`, `1 0 0 1 ${(cellX + pad).toFixed(1)} ${(top - (dense ? 11 : 14)).toFixed(1)} Tm`, `(${fit(cell, size, cellWidth - pad * 2)}) Tj`, "ET");
        cellX += widths[index] ?? cellWidth;
      });
      y -= rowHeight;
    });
    if (foot) {
      if (y - 18 < 52) open(true);
      const size = 9;
      commands.push(paint(tone.ink), "BT", `/F2 ${size} Tf`, `1 0 0 1 ${(36 + tableWidth - textWidth(foot, size)).toFixed(1)} ${(y - 12).toFixed(1)} Tm`, `(${fit(foot, size, 240)}) Tj`, "ET");
      y -= 20;
    }
    y -= 12;
  }

  open(false);
  drawTable(report.tableHeading || "", report.columns, report.rows);
  for (const section of report.sections || []) drawTable(section.heading, section.columns, section.rows, section.foot);
  if (report.signOff) drawSignOff(commands, () => y, (next) => { y = next; }, () => open(true), report.signOff);
  const count = pages.length;
  return pages.map((page, index) => {
    page.push("0.420 0.455 0.482 rg");
    page.push("BT", "/F1 8 Tf", "36 36 Td", `(${fit(report.footer, 8, tableWidth - 80)}) Tj`, "ET");
    page.push("BT", "/F1 8 Tf", `${width - 95} 36 Td`, `(${index + 1} / ${count}) Tj`, "ET");
    return page.join("\n");
  });
}

function jpegBytes(value: string) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

const encoder = new TextEncoder();

export function buildReportPdf(report: ReportDocument): Uint8Array {
  const { width, height } = pageBox(report);
  const groups = layout(report);
  const pageCount = groups.length;
  const marks = report.signOff
    ? [
        { name: "Sig", mark: hrSignature },
        { name: "Stamp", mark: paidStamp },
      ]
    : [];
  const fontRegular = 3 + pageCount * 2;
  const fontBold = fontRegular + 1;
  const imageIds = marks.map((_, index) => fontBold + 1 + index);
  const xobjects = marks.map((item, index) => `/${item.name} ${imageIds[index]} 0 R`).join(" ");
  const objects: { id: number; body: Uint8Array }[] = [
    { id: 1, body: encoder.encode("<< /Type /Catalog /Pages 2 0 R >>") },
    {
      id: 2,
      body: encoder.encode(`<< /Type /Pages /Kids [${groups.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pageCount} >>`),
    },
  ];
  groups.forEach((stream, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const streamBytes = encoder.encode(stream);
    objects.push({
      id: contentId,
      body: concatBytes([encoder.encode(`<< /Length ${streamBytes.length} >>\nstream\n`), streamBytes, encoder.encode("\nendstream")]),
    });
    const resources = `<< /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >>${xobjects ? ` /XObject << ${xobjects} >>` : ""} >>`;
    objects.push({
      id: pageId,
      body: encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents ${contentId} 0 R /Resources ${resources} >>`),
    });
  });
  objects.push({ id: fontRegular, body: encoder.encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>") });
  objects.push({ id: fontBold, body: encoder.encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>") });
  marks.forEach((item, index) => {
    const bytes = jpegBytes(item.mark.jpeg);
    objects.push({
      id: imageIds[index]!,
      body: concatBytes([
        encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${item.mark.width} /Height ${item.mark.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`),
        bytes,
        encoder.encode("\nendstream"),
      ]),
    });
  });
  objects.sort((a, b) => a.id - b.id);

  const chunks: Uint8Array[] = [encoder.encode("%PDF-1.4\n")];
  const offsets: number[] = [];
  let cursor = chunks[0]!.length;
  for (const object of objects) {
    offsets[object.id] = cursor;
    const head = encoder.encode(`${object.id} 0 obj\n`);
    const tail = encoder.encode("\nendobj\n");
    chunks.push(head, object.body, tail);
    cursor += head.length + object.body.length + tail.length;
  }
  const table = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];
  for (let id = 1; id <= objects.length; id += 1) table.push(`${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`);
  chunks.push(encoder.encode(`${table.join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${cursor}\n%%EOF`));
  return concatBytes(chunks);
}
