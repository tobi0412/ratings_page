"use client";

import React, { useId } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { MatchSession } from "@/types";
import { StarIcon, FlameIcon, ThumbsUpIcon, TrendingUpIcon, AlertTriangleIcon } from "@/components/Icons";

interface StatLineChartProps {
  sessions: MatchSession[];
  data: {
    playerId: string;
    playerName: string;
    color: string;
    values: { sessionId: string; value: number | null }[];
  }[];
  label: React.ReactNode;
  yDomain?: [number, number];
  change?: number | null;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  // Detect if it's a BarChart tooltip
  const isBarChart = payload[0].dataKey === "value";

  if (isBarChart) {
    const item = payload[0].payload;
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
          {item.name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: item.color,
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
            Valor:
          </span>
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.1rem",
              color: item.color,
              letterSpacing: "0.04em",
            }}
          >
            {Number(item.value).toFixed(2)}
          </span>
        </div>
      </div>
    );
  }

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
            {entry.value != null ? Number(entry.value).toFixed(2) : "—"}
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
  change,
}: StatLineChartProps) {
  const isSingleSession = sessions.length === 1;
  const animationName = `fillBar_${useId().replace(/:/g, "")}`;

  if (isSingleSession) {
    if (data.length === 1) {
      // 1. Personal Tab - 1 player, 1 session (Gauge/Progress display)
      const singleValue = data[0].values[0]?.value ?? 0;
      const color = data[0].color;
      const percentage = (singleValue / 10) * 100;

      // Determine visual tier
      let tierText = "Clase Mundial";
      let tierIcon: React.ReactNode = <StarIcon size="0.85rem" filled style={{ color: "#00e676" }} />;
      let tierColor = "#00e676";
      if (singleValue < 9.0 && singleValue >= 8.0) {
        tierText = "Destacado";
        tierIcon = <FlameIcon size="0.85rem" style={{ color: "#40c4ff" }} />;
        tierColor = "#40c4ff";
      } else if (singleValue < 8.0 && singleValue >= 7.0) {
        tierText = "Buen Rendimiento";
        tierIcon = <ThumbsUpIcon size="0.85rem" style={{ color: "#ffab40" }} />;
        tierColor = "#ffab40";
      } else if (singleValue < 7.0 && singleValue >= 6.0) {
        tierText = "Regular";
        tierIcon = <TrendingUpIcon size="0.85rem" style={{ color: "#a0c4ac" }} />;
        tierColor = "#a0c4ac";
      } else if (singleValue < 6.0) {
        tierText = "Bajo promedio";
        tierIcon = <AlertTriangleIcon size="0.85rem" style={{ color: "#ff5252" }} />;
        tierColor = "#ff5252";
      }

      return (
        <div
          className="card-sport animate-slide-up"
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow texture */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "150px",
              height: "150px",
              background: `radial-gradient(circle, ${color}1A 0%, transparent 70%)`,
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              width: "100%",
            }}
          >
            <p
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.1rem",
                color: "#3d6e50",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                margin: 0,
              }}
            >
              {label}
            </p>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: tierColor,
                background: `rgba(${
                  tierColor === "#00e676"
                    ? "0,230,118"
                    : tierColor === "#40c4ff"
                    ? "64,196,255"
                    : tierColor === "#ffab40"
                    ? "255,171,64"
                    : tierColor === "#a0c4ac"
                    ? "160,196,172"
                    : "255,82,82"
                }, 0.1)`,
                padding: "0.15rem 0.5rem",
                borderRadius: "4px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                {tierText}
                {tierIcon}
              </span>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              marginTop: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "baseline",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "4.5rem",
                    color: color,
                    lineHeight: 1,
                    textShadow: `0 0 20px ${color}33`,
                  }}
                >
                  {singleValue.toFixed(2)}
                </span>
                {change !== undefined && change !== null && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      fontSize: "0.8rem",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      color: change > 0 ? "#00e676" : change < 0 ? "#ff5252" : "#3d6e50",
                      background: change > 0 ? "rgba(0, 230, 118, 0.08)" : change < 0 ? "rgba(255, 82, 82, 0.08)" : "rgba(61, 110, 80, 0.08)",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      lineHeight: 1.1,
                      alignSelf: "center",
                    }}
                  >
                    <span>{change > 0 ? "▲" : change < 0 ? "▼" : "•"}</span>
                    <span>{change > 0 ? "+" : ""}{change.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.8rem",
                  color: "#3d6e50",
                  marginLeft: "0.2rem",
                  letterSpacing: "0.05em",
                }}
              >
                SOBRE 10
              </span>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.75rem",
                  color: "#a0c4ac",
                }}
              >
                <span>Rendimiento</span>
                <span>{Math.floor(percentage)}%</span>
              </div>

              {/* Progress track */}
              <div
                style={{
                  height: "10px",
                  background: "#12261b",
                  borderRadius: "5px",
                  overflow: "hidden",
                  border: "1px solid rgba(28,56,40,0.5)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    borderRadius: "5px",
                    boxShadow: `0 0 10px ${color}88`,
                    animation: `${animationName} 1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards`,
                  }}
                />
              </div>
            </div>
          </div>

          <style>{`
            @keyframes ${animationName} {
              from { width: 0%; }
              to { width: ${percentage}%; }
            }
          `}</style>
        </div>
      );
    } else {
      // 2. Team Tab - Multiple players, 1 session (Bar Chart comparison sorted descending)
      const barChartData = data
        .map((series) => ({
          name: series.playerName,
          value: series.values[0]?.value ?? 0,
          color: series.color,
          playerId: series.playerId,
        }))
        .sort((a, b) => b.value - a.value);

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
            {label} (Comparativa)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={barChartData}
              margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
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
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barChartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
  }

  // 3. Multi-Session (Default Line Chart rendering)
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

