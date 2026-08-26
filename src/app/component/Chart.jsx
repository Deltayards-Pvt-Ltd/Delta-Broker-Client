"use client";

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
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
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

function PieViz({ data, dataKey, xKey, name, theme, ...rest }) {
  return (
    <PieChart {...rest}>
      <Pie
        data={data}
        dataKey={dataKey}
        nameKey={xKey}
        cx="50%"
        cy="50%"
        innerRadius={58}
        outerRadius={96}
        paddingAngle={2}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
        ))}
      </Pie>
      <Legend />
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
            <PieViz {...shared} />
          ) : (
            <Cartesian type={type} color={color} {...shared} />
          )}
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <section className={styles.block}>
      {title || actions ? (
        <div className={styles.head}>
          {title ? <h2 className={styles.title}>{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      <div className={styles.card}>
        {total != null ? (
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
