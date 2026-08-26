"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isBrokerRole, isStaffRole } from "@/lib/roles";
import { fetchBrokerAnalytics } from "@/lib/analyticsApi";
import Chart from "@/app/component/Chart";
import styles from "./analytics.module.css";

const MODES = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
];

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

function RangeFilters({
  mode,
  setMode,
  year,
  setYear,
  fromYear,
  setFromYear,
  toYear,
  setToYear,
  years,
}) {
  return (
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
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const nowYear = useMemo(() => istYear(), []);
  const years = useMemo(() => yearList(nowYear), [nowYear]);

  const isStaff = isStaffRole(user?.role);
  const isBroker = isBrokerRole(user?.role);

  const [mode, setMode] = useState("month");
  const [year, setYear] = useState(nowYear);
  const [fromYear, setFromYear] = useState(nowYear - 4);
  const [toYear, setToYear] = useState(nowYear);
  const [joins, setJoins] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fromYear > toYear) setToYear(fromYear);
  }, [fromYear, toYear]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const jobs = [];
      const params =
        mode === "year" ? { mode, fromYear, toYear } : { mode, year };

      if (isStaff) {
        jobs.push(fetchBrokerAnalytics(params).then(setJoins));
      }
      if (isBroker) {
        // broker chart fetches go here
      }

      await Promise.all(jobs);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [user, isStaff, isBroker, mode, year, fromYear, toYear]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  if (authLoading) return <p className={styles.muted}>Loading…</p>;

  const filters = (
    <RangeFilters
      mode={mode}
      setMode={setMode}
      year={year}
      setYear={setYear}
      fromYear={fromYear}
      setFromYear={setFromYear}
      toYear={toYear}
      setToYear={setToYear}
      years={years}
    />
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          {isStaff ? "Admin" : "Channel Partner"}
        </p>
        <h1 className={styles.title}>Analytics</h1>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {isStaff ? (
        <Chart
          type="bar"
          title="Broker joins"
          name="Joined"
          data={joins?.series || []}
          total={loading ? "—" : joins?.total ?? 0}
          loading={loading}
          empty="No joins in this range."
          actions={filters}
        />
      ) : null}

      {/* broker: drop more <Chart /> here, fetch in load() */}
    </div>
  );
}
