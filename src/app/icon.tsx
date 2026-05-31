import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: "#060d09",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00e676",
          borderRadius: "6px",
          border: "1px solid #1c3828",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: "bold",
        }}
      >
        C
      </div>
    ),
    {
      ...size,
    }
  );
}
