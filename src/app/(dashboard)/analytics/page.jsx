"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchAnalytics } from "@/lib/analyticsApi";
import { isBrokerRole, isStaffRole, staffLabel } from "@/lib/roles";
import Chart from "@/app/component/Chart";
import styles from "./analytics.module.css";

const MODES = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
];

const FC_MODES = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
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

function Field({ label, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLbl}>{label}</span>
      {children}
    </label>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const staff = isStaffRole(user?.role);
  const broker = isBrokerRole(user?.role);
  const nowYear = useMemo(() => istYear(), []);
  const years = useMemo(() => yearList(nowYear), [nowYear]);

  const [mode, setMode] = useState("month");
  const [year, setYear] = useState(nowYear);
  const [fromYear, setFromYear] = useState(nowYear - 4);
  const [toYear, setToYear] = useState(nowYear);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fromYear > toYear) setToYear(fromYear);
  }, [fromYear, toYear]);

  const load = useCallback(async () => {
    if (!staff && !broker) return;
    setLoading(true);
    setError("");
    try {
      const params = staff
        ? mode === "year"
          ? { mode, fromYear, toYear }
          : { mode, year }
        : {
            startDate,
            endDate,
            mode: mode === "quarter" ? "month" : mode,
            year,
            fromYear,
            toYear,
          };
      const res = await fetchAnalytics(params);
      setCharts(res.charts || []);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
      setCharts([]);
    } finally {
      setLoading(false);
    }
  }, [staff, broker, mode, year, fromYear, toYear, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  if (!staff && !broker) return null;

  const staffFilters = (
    <>
      <Field label="View">
        <select
          className={styles.select}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          {MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>
      {mode === "year" ? (
        <>
          <Field label="From">
            <select
              className={styles.select}
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
          </Field>
          <Field label="To">
            <select
              className={styles.select}
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
          </Field>
        </>
      ) : (
        <Field label="Year">
          <select
            className={styles.select}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );

  const fcMode = mode === "quarter" ? "month" : mode;
  const fcFilters = (
    <>
      <Field label="View">
        <select
          className={styles.select}
          value={fcMode}
          onChange={(e) => setMode(e.target.value)}
        >
          {FC_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>
      {fcMode === "year" ? (
        <>
          <Field label="From">
            <select
              className={styles.select}
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
          </Field>
          <Field label="To">
            <select
              className={styles.select}
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
          </Field>
        </>
      ) : (
        <Field label="Year">
          <select
            className={styles.select}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );

  const brokerFilters = (
    <>
      <Field label="Start">
        <input
          className={styles.select}
          type="date"
          max={endDate || undefined}
          value={startDate}
          onChange={(e) => {
            const v = e.target.value;
            if (endDate && v && v > endDate) {
              setStartDate(endDate);
              setEndDate(v);
            } else setStartDate(v);
          }}
        />
      </Field>
      <Field label="End">
        <input
          className={styles.select}
          type="date"
          min={startDate || undefined}
          value={endDate}
          onChange={(e) => {
            const v = e.target.value;
            if (startDate && v && v < startDate) {
              setEndDate(startDate);
              setStartDate(v);
            } else setEndDate(v);
          }}
        />
      </Field>
    </>
  );

  const dateActive = !!(startDate || endDate);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{staffLabel(user?.role)}</p>
          <h1 className={styles.title}>Analytics</h1>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {charts.length
        ? charts.map((ch) => (
            <Chart
              key={ch.id}
              type={ch.type}
              title={ch.title}
              name={ch.name}
              data={ch.series}
              total={loading ? "—" : ch.total}
              loading={loading}
              empty={ch.empty}
              actions={
                ch.id === "joins" ||
                ch.id === "fcPartners" ||
                ch.id === "leadStatus" ||
                ch.id === "fcSeries" ? (
                  <>
                    {ch.id === "leadStatus" && dateActive ? (
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                        }}
                        aria-label="Clear dates"
                      >
                        <X size={16} strokeWidth={2} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${
                        filterOpen ? styles.iconBtnOn : ""
                      }`}
                      onClick={() => setFilterOpen((v) => !v)}
                      aria-label="Toggle filters"
                    >
                      <Search size={16} strokeWidth={2} />
                      {ch.id === "leadStatus" && dateActive ? (
                        <span className={styles.iconDot} />
                      ) : null}
                    </button>
                  </>
                ) : null
              }
              filterBar={
                filterOpen
                  ? ch.id === "joins" || ch.id === "fcPartners"
                    ? staffFilters
                    : ch.id === "leadStatus"
                      ? brokerFilters
                      : ch.id === "fcSeries"
                        ? fcFilters
                        : undefined
                  : undefined
              }
            />
          ))
        : loading
          ? <p className={styles.empty}>Loading…</p>
          : null}
    </div>
  );
}
