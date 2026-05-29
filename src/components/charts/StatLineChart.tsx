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
import { MatchSession } from "@/types";

interface StatLineChartProps {
  sessions: MatchSession[];
  data: {
    playerId: string;
    playerName: string;
    color: string;
    values: { sessionId: string; value: number | null }[];
  }[];
  label: string;
  yDomain?: [number, number];
}

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
            marginBottom: "0.2rem",
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
            {entry.value != null ? Number(entry.value).toFixed(1) : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function StatLineChart({
  sessions,
  data,
  label,
  yDomain,
}: StatLineChartProps) {
  const chartData = sessions.map((session) => {
    const point: Record<string, any> = { name: session.name };
    data.forEach((series) => {
      const v = series.values.find((v) => v.sessionId === session.id);
      point[series.playerId] = v?.value ?? null;
    });
    return point;
  });

  return (
    <div className="card-sport" style={{ padding: "1.25rem" }}>
      <p
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "1.1rem",
          color: "#3d6e50",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          margin: "0 0 0.75rem",
        }}
      >
        {label}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 12, left: -12, bottom: 0 }}
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
              fontSize: 11,
              fill: "#3d6e50",
            }}
            axisLine={{ stroke: "#1c3828" }}
            tickLine={false}
          />
          <YAxis
            domain={yDomain ?? [0, 10]}
            tick={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 12,
              fill: "#3d6e50",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {data.length > 1 && (
            <Legend
              wrapperStyle={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "12px",
                letterSpacing: "0.06em",
                color: "#a0c4ac",
                paddingTop: "10px",
              }}
            />
          )}
          {data.map((series) => (
            <Line
              key={series.playerId}
              type="monotone"
              dataKey={series.playerId}
              name={series.playerName}
              stroke={series.color}
              strokeWidth={2}
              dot={{ r: 3, fill: series.color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: series.color, stroke: "#060d09", strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
