import assert from "node:assert/strict";
import test from "node:test";
import { buildReportPdf } from "../src/lib/report-pdf";

test("a report pdf starts as a pdf document", () => {
  const bytes = buildReportPdf(["SkilVantage report", "Students present 3"]);
  assert.equal(new TextDecoder().decode(bytes).slice(0, 5), "%PDF-");
  assert.match(new TextDecoder().decode(bytes), /SkilVantage report/);
});
