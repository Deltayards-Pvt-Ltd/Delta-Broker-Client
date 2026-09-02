"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Label,
} from "recharts";
import { ChartColumn, PieChart as LucidePie, TrendingUp } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { statusBadgeColors } from "@/lib/leadDisplay";
import styles from "./Chart.module.css";

const GOLD = "#C5A059";
const PIE_COLORS = [
  "#C5A059",
  "#8B7355",
  "#D4BC8A",
  "#6B5A3E",
  "#A68B4B",
  "#E8D5A3",
  "#4A4033",
  "#F0E6C8",
];

function useChartTheme() {
  const { isLight } = useTheme();
  return {
    axis: isLight ? "#8b909a" : "rgba(255,255,255,0.45)",
    grid: isLight ? "rgba(17,24,39,0.08)" : "rgba(255,255,255,0.08)",
    ink: isLight ? "#1a1f2b" : "#ffffff",
    tipBg: isLight ? "#ffffff" : "#1c1f27",
    tipLine: isLight ? "rgba(17,24,39,0.1)" : "rgba(255,255,255,0.14)",
    cursor: isLight ? "rgba(197,160,89,0.08)" : "rgba(197,160,89,0.12)",
  };
}

function tipProps(theme, name) {
  return {
    cursor: { fill: theme.cursor },
    contentStyle: {
      background: theme.tipBg,
      border: `1px solid ${theme.tipLine}`,
      borderRadius: 12,
      color: theme.ink,
      fontSize: 13,
      fontWeight: 650,
    },
    formatter: (value) => [value, name],
  };
}

function Cartesian({
  type,
  data,
  dataKey,
  xKey,
  color,
  name,
  theme,
  ...rest
}) {
  const ChartTag =
    type === "line" ? LineChart : type === "area" ? AreaChart : BarChart;

  return (
    <ChartTag
      data={data}
      margin={{ top: 22, right: 8, left: -12, bottom: 0 }}
      {...rest}
    >
      <CartesianGrid stroke={theme.grid} vertical={false} />
      <XAxis
        dataKey={xKey}
        tick={{ fill: theme.axis, fontSize: 12 }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        allowDecimals={false}
        tick={{ fill: theme.axis, fontSize: 12 }}
        axisLine={false}
        tickLine={false}
        width={36}
      />
      <Tooltip {...tipProps(theme, name)} />

      {type === "line" ? (
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 4, fill: color }}
          activeDot={{ r: 6 }}
        />
      ) : type === "area" ? (
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.18}
          strokeWidth={2.5}
        />
      ) : (
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} maxBarSize={48}>
          <LabelList
            dataKey={dataKey}
            position="top"
            fill={theme.ink}
            fontSize={12}
            fontWeight={700}
          />
        </Bar>
      )}
    </ChartTag>
  );
}

function sliceFill(row, i) {
  return (
    row.color ||
    statusBadgeColors(row.label || row.name).bg ||
    PIE_COLORS[i % PIE_COLORS.length]
  );
}

function TitleIcon({ type }) {
  const props = { size: 16, strokeWidth: 2.25, className: styles.titleIcon };
  if (type === "pie") return <LucidePie {...props} />;
  if (type === "line" || type === "area") return <TrendingUp {...props} />;
  return <ChartColumn {...props} />;
}

function PieViz({ data, dataKey, xKey, name, theme, total, ...rest }) {
  const RAD = Math.PI / 180;
  const sum =
    total ?? data.reduce((n, row) => n + (Number(row[dataKey]) || 0), 0);
  const pieKey = data.map((row) => `${row[xKey]}:${row[dataKey]}`).join("|");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, [pieKey]);

  if (!ready) return null;

  return (
    <PieChart {...rest}>
      <Pie
        key={pieKey}
        data={data}
        dataKey={dataKey}
        nameKey={xKey}
        cx="50%"
        cy="50%"
        innerRadius={62}
        outerRadius={96}
        paddingAngle={2}
        isAnimationActive
        animationBegin={0}
        animationDuration={800}
        animationEasing="ease-out"
        labelLine={false}
        label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
          if (!value) return null;
          const r = (innerRadius + outerRadius) / 2;
          const x = cx + r * Math.cos(-midAngle * RAD);
          const y = cy + r * Math.sin(-midAngle * RAD);
          return (
            <text
              x={x}
              y={y}
              fill="#FFFFFF"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={700}
            >
              {value}
            </text>
          );
        }}
      >
        {data.map((row, i) => (
          <Cell key={i} fill={sliceFill(row, i)} />
        ))}
        <Label
          content={({ viewBox }) => {
            const cx = viewBox?.cx;
            const cy = viewBox?.cy;
            if (cx == null || cy == null) return null;
            return (
              <g>
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fill={theme.axis}
                  fontSize={10}
                  fontWeight={700}
                  letterSpacing="0.08em"
                >
                  TOTAL
                </text>
                <text
                  x={cx}
                  y={cy + 14}
                  textAnchor="middle"
                  fill={theme.ink}
                  fontSize={22}
                  fontWeight={800}
                >
                  {sum}
                </text>
              </g>
            );
          }}
        />
      </Pie>
      <Legend
        formatter={(value, entry) =>
          `${value}  ·  ${entry?.payload?.[dataKey] ?? ""}`
        }
      />
      <Tooltip {...tipProps(theme, name)} />
    </PieChart>
  );
}

/**
 * One chart for the whole app.
 *
 *   <Chart type="bar" title="Broker joins" data={series} total={42} name="Joined" />
 *
 * type: "bar" | "line" | "area" | "pie"
 * data: [{ label, value }]
 */
export default function Chart({
  type = "bar",
  data = [],
  title,
  total,
  name = "Value",
  dataKey = "value",
  xKey = "label",
  color = GOLD,
  height = 280,
  loading = false,
  empty = "No data.",
  actions,
  filterBar,
}) {
  const theme = useChartTheme();

  let body;
  if (loading) {
    body = <p className={styles.muted}>Loading…</p>;
  } else if (!data.length) {
    body = <p className={styles.empty}>{empty}</p>;
  } else {
    const shared = { data, dataKey, xKey, name, theme };
    body = (
      <div className={styles.chartBody} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieViz {...shared} total={total} />
          ) : (
            <Cartesian type={type} color={color} {...shared} />
          )}
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <section className={styles.block}>
      {title || actions || filterBar ? (
        <div className={styles.head}>
          <div className={styles.headTop}>
            {title ? (
              <div className={styles.titleRow}>
                <TitleIcon type={type} />
                <h2 className={styles.title}>{title}</h2>
              </div>
            ) : (
              <span />
            )}
            {actions ? <div className={styles.actions}>{actions}</div> : null}
          </div>
          {filterBar ? <div className={styles.filterBar}>{filterBar}</div> : null}
        </div>
      ) : null}
      <div className={type === "pie" ? `${styles.card} ${styles.cardPie}` : styles.card}>
        {total != null && type !== "pie" ? (
          <p className={styles.total}>
            <span>Total</span>
            <strong>{total}</strong>
          </p>
        ) : null}
        {body}
      </div>
    </section>
  );
}
