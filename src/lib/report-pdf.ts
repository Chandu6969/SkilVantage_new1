function pdfText(value: string) {
  return value
    .replaceAll("₹", "Rs ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function buildReportPdf(lines: string[]): Uint8Array {
  const source = lines.length ? lines : ["SkilVantage report"];
  const pages: string[][] = [];
  for (let index = 0; index < source.length; index += 46) pages.push(source.slice(index, index + 46));
  const fontId = 3 + pages.length * 2;
  const objects: { id: number; body: string }[] = [
    { id: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    {
      id: 2,
      body: `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    },
  ];
  pages.forEach((pageLines, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const commands = ["BT", "/F1 11 Tf", "48 800 Td", "14 TL"];
    pageLines.forEach((line, lineIndex) => {
      const text = `(${pdfText(line)}) Tj`;
      commands.push(lineIndex === 0 ? text : `T* ${text}`);
    });
    commands.push("ET");
    const stream = commands.join("\n");
    objects.push({
      id: contentId,
      body: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    });
    objects.push({
      id: pageId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    });
  });
  objects.push({ id: fontId, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" });
  objects.sort((a, b) => a.id - b.id);

  let output = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const object of objects) {
    offsets[object.id] = output.length;
    output += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  }
  const xref = output.length;
  let table = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objects.length; id += 1) {
    table += `${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  output += `${table}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output);
}
