"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { isStaffRole } from "@/lib/roles";
import { fetchBrokerAnalytics } from "@/lib/analyticsApi";
import styles from "./analytics.module.css";

const MODES = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
];

const GOLD = "#C5A059";

function istYear() {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
    }).format(new Date())
  );
}

function yearList(nowYear) {
  const years = [];
  for (let y = nowYear; y >= 2020; y--) years.push(y);
  return years;
}

function ChartCard({ title, actions, total, children }) {
  return (
    <section className={styles.chartBlock}>
      <div className={styles.chartHead}>
        <h2 className={styles.chartTitle}>{title}</h2>
        {actions}
      </div>
      <div className={styles.chartCard}>
        <p className={styles.chartTotal}>
          <span>Total</span>
          <strong>{total}</strong>
        </p>
        {children}
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isLight } = useTheme();
  const nowYear = useMemo(() => istYear(), []);
  const years = useMemo(() => yearList(nowYear), [nowYear]);

  const [mode, setMode] = useState("month");
  const [year, setYear] = useState(nowYear);
  const [fromYear, setFromYear] = useState(nowYear - 4);
  const [toYear, setToYear] = useState(nowYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isStaff = isStaffRole(user?.role);
  const axis = isLight ? "#8b909a" : "rgba(255,255,255,0.45)";
  const grid = isLight ? "rgba(17,24,39,0.08)" : "rgba(255,255,255,0.08)";
  const tipBg = isLight ? "#ffffff" : "#1c1f27";
  const tipInk = isLight ? "#1a1f2b" : "#ffffff";
  const tipLine = isLight ? "rgba(17,24,39,0.1)" : "rgba(255,255,255,0.14)";

  useEffect(() => {
    if (fromYear > toYear) setToYear(fromYear);
  }, [fromYear, toYear]);

  const load = useCallback(async () => {
    if (!isStaff) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchBrokerAnalytics(
        mode === "year" ? { mode, fromYear, toYear } : { mode, year }
      );
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isStaff, mode, year, fromYear, toYear]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  if (authLoading) {
    return <p className={styles.muted}>Loading…</p>;
  }

  if (!isStaff) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Admin access required.</p>
      </div>
    );
  }

  const series = data?.series || [];
  const filters = (
    <div className={styles.toolbar}>
      <label className={styles.field}>
        <span>View</span>
        <select
          className={styles.filter}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          {MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      {mode === "year" ? (
        <>
          <label className={styles.field}>
            <span>From</span>
            <select
              className={styles.filter}
              value={fromYear}
              onChange={(e) => setFromYear(Number(e.target.value))}
            >
              {years
                .filter((y) => y <= toYear)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>To</span>
            <select
              className={styles.filter}
              value={toYear}
              onChange={(e) => setToYear(Number(e.target.value))}
            >
              {years
                .filter((y) => y >= fromYear)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </label>
        </>
      ) : (
        <label className={styles.field}>
          <span>Year</span>
          <select
            className={styles.filter}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Admin</p>
        <h1 className={styles.title}>Analytics</h1>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <ChartCard
        title="Broker joins"
        actions={filters}
        total={loading ? "—" : data?.total ?? 0}
      >
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : series.length === 0 ? (
          <p className={styles.empty}>No joins in this range.</p>
        ) : (
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={series}
                margin={{ top: 22, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: axis, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: axis, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{
                    fill: isLight
                      ? "rgba(197,160,89,0.08)"
                      : "rgba(197,160,89,0.12)",
                  }}
                  contentStyle={{
                    background: tipBg,
                    border: `1px solid ${tipLine}`,
                    borderRadius: 12,
                    color: tipInk,
                    fontSize: 13,
                    fontWeight: 650,
                  }}
                  formatter={(value) => [value, "Joined"]}
                />
                <Bar
                  dataKey="value"
                  fill={GOLD}
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                >
                  <LabelList
                    dataKey="value"
                    position="top"
                    fill={isLight ? "#1a1f2b" : "#ffffff"}
                    fontSize={12}
                    fontWeight={700}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
