"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, ImagePlus, Upload, X } from "lucide-react";
import { createOffer, updateOffer } from "@/lib/offerApi";
import { fetchProjects } from "@/lib/projectApi";
import { uploadOfferFilesToS3 } from "@/lib/s3Upload";
import styles from "./offers.module.css";

/** Calendar YYYY-MM-DD in local time (avoid UTC day shift). */
function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(isoDay) {
  if (!isoDay) return "";
  const [y, m, d] = isoDay.split("-").map(Number);
  if (!y || !m || !d) return isoDay;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DateField({ id, label, value, onChange, min, disabled }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el || disabled) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.dateWrap}>
        <button
          type="button"
          className={styles.dateFace}
          onClick={openPicker}
          disabled={disabled}
          aria-label={label}
        >
          <CalendarDays size={18} strokeWidth={1.75} aria-hidden />
          <span className={value ? styles.dateValue : styles.datePlaceholder}>
            {value ? formatDisplayDate(value) : "Pick a date"}
          </span>
        </button>
        {value ? (
          <button
            type="button"
            className={styles.dateClear}
            onClick={() => onChange("")}
            disabled={disabled}
            aria-label={`Clear ${label}`}
          >
            <X size={14} strokeWidth={2} />
          </button>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          className={styles.dateNative}
          type="date"
          value={value}
          min={min || undefined}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

function ProjectSelect({ id, value, projects, onChange, disabled }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = projects.find((p) => String(p._id) === String(value));
  const label = selected?.name || "Global";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (next) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className={styles.projectSelect} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className={styles.dropdownTrigger}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown
          size={16}
          className={`${styles.dropdownChevron} ${
            open ? styles.dropdownChevronOpen : ""
          }`}
        />
      </button>
      {open ? (
        <ul className={styles.selectMenu} role="listbox">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={`${styles.selectItem} ${
                !value ? styles.selectItemOn : ""
              }`}
              onClick={() => pick("")}
            >
              Global
            </button>
          </li>
          {projects.map((p) => {
            const on = String(p._id) === String(value);
            return (
              <li key={p._id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={`${styles.selectItem} ${
                    on ? styles.selectItemOn : ""
                  }`}
                  onClick={() => pick(p._id)}
                >
                  {p.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function OfferForm({ mode = "create", initial = null }) {
  const router = useRouter();
  const imageInputRef = useRef(null);
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [projectId, setProjectId] = useState(
    initial?.project?._id || initial?.project || ""
  );
  const [active, setActive] = useState(initial?.active !== false);
  const [startsAt, setStartsAt] = useState(toInputDate(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toInputDate(initial?.endsAt));
  const isEdit = mode === "edit";
  const [sendBroadcast, setSendBroadcast] = useState(false);
  const [projects, setProjects] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [existingImageUrl, setExistingImageUrl] = useState(
    initial?.bannerImage || ""
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    fetchProjects({ filter: "active", limit: 100 })
      .then((d) => setProjects(d.projects || d.items || []))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const displayImage =
    imageChanged && imagePreview
      ? imagePreview
      : existingImageUrl || null;

  const submitLabel = useMemo(() => {
    if (isEdit) return "Save offer";
    return sendBroadcast ? "Create & notify all" : "Create offer";
  }, [isEdit, sendBroadcast]);

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPEG, PNG, WebP, or GIF).");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageChanged(true);
    setError("");
  };

  const onClearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageChanged(true);
    setExistingImageUrl("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (startsAt && endsAt && endsAt < startsAt) {
      setError("End date must be on or after the start date.");
      return;
    }
    if (active && endsAt) {
      const end = new Date(`${endsAt}T23:59:59`);
      if (!Number.isNaN(end.getTime()) && end < new Date()) {
        setError(
          "End date is in the past. Extend it before marking Active / visible."
        );
        return;
      }
    }

    setBusy(true);
    try {
      let bannerImage = existingImageUrl || "";
      if (imageChanged) {
        if (imageFile instanceof File) {
          const uploaded = await uploadOfferFilesToS3(title.trim(), [
            { field: "bannerImage", file: imageFile },
          ]);
          bannerImage = uploaded[0]?.publicUrl || "";
        } else {
          bannerImage = "";
        }
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        bannerImage,
        link: "",
        projectId: projectId || null,
        active,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
      };
      if (!isEdit) {
        payload.sendBroadcast = sendBroadcast;
        if (sendBroadcast) payload.audience = "all";
      }

      if (isEdit && initial?._id) {
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
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Offer details</h2>

        <div className={styles.field}>
          <label htmlFor="offer-title">Title</label>
          <input
            id="offer-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Early bird brokerage boost"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="offer-desc">Description</label>
          <textarea
            id="offer-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Offer details…"
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Offer image</span>
          <div className={styles.mediaBox}>
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayImage} alt="" className={styles.mediaPreview} />
            ) : (
              <div className={styles.mediaEmpty}>
                <ImagePlus size={22} strokeWidth={1.75} />
                <span>No image yet</span>
              </div>
            )}
            <div className={styles.mediaActions}>
              <button
                type="button"
                className={styles.mediaBtn}
                onClick={() => imageInputRef.current?.click()}
                disabled={busy}
              >
                <Upload size={14} strokeWidth={2} />
                {displayImage ? "Replace" : "Upload"}
              </button>
              {displayImage ? (
                <button
                  type="button"
                  className={styles.mediaBtnDanger}
                  onClick={onClearImage}
                  disabled={busy}
                >
                  <X size={14} strokeWidth={2} />
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={styles.hiddenInput}
            onChange={onPickImage}
            disabled={busy}
          />
          <p className={styles.hint}>
            Uploaded to S3 and shown in the admin list + partner app.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Project & schedule</h2>

        <div className={styles.field}>
          <label htmlFor="offer-project">Project</label>
          <ProjectSelect
            id="offer-project"
            value={projectId}
            projects={projects}
            onChange={setProjectId}
            disabled={busy}
          />
          <p className={styles.hint}>
            Global = Offers home. Pick a project to also show it there.
          </p>
        </div>

        <div className={styles.row}>
          <DateField
            id="offer-starts"
            label="Starts (optional)"
            value={startsAt}
            onChange={(v) => {
              setStartsAt(v);
              if (v && endsAt && endsAt < v) setEndsAt("");
            }}
            disabled={busy}
          />
          <DateField
            id="offer-ends"
            label="Ends (optional)"
            value={endsAt}
            onChange={setEndsAt}
            min={startsAt || undefined}
            disabled={busy}
          />
        </div>
        <p className={styles.hint}>
          Leave blank for no schedule. Future starts still show with a “Starting
          soon” badge. After the end date the offer auto-deactivates for
          partners.
        </p>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Active (visible to partners)
        </label>
        <p className={styles.hint}>
          Toggle anytime. To bring an expired offer back: extend the end date,
          then mark Active.
        </p>
      </section>

      {!isEdit ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Broadcast (optional)</h2>

          <div className={styles.notifyPanel}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={sendBroadcast}
                onChange={(e) => setSendBroadcast(e.target.checked)}
              />
              Send notification to all partners
            </label>
            <p className={styles.hint}>
              {sendBroadcast
                ? "Inbox + push go to every approved / active partner."
                : "Unchecked — create only, no notifications."}
            </p>
          </div>
        </section>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <button className={styles.btn} type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
        <Link
          href="/offers"
          className={`${styles.btn} ${styles.btnGhost}`}
          aria-disabled={busy}
          onClick={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
