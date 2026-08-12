"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OFFER_AUDIENCES, createOffer, updateOffer } from "@/lib/offerApi";
import { fetchCategories } from "@/lib/categoryApi";
import { fetchBrokers } from "@/lib/brokerApi";
import { fetchProjects } from "@/lib/projectApi";
import styles from "./offers.module.css";

function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function OfferForm({ mode = "create", initial = null }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [bannerImage, setBannerImage] = useState(initial?.bannerImage || "");
  const [link, setLink] = useState(initial?.link || "");
  const [projectId, setProjectId] = useState(
    initial?.project?._id || initial?.project || ""
  );
  const [active, setActive] = useState(initial?.active !== false);
  const [startsAt, setStartsAt] = useState(toInputDate(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toInputDate(initial?.endsAt));
  const [sendBroadcast, setSendBroadcast] = useState(mode === "create");
  const [audience, setAudience] = useState("all");
  const [categoryIds, setCategoryIds] = useState([]);
  const [brokerIds, setBrokerIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [brokerSearch, setBrokerSearch] = useState("");
  const [brokerHits, setBrokerHits] = useState([]);
  const [selectedBrokers, setSelectedBrokers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories()
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
    fetchProjects({ filter: "active", limit: 100 })
      .then((d) => setProjects(d.projects || d.items || []))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (!sendBroadcast || audience !== "brokers") return;
    const q = brokerSearch.trim();
    if (q.length < 2) {
      setBrokerHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const data = await fetchBrokers({ status: "approved", q, limit: 20 });
        if (!cancelled) setBrokerHits(data.brokers || []);
      } catch {
        if (!cancelled) setBrokerHits([]);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [brokerSearch, audience, sendBroadcast]);

  const submitLabel = useMemo(() => {
    if (mode === "edit") {
      return sendBroadcast ? "Save & broadcast" : "Save offer";
    }
    return sendBroadcast ? "Create & broadcast" : "Create offer";
  }, [mode, sendBroadcast]);

  const toggleCategory = (id) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleBroker = (broker) => {
    const id = String(broker._id);
    setBrokerIds((prev) => {
      if (prev.includes(id)) {
        setSelectedBrokers((s) => s.filter((b) => String(b._id) !== id));
        return prev.filter((x) => x !== id);
      }
      setSelectedBrokers((s) =>
        s.some((b) => String(b._id) === id) ? s : [...s, broker]
      );
      return [...prev, id];
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (sendBroadcast && audience === "categories" && categoryIds.length === 0) {
      setError("Select at least one category for the broadcast.");
      return;
    }
    if (sendBroadcast && audience === "brokers" && brokerIds.length === 0) {
      setError("Select at least one broker for the broadcast.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      bannerImage: bannerImage.trim(),
      link: link.trim(),
      projectId: projectId || null,
      active,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      sendBroadcast,
      ...(sendBroadcast
        ? { audience, categoryIds, brokerIds }
        : {}),
    };

    setBusy(true);
    try {
      if (mode === "edit" && initial?._id) {
        await updateOffer(initial._id, payload);
      } else {
        await createOffer(payload);
      }
      router.push("/offers");
      router.refresh();
    } catch (err) {
      setError(err.message || "Failed to save offer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.field}>
        <label>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Early bird brokerage boost"
          required
        />
      </div>

      <div className={styles.field}>
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What partners need to know…"
        />
      </div>

      <div className={styles.field}>
        <label>Banner image URL (optional)</label>
        <input
          value={bannerImage}
          onChange={(e) => setBannerImage(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className={styles.field}>
        <label>External / deep link (optional)</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className={styles.field}>
        <label>Scope</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Global — visible to all partners</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              Project — {p.name} (all partners, on that project too)
            </option>
          ))}
        </select>
        <p className={styles.hint}>
          Offers are always visible to every approved channel partner. Scope only
          decides global vs project placement.
        </p>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Starts</label>
          <input
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>Ends</label>
          <input
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active (visible to all partners)
      </label>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={sendBroadcast}
          onChange={(e) => setSendBroadcast(e.target.checked)}
        />
        Also send broadcast (inbox + push)
      </label>

      {sendBroadcast ? (
        <>
          <div className={styles.field}>
            <label>Broadcast audience only</label>
            <p className={styles.hint}>
              Who gets notified. Does not hide the offer from other partners.
            </p>
            <div className={styles.chips}>
              {OFFER_AUDIENCES.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  className={`${styles.chip} ${
                    audience === a.key ? styles.chipOn : ""
                  }`}
                  onClick={() => setAudience(a.key)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {audience === "categories" ? (
            <div className={styles.field}>
              <label>Notify categories</label>
              <div className={styles.chips}>
                {categories.map((c) => {
                  const id = String(c._id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`${styles.chip} ${
                        categoryIds.includes(id) ? styles.chipOn : ""
                      }`}
                      onClick={() => toggleCategory(id)}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
              {!categories.length ? (
                <p className={styles.hint}>
                  No categories yet — create some under Brokers → Categories.
                </p>
              ) : null}
            </div>
          ) : null}

          {audience === "brokers" ? (
            <div className={styles.field}>
              <label>Notify selected brokers</label>
              <input
                value={brokerSearch}
                onChange={(e) => setBrokerSearch(e.target.value)}
                placeholder="Search approved brokers…"
              />
              <div className={styles.chips}>
                {brokerHits.map((b) => {
                  const id = String(b._id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`${styles.chip} ${
                        brokerIds.includes(id) ? styles.chipOn : ""
                      }`}
                      onClick={() => toggleBroker(b)}
                    >
                      {b.name || b.phone}
                    </button>
                  );
                })}
              </div>
              {selectedBrokers.length ? (
                <p className={styles.hint}>
                  Selected:{" "}
                  {selectedBrokers.map((b) => b.name || b.phone).join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <button className={styles.btn} type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={() => router.push("/offers")}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
