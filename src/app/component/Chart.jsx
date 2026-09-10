"use client";

import { statusBadgeColors } from "@/lib/leadDisplay";
import styles from "./Chart.module.css";

const RANK_COLORS = ["#2563EB", "#DC2626", "#059669", "#7C3AED", "#EA580C"];
const BAR_COLORS = [
  "#C5A059",
  "#8B7355",
  "#D4BC8A",
  "#6B5A3E",
  "#A68B4B",
  "#E8D5A3",
  "#B07A3A",
  "#7A5C38",
  "#C4A574",
  "#9A6B3C",
  "#E0C98E",
  "#5C4C38",
];

function axisMax(values) {
  const m = Math.max(0, ...values);
  if (m <= 4) return 4;
  if (m <= 8) return 8;
  const step = m <= 20 ? 2 : m <= 40 ? 5 : 10;
  return Math.ceil(m / (step * 4)) * step * 4;
}

function pointsOf(data) {
  return (data || []).map((row, i) => ({
    label: String(row.label ?? ""),
    value: Number(row.value) || 0,
    color:
      row.color ||
      statusBadgeColors(row.label).bg ||
      BAR_COLORS[i % BAR_COLORS.length],
  }));
}

function Donut({ slices, total }) {
  const size = 176;
  const strokeW = 34;
  const cx = size / 2;
  const r = (size - strokeW) / 2;
  const C = 2 * Math.PI * r;
  const sum = slices.reduce((n, s) => n + s.value, 0) || 1;
  let acc = 0;
  const slots = slices.map((s, i) => {
    const frac = s.value / sum;
    const mid = (acc + frac / 2) * 2 * Math.PI - Math.PI / 2;
    const slot = {
      ...s,
      i,
      startDeg: acc * 360,
      len: C * frac,
      lx: cx + Math.cos(mid) * r,
      ly: cx + Math.sin(mid) * r,
    };
    acc += frac;
    return slot;
  });

  return (
    <div className={styles.donut} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slots.map((s) => (
          <circle
            key={`${s.label}-${s.i}`}
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
            strokeDasharray={`${s.len} ${C}`}
            transform={`rotate(${s.startDeg - 90} ${cx} ${cx})`}
          />
        ))}
        {slots.map((s) =>
          s.value ? (
            <text
              key={`lbl-${s.i}`}
              x={s.lx}
              y={s.ly}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#FFFFFF"
              fontSize="13"
              fontWeight="700"
            >
              {s.value}
            </text>
          ) : null
        )}
      </svg>
      <div className={styles.donutCenter}>
        <span className={styles.donutLbl}>Total</span>
        <span className={styles.donutVal}>{total}</span>
      </div>
    </div>
  );
}

function Bars({ points, name }) {
  const max = axisMax(points.map((p) => p.value));
  return (
    <div className={styles.plot}>
      <div className={styles.bars}>
        {points.map((p, i) => (
          <div key={`${p.label}-${i}`} className={styles.col} title={`${p.label} · ${p.value} ${name}`}>
            <span className={styles.topVal}>{p.value}</span>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{
                  height: `${max ? (p.value / max) * 100 : 0}%`,
                  background: `linear-gradient(180deg, ${BAR_COLORS[(i + 2) % BAR_COLORS.length]}, ${BAR_COLORS[i % BAR_COLORS.length]})`,
                }}
              />
            </div>
            <span className={styles.xLbl}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Area({ points }) {
  const max = axisMax(points.map((p) => p.value));
  const w = 640;
  const h = 240;
  const padL = 28;
  const padR = 16;
  const padT = 18;
  const padB = 32;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const n = points.length;
  const xAt = (i) =>
    padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v) => padT + innerH - (max ? (v / max) * innerH : 0);
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`)
    .join(" ");
  const lastX = xAt(Math.max(n - 1, 0));
  const firstX = xAt(0);
  const baseY = padT + innerH;
  const area = `${line} L${lastX.toFixed(1)},${baseY} L${firstX.toFixed(1)},${baseY} Z`;

  return (
    <div className={styles.plot}>
      <svg viewBox={`0 0 ${w} ${h}`} className={styles.areaSvg} role="img">
        <path d={area} fill="rgba(197,160,89,0.22)" />
        <path
          d={line}
          fill="none"
          stroke="#C5A059"
          strokeWidth="2.75"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <circle
              cx={xAt(i)}
              cy={yAt(p.value)}
              r="4.5"
              fill="#C5A059"
            />
            <text
              x={xAt(i)}
              y={h - 10}
              textAnchor="middle"
              className={styles.areaLbl}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function RankList({ points }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className={styles.rankWrap}>
      {points.map((p, i) => {
        const color = RANK_COLORS[i % RANK_COLORS.length];
        return (
          <div key={`${p.label}-${i}`} className={styles.rankRow}>
            <div className={styles.rankTop}>
              <span className={styles.rankBadge} style={{ background: color }}>
                {i + 1}
              </span>
              <span className={styles.rankName}>{p.label}</span>
              <span className={styles.rankVal} style={{ color }}>
                {p.value}
              </span>
            </div>
            <div className={styles.rankTrack}>
              <div
                className={styles.rankFill}
                style={{
                  width: `${(p.value / max) * 100}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Chart({
  type = "bar",
  title,
  name = "Value",
  data = [],
  total,
  loading = false,
  empty = "No data.",
  actions,
  filterBar,
}) {
  const points = pointsOf(data);
  const pieTotal = total ?? points.reduce((n, p) => n + p.value, 0);

  let body;
  if (loading) {
    body = <p className={styles.empty}>Loading…</p>;
  } else if (!points.length) {
    body = <p className={styles.empty}>{empty}</p>;
  } else if (type === "pie") {
    body = (
      <div className={styles.pieWrap}>
        <Donut slices={points} total={pieTotal} />
        {points.map((p, i) => (
          <div key={`${p.label}-${i}`} className={styles.legendRow}>
            <span className={styles.legendDot} style={{ background: p.color }} />
            <span className={styles.legendLbl}>{p.label}</span>
            <span className={styles.legendVal}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  } else if (type === "rank") {
    body = <RankList points={points} />;
  } else if (type === "line" || type === "area") {
    body = <Area points={points} />;
  } else {
    body = <Bars points={points} name={name} />;
  }

  return (
    <section className={styles.block}>
      {title || actions || filterBar ? (
        <header className={styles.head}>
          <div className={styles.headTop}>
            {title ? <h2 className={styles.title}>{title}</h2> : <span />}
            {actions ? <div className={styles.actions}>{actions}</div> : null}
          </div>
          {filterBar ? <div className={styles.filterBar}>{filterBar}</div> : null}
        </header>
      ) : null}

      <div className={`${styles.card} ${type === "pie" || type === "rank" ? styles.cardFlush : ""}`}>
        {total != null && type !== "pie" && type !== "rank" ? (
          <div className={styles.total}>
            <span className={styles.totalLbl}>Total</span>
            <span className={styles.totalVal}>{loading ? "—" : total}</span>
          </div>
        ) : null}
        {body}
      </div>
    </section>
  );
}
