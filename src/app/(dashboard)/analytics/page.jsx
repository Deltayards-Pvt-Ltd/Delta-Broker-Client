"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isBrokerRole, isStaffRole } from "@/lib/roles";
import { fetchBrokerAnalytics } from "@/lib/analyticsApi";
import { fetchLeadFilterMeta } from "@/lib/leadApi";
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

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function yearList(nowYear) {
  const years = [];
  for (let y = nowYear; y >= 2020; y--) years.push(y);
  return years;
}

function FilterIcons({ open, onToggle, active, onClear }) {
  return (
    <>
      {active && onClear ? (
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onClear}
          aria-label="Clear filter"
        >
          <X size={16} strokeWidth={2.25} />
        </button>
      ) : null}
      <button
        type="button"
        className={`${styles.iconBtn}${open ? ` ${styles.iconBtnOn}` : ""}`}
        onClick={onToggle}
        aria-label={open ? "Hide filters" : "Show filters"}
        aria-expanded={open}
      >
        <Search size={16} strokeWidth={2.25} />
        {active ? <span className={styles.iconDot} /> : null}
      </button>
    </>
  );
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
    <>
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
    </>
  );
}

function DateRangeFilters({ startDate, endDate, onStart, onEnd }) {
  const max = todayIso();
  return (
    <>
      <label className={styles.field}>
        <span>Start</span>
        <input
          type="date"
          className={`${styles.filter} ${styles.filterDate}`}
          value={startDate}
          max={endDate || max}
          onChange={(e) => onStart(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span>End</span>
        <input
          type="date"
          className={`${styles.filter} ${styles.filterDate}`}
          value={endDate}
          min={startDate || undefined}
          max={max}
          onChange={(e) => onEnd(e.target.value)}
        />
      </label>
    </>
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [joins, setJoins] = useState(null);
  const [leadStatus, setLeadStatus] = useState(null);
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

      if (isStaff) {
        const params =
          mode === "year" ? { mode, fromYear, toYear } : { mode, year };
        jobs.push(fetchBrokerAnalytics(params).then(setJoins));
      }
      if (isBroker) {
        jobs.push(
          fetchLeadFilterMeta({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }).then(setLeadStatus)
        );
      }

      await Promise.all(jobs);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [
    user,
    isStaff,
    isBroker,
    mode,
    year,
    fromYear,
    toYear,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  if (authLoading) return <p className={styles.muted}>Loading…</p>;

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
          actions={
            <FilterIcons
              open={filterOpen}
              onToggle={() => setFilterOpen((v) => !v)}
            />
          }
          filterBar={
            filterOpen ? (
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
            ) : null
          }
        />
      ) : null}

      {isBroker ? (
        <Chart
          type="pie"
          title="Leads by status"
          name="Leads"
          data={[...(leadStatus?.statuses || [])]
            .sort((a, b) => (b.count || 0) - (a.count || 0))
            .map((s) => ({ label: s.name, value: s.count || 0 }))}
          total={loading ? "—" : leadStatus?.leadsCount ?? 0}
          loading={loading}
          empty="No leads in this range."
          actions={
            <FilterIcons
              open={filterOpen}
              onToggle={() => setFilterOpen((v) => !v)}
              active={!!(startDate || endDate)}
              onClear={() => {
                setStartDate("");
                setEndDate("");
              }}
            />
          }
          filterBar={
            filterOpen ? (
              <DateRangeFilters
                startDate={startDate}
                endDate={endDate}
                onStart={setStartDate}
                onEnd={setEndDate}
              />
            ) : null
          }
          height={320}
        />
      ) : null}
    </div>
  );
}
