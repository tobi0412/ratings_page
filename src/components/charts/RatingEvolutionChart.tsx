"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { HistoricalRating, MatchSession, Profile } from "@/types";

interface RatingEvolutionChartProps {
  sessions: MatchSession[];
  ratings: HistoricalRating[];
  players: Profile[];
}

const COLORS = [
  "#00e676",
  "#ff5252",
  "#ffab40",
  "#40c4ff",
  "#ea80fc",
  "#69f0ae",
  "#ff6e40",
  "#ffd740",
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: "#0b1810",
        border: "1px solid #1c3828",
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      <p
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "1rem",
          letterSpacing: "0.05em",
          color: "#e4f0e8",
          margin: "0 0 0.5rem",
        }}
      >
        {label}
      </p>
      {payload.map((entry: any) => (
        <div
          key={entry.dataKey}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.25rem",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.85rem",
              color: "#a0c4ac",
            }}
          >
            {entry.name}:
          </span>
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1rem",
              color: entry.color,
              letterSpacing: "0.04em",
            }}
          >
            {entry.value?.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RatingEvolutionChart({
  sessions,
  ratings,
  players,
}: RatingEvolutionChartProps) {
  const chartData = sessions.map((session) => {
    const dataPoint: any = { name: session.name };

    players.forEach((player) => {
      const rating = ratings.find(
        (r) => r.player_id === player.id && r.match_id === session.id,
      );
      dataPoint[player.id] = rating?.avg_total || 0;
    });

    return dataPoint;
  });

  return (
    <div className="card-sport" style={{ padding: "1.5rem" }}>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: -12, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(28,56,40,0.8)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 12,
              fill: "#3d6e50",
              letterSpacing: "0.06em",
            }}
            axisLine={{ stroke: "#1c3828" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 13,
              fill: "#3d6e50",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "13px",
              letterSpacing: "0.06em",
              color: "#a0c4ac",
              paddingTop: "12px",
            }}
          />
          {players.map((player, index) => (
            <Line
              key={player.id}
              type="monotone"
              dataKey={player.id}
              stroke={COLORS[index % COLORS.length]}
              name={player.username}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: COLORS[index % COLORS.length],
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
                fill: COLORS[index % COLORS.length],
                stroke: "#060d09",
                strokeWidth: 2,
              }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
