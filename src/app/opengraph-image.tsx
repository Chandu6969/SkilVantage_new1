import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SkilVantage. Build skills that build your career.";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#10203A",
          color: "#F6F1E8",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, color: "#E0B08A" }}>SKILVANTAGE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, maxWidth: 900 }}>Build skills that build your career.</div>
          <div style={{ fontSize: 28, color: "#D5D0C6" }}>Learn skills. Build careers. Become job ready.</div>
        </div>
      </div>
    ),
    size,
  );
}
