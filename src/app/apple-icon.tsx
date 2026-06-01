import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata for Apple Touch Icon
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#060d09",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "36px", // Larger border radius for the 180px canvas
          border: "2px solid #1c3828",
        }}
      >
        <svg
          width="130"
          height="130"
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Facet 1: Forehead Left */}
          <polygon
            points="50,12 58,37 31,25"
            fill="#00e676"
            opacity="0.8"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 2: Forehead Right */}
          <polygon
            points="50,12 68,20 58,37"
            fill="#00e676"
            opacity="0.9"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 3: Back Top */}
          <polygon
            points="31,25 38,42 22,45"
            fill="#00e676"
            opacity="0.6"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 4: Back Mid */}
          <polygon
            points="22,45 38,42 36,60"
            fill="#00e676"
            opacity="0.5"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 5: Cheek Mid */}
          <polygon
            points="38,42 48,52 36,60"
            fill="#00e676"
            opacity="0.85"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 6: Jaw Left */}
          <polygon
            points="22,45 36,60 27,65"
            fill="#00e676"
            opacity="0.45"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 7: Jaw Mid */}
          <polygon
            points="36,60 46,68 27,65"
            fill="#00e676"
            opacity="0.55"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 8: Jaw Center */}
          <polygon
            points="36,60 48,52 46,68"
            fill="#00e676"
            opacity="0.75"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 9: Neck Lower Left */}
          <polygon
            points="27,65 46,68 40,80"
            fill="#00e676"
            opacity="0.5"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 10: Neck Lower Mid */}
          <polygon
            points="46,68 55,87 40,80"
            fill="#00e676"
            opacity="0.6"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 11: Throat Mid */}
          <polygon
            points="48,52 68,52 46,68"
            fill="#00e676"
            opacity="0.8"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 12: Throat Low */}
          <polygon
            points="46,68 68,62 55,87"
            fill="#00e676"
            opacity="0.7"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 13: Beak Upper */}
          <polygon
            points="68,20 81,35 60,48 58,37"
            fill="#00e676"
            opacity="0.95"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 14: Beak Mid */}
          <polygon
            points="81,35 85,47 68,52 60,48"
            fill="#00e676"
            opacity="1.0"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 15: Beak Lower Outer */}
          <polygon
            points="85,47 75,75 68,62"
            fill="#00e676"
            opacity="0.9"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 16: Beak Lower Inner */}
          <polygon
            points="85,47 68,62 68,52"
            fill="#00e676"
            opacity="0.8"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Facet 17: Dark Eye area */}
          <polygon
            points="58,37 60,48 48,52 38,42"
            fill="#040906"
            stroke="#060d09"
            strokeWidth="0.8"
          />
          {/* Eye: Green Hexagon */}
          <polygon
            points="51,40 54,41.5 54,44.5 51,46 48,44.5 48,41.5"
            fill="#00e676"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
