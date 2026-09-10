"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
<<<<<<< HEAD
import { fetchAnalytics } from "@/lib/analyticsApi";
import { isBrokerRole, isStaffRole, staffLabel } from "@/lib/roles";
=======
import { isBrokerRole, isStaffRole } from "@/lib/roles";
import { fetchBrokerAnalytics } from "@/lib/analyticsApi";
import { fetchLeadFilterMeta } from "@/lib/leadApi";
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
import Chart from "@/app/component/Chart";
import styles from "./analytics.module.css";

const MODES = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
];

<<<<<<< HEAD
const FC_MODES = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
];

=======
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
function istYear() {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
    }).format(new Date())
  );
}

<<<<<<< HEAD
=======
function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
function yearList(nowYear) {
  const years = [];
  for (let y = nowYear; y >= 2020; y--) years.push(y);
  return years;
}

<<<<<<< HEAD
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
=======
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
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          {MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
<<<<<<< HEAD
      </Field>
      {mode === "year" ? (
        <>
          <Field label="From">
            <select
              className={styles.select}
=======
      </label>

      {mode === "year" ? (
        <>
          <label className={styles.field}>
            <span>From</span>
            <select
              className={styles.filter}
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
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
<<<<<<< HEAD
          </Field>
          <Field label="To">
            <select
              className={styles.select}
=======
          </label>
          <label className={styles.field}>
            <span>To</span>
            <select
              className={styles.filter}
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
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
<<<<<<< HEAD
          </Field>
        </>
      ) : (
        <Field label="Year">
          <select
            className={styles.select}
=======
          </label>
        </>
      ) : (
        <label className={styles.field}>
          <span>Year</span>
          <select
            className={styles.filter}
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
<<<<<<< HEAD
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
=======
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
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468

  return (
    <div className={styles.page}>
      <header className={styles.header}>
<<<<<<< HEAD
        <div>
          <p className={styles.eyebrow}>{staffLabel(user?.role)}</p>
          <h1 className={styles.title}>Analytics</h1>
        </div>
=======
        <p className={styles.eyebrow}>
          {isStaff ? "Admin" : "Channel Partner"}
        </p>
        <h1 className={styles.title}>Analytics</h1>
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

<<<<<<< HEAD
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
=======
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
>>>>>>> 99b5f3f8eb642ce7ec434db039445b5b1e490468
    </div>
  );
}
