"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, X } from "lucide-react";
import {
  createProject,
  fetchProject,
  MONTHS,
  PLAN_OPTIONS,
  PROJECT_STATUSES,
  PROPERTY_TYPES,
  updateProject,
} from "@/lib/projectApi";
import {
  galleryTitleFromFile,
  uploadProjectFilesToS3,
} from "@/lib/s3Upload";
import styles from "./ProjectForm.module.css";

const resetFileInput = (ref) => {
  if (ref?.current) ref.current.value = "";
};

function layoutImagesFromRow(l) {
  if (Array.isArray(l?.images) && l.images.length) {
    return l.images.map((u) => String(u || "").trim()).filter(Boolean);
  }
  const single = String(l?.image || "").trim();
  return single ? [single] : [];
}

function loadTitledAssets(val, urlKey) {
  if (!val) return [];
  if (typeof val === "string" && val.trim()) {
    return [{ _id: "legacy", title: "Project", [urlKey]: val.trim() }];
  }
  return (Array.isArray(val) ? val : []).map((x, i) => ({
    _id: x._id || `existing-${urlKey}-${i}`,
    title: x.title || "",
    [urlKey]: x[urlKey] || x.file || x.image || "",
  }));
}

function normalizeContact(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

function emptyForm() {
  return {
    name: "",
    builder: "",
    location: "",
    propertyType: "",
    status: "Under Construction",
    contactNumber: "",
    latitude: "",
    longitude: "",
    description: "",
    reraNo: "",
    reraMonth: "",
    reraYear: "",
    active: true,
  };
}

function formFromProject(p) {
  return {
    name: p.name || "",
    builder: p.builder || "",
    location: p.location || "",
    propertyType: p.propertyType || "",
    status: p.status || "Under Construction",
    contactNumber: normalizeContact(p.contactNumber),
    latitude:
      p.latitude != null && p.latitude !== "" ? String(p.latitude) : "",
    longitude:
      p.longitude != null && p.longitude !== "" ? String(p.longitude) : "",
    description: p.description || "",
    reraNo: p.reraNo || "",
    reraMonth: p.reraPossession?.month || "",
    reraYear:
      p.reraPossession?.year != null ? String(p.reraPossession.year) : "",
    active: p.active !== false,
  };
}

function MediaSlot({
  label,
  preview,
  accept,
  inputRef,
  onPick,
  onClear,
  isVideo,
  fileName,
  disabled,
}) {
  return (
    <div className={styles.mediaSlot}>
      <span className={styles.label}>{label}</span>
      <div className={styles.mediaBox}>
        {preview ? (
          isVideo ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={preview} controls className={styles.mediaPreview} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className={styles.mediaPreview} />
          )
        ) : fileName ? (
          <p className={styles.fileName}>{fileName}</p>
        ) : (
          <p className={styles.mediaEmpty}>No file</p>
        )}
        <div className={styles.mediaActions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <Upload size={14} strokeWidth={2} />
            {preview || fileName ? "Replace" : "Upload"}
          </button>
          {preview || fileName ? (
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={onClear}
              disabled={disabled}
            >
              <X size={14} strokeWidth={2} />
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        onChange={onPick}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * @param {{ mode: "create" | "edit", projectId?: string, initialProject?: object | null }} props
 */
export default function ProjectForm({
  mode,
  projectId,
  initialProject = null,
}) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const galleryInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const builderLogoInputRef = useRef(null);
  const coverImageInputRef = useRef(null);
  const coverVideoInputRef = useRef(null);
  const bannerImageInputRef = useRef(null);
  const walkthroughVideoInputRef = useRef(null);
  const ocCertInputRef = useRef(null);

  const [loading, setLoading] = useState(isEdit && !initialProject);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState([]);
  const [plans, setPlans] = useState([]);

  // create: File rows; edit: existing URLs + new File rows
  const [galleryImages, setGalleryImages] = useState([]);
  const [newGalleryImages, setNewGalleryImages] = useState([]);

  const [browcherPdfs, setBrowcherPdfs] = useState([]);
  const [newBrowcherPdfs, setNewBrowcherPdfs] = useState([]);

  const [layouts, setLayouts] = useState([]);
  const [newLayouts, setNewLayouts] = useState([]);

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoChanged, setLogoChanged] = useState(false);

  const [builderLogo, setBuilderLogo] = useState(null);
  const [builderLogoPreview, setBuilderLogoPreview] = useState(null);
  const [builderLogoChanged, setBuilderLogoChanged] = useState(false);

  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [coverImageChanged, setCoverImageChanged] = useState(false);

  const [bannerImage, setBannerImage] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  const [bannerImageChanged, setBannerImageChanged] = useState(false);

  const [coverVideo, setCoverVideo] = useState(null);
  const [coverVideoPreview, setCoverVideoPreview] = useState(null);
  const [coverVideoChanged, setCoverVideoChanged] = useState(false);

  const [walkthroughVideo, setWalkthroughVideo] = useState(null);
  const [walkthroughVideoPreview, setWalkthroughVideoPreview] = useState(null);
  const [walkthroughVideoChanged, setWalkthroughVideoChanged] = useState(false);

  const [reraCertificates, setReraCertificates] = useState([]);
  const [newReraCertificates, setNewReraCertificates] = useState([]);
  const [reraScannerImages, setReraScannerImages] = useState([]);
  const [newReraScannerImages, setNewReraScannerImages] = useState([]);
  const [ocCertificate, setOcCertificate] = useState(null);
  const [ocCertificateChanged, setOcCertificateChanged] = useState(false);
  const [existingOcUrl, setExistingOcUrl] = useState("");

  const hydrate = (p) => {
    setForm(formFromProject(p));
    setFeatures(Array.isArray(p.features) ? [...p.features] : []);
    setPlans(Array.isArray(p.plans) ? [...p.plans] : []);
    setGalleryImages(Array.isArray(p.galleryImages) ? [...p.galleryImages] : []);
    setNewGalleryImages([]);
    setLayouts(
      (p.layouts || []).map((l, i) => ({
        id: l._id || `layout-${i}`,
        title: l.title || "",
        area: l.area != null && l.area !== "" ? String(l.area) : "",
        price: l.price ?? "",
        images: layoutImagesFromRow(l),
        pendingFiles: [],
      }))
    );
    setNewLayouts([]);
    setBrowcherPdfs(loadTitledAssets(p.browcherPdf, "file"));
    setNewBrowcherPdfs([]);
    setLogo(p.logo || null);
    setBuilderLogo(p.builderLogo || null);
    setCoverImage(p.coverImage || null);
    setBannerImage(p.bannerImage || null);
    setCoverVideo(p.coverVideo || null);
    setWalkthroughVideo(p.walkthroughVideo || null);
    setLogoChanged(false);
    setBuilderLogoChanged(false);
    setCoverImageChanged(false);
    setBannerImageChanged(false);
    setCoverVideoChanged(false);
    setWalkthroughVideoChanged(false);
    setReraCertificates(loadTitledAssets(p.reraCertificate, "file"));
    setNewReraCertificates([]);
    setReraScannerImages(loadTitledAssets(p.reraScannerImage, "image"));
    setNewReraScannerImages([]);
    setOcCertificate(null);
    setOcCertificateChanged(false);
    setExistingOcUrl(p.ocCertificate || "");
    setLogoPreview(null);
    setBuilderLogoPreview(null);
    setCoverImagePreview(null);
    setBannerImagePreview(null);
    setCoverVideoPreview(null);
    setWalkthroughVideoPreview(null);
  };

  useEffect(() => {
    if (!isEdit) return;
    if (initialProject) {
      hydrate(initialProject);
      setLoading(false);
      return;
    }
    if (!projectId) {
      setError("Missing project id");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchProject(projectId);
        if (cancelled) return;
        if (!data?.project) throw new Error("Project not found");
        hydrate(data.project);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load project");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, projectId, initialProject]);

  useEffect(() => {
    return () => {
      newGalleryImages.forEach((g) => g.preview && URL.revokeObjectURL(g.preview));
      (isEdit ? [] : galleryImages).forEach(
        (g) => g.preview && URL.revokeObjectURL(g.preview)
      );
      [...newBrowcherPdfs, ...(isEdit ? [] : browcherPdfs)].forEach(
        (b) => b.preview && URL.revokeObjectURL(b.preview)
      );
      [...newReraCertificates, ...(isEdit ? [] : reraCertificates)].forEach(
        (r) => r.preview && URL.revokeObjectURL(r.preview)
      );
      [...newReraScannerImages, ...(isEdit ? [] : reraScannerImages)].forEach(
        (r) => r.preview && URL.revokeObjectURL(r.preview)
      );
      [...layouts, ...newLayouts].forEach((l) => {
        (l.pendingFiles || l.imageFiles || []).forEach(
          (p) => p.preview && URL.revokeObjectURL(p.preview)
        );
      });
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (builderLogoPreview) URL.revokeObjectURL(builderLogoPreview);
      if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
      if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
      if (coverVideoPreview) URL.revokeObjectURL(coverVideoPreview);
      if (walkthroughVideoPreview) URL.revokeObjectURL(walkthroughVideoPreview);
    };
    // intentional unmount cleanup only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const togglePlan = (plan) =>
    setPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );

  const addFeature = () => {
    const tag = featureInput.trim();
    if (!tag) return;
    if (!features.includes(tag)) setFeatures((prev) => [...prev, tag]);
    setFeatureInput("");
  };

  const displayUrl = (changed, fileOrUrl, preview, existing) => {
    if (changed && fileOrUrl instanceof File && preview) return preview;
    if (changed && (fileOrUrl === "" || fileOrUrl == null)) return null;
    if (changed && typeof fileOrUrl === "string") return fileOrUrl || null;
    if (typeof existing === "string" && existing) return existing;
    if (typeof fileOrUrl === "string" && fileOrUrl) return fileOrUrl;
    return preview || null;
  };

  const logoSrc = displayUrl(logoChanged, logo, logoPreview, logo);
  const builderLogoSrc = displayUrl(
    builderLogoChanged,
    builderLogo,
    builderLogoPreview,
    builderLogo
  );
  const coverSrc = displayUrl(
    coverImageChanged,
    coverImage,
    coverImagePreview,
    coverImage
  );
  const bannerSrc = displayUrl(
    bannerImageChanged,
    bannerImage,
    bannerImagePreview,
    bannerImage
  );
  const coverVideoSrc = displayUrl(
    coverVideoChanged,
    coverVideo,
    coverVideoPreview,
    coverVideo
  );
  const walkthroughSrc = displayUrl(
    walkthroughVideoChanged,
    walkthroughVideo,
    walkthroughVideoPreview,
    walkthroughVideo
  );

  const pickSingle = (e, { setFile, setPreview, setChanged, prevPreview }) => {
    if (prevPreview) URL.revokeObjectURL(prevPreview);
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
    setFile(file || null);
    if (setChanged) setChanged(true);
    e.target.value = "";
  };

  const clearSingle = ({
    setFile,
    setPreview,
    setChanged,
    preview,
    inputRef,
    clearToEmpty,
  }) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(clearToEmpty ? "" : null);
    if (setChanged) setChanged(true);
    resetFileInput(inputRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (!form.name.trim()) {
      setError("Project name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (!isEdit) {
        const completeLayouts = layouts.filter((l) => l.title?.trim());
        const completeBrowcherPdfs = browcherPdfs.filter(
          (b) => b.title?.trim() && b.file
        );
        const completeReraCerts = reraCertificates.filter(
          (r) => r.title?.trim() && r.file
        );
        const completeReraScanners = reraScannerImages.filter(
          (r) => r.title?.trim() && r.image
        );

        const uploadEntries = [
          ...(logo ? [{ field: "logo", file: logo }] : []),
          ...(builderLogo ? [{ field: "builderLogo", file: builderLogo }] : []),
          ...(coverImage ? [{ field: "coverImage", file: coverImage }] : []),
          ...(coverVideo ? [{ field: "coverVideo", file: coverVideo }] : []),
          ...(bannerImage ? [{ field: "bannerImage", file: bannerImage }] : []),
          ...completeBrowcherPdfs.map((b) => ({
            field: "browcherPdf",
            file: b.file,
          })),
          ...(ocCertificate
            ? [{ field: "ocCertificate", file: ocCertificate }]
            : []),
          ...completeReraCerts.map((r) => ({
            field: "reraCertificate",
            file: r.file,
          })),
          ...completeReraScanners.map((r) => ({
            field: "reraScannerImage",
            file: r.image,
          })),
          ...(walkthroughVideo
            ? [{ field: "walkthroughVideo", file: walkthroughVideo }]
            : []),
          ...galleryImages.map((g) => ({
            field: "galleryImages",
            file: g.file,
          })),
          ...completeLayouts.flatMap((l) =>
            (l.imageFiles || []).map((img) => ({
              field: "layoutImages",
              file: img.file,
            }))
          ),
        ].filter((entry) => entry.file instanceof File);

        const uploaded = await uploadProjectFilesToS3(
          form.name.trim(),
          uploadEntries
        );

        const urlByField = (field) =>
          uploaded.filter((u) => u.field === field).map((h) => h.publicUrl);

        const galleryUrls = uploaded
          .filter((u) => u.field === "galleryImages")
          .map((u) => ({
            title: galleryTitleFromFile(u.file),
            image: u.publicUrl,
          }));

        const layoutImageUrls = urlByField("layoutImages");
        let layoutImgIdx = 0;
        const layoutsPayload = completeLayouts.map((l) => {
          const images = (l.imageFiles || [])
            .map(() => layoutImageUrls[layoutImgIdx++] || "")
            .filter(Boolean);
          return {
            title: l.title.trim(),
            area: String(l.area ?? "").trim(),
            price: l.price,
            images,
            image: images[0] || "",
          };
        });

        await createProject({
          name: form.name,
          builder: form.builder,
          location: form.location,
          propertyType: form.propertyType,
          plans,
          status: form.status,
          contactNumber: form.contactNumber.trim(),
          latitude: form.latitude.trim(),
          longitude: form.longitude.trim(),
          description: form.description,
          reraNo: form.reraNo.trim(),
          reraMonth: form.reraMonth || "",
          reraYear: form.reraYear || "",
          features,
          logo: urlByField("logo")[0] || "",
          builderLogo: urlByField("builderLogo")[0] || "",
          coverImage: urlByField("coverImage")[0] || "",
          coverVideo: urlByField("coverVideo")[0] || "",
          bannerImage: urlByField("bannerImage")[0] || "",
          browcherPdf: completeBrowcherPdfs.map((b, i) => ({
            title: b.title.trim(),
            file: urlByField("browcherPdf")[i],
          })),
          walkthroughVideo: urlByField("walkthroughVideo")[0] || "",
          reraCertificate: completeReraCerts.map((r, i) => ({
            title: r.title.trim(),
            file: urlByField("reraCertificate")[i],
          })),
          reraScannerImage: completeReraScanners.map((r, i) => ({
            title: r.title.trim(),
            image: urlByField("reraScannerImage")[i],
          })),
          ocCertificate: urlByField("ocCertificate")[0] || "",
          galleryImages: galleryUrls,
          layouts: layoutsPayload,
          active: form.active,
        });

        setOk("Project created");
        router.push("/projects");
        return;
      }

      // —— edit ——
      const id = projectId;
      const uploadEntries = [];
      newBrowcherPdfs
        .filter((b) => b.title?.trim() && b.file)
        .forEach((b) =>
          uploadEntries.push({ field: "newBrowcherPdfs", file: b.file })
        );
      if (logoChanged && logo instanceof File)
        uploadEntries.push({ field: "logo", file: logo });
      if (builderLogoChanged && builderLogo instanceof File)
        uploadEntries.push({ field: "builderLogo", file: builderLogo });
      if (coverImageChanged && coverImage instanceof File)
        uploadEntries.push({ field: "coverImage", file: coverImage });
      if (bannerImageChanged && bannerImage instanceof File)
        uploadEntries.push({ field: "bannerImage", file: bannerImage });
      if (coverVideoChanged && coverVideo instanceof File)
        uploadEntries.push({ field: "coverVideo", file: coverVideo });
      if (walkthroughVideoChanged && walkthroughVideo instanceof File)
        uploadEntries.push({ field: "walkthroughVideo", file: walkthroughVideo });
      newReraCertificates
        .filter((r) => r.title?.trim() && r.file)
        .forEach((r) =>
          uploadEntries.push({ field: "newReraCertificates", file: r.file })
        );
      newReraScannerImages
        .filter((r) => r.title?.trim() && r.image)
        .forEach((r) =>
          uploadEntries.push({ field: "newReraScannerImages", file: r.image })
        );
      if (ocCertificateChanged && ocCertificate instanceof File)
        uploadEntries.push({ field: "ocCertificate", file: ocCertificate });
      newGalleryImages.forEach((img) =>
        uploadEntries.push({ field: "galleryNewImages", file: img.file })
      );
      [...layouts, ...newLayouts].forEach((l) => {
        (l.pendingFiles || []).forEach((p) => {
          uploadEntries.push({ field: "newlayoutImages", file: p.file });
        });
      });

      const uploaded =
        uploadEntries.filter((entry) => entry.file instanceof File).length > 0
          ? await uploadProjectFilesToS3(
              form.name.trim(),
              uploadEntries.filter((entry) => entry.file instanceof File)
            )
          : [];

      const firstUrl = (field) =>
        uploaded.find((u) => u.field === field)?.publicUrl;

      const newGalleryPaths = uploaded
        .filter((u) => u.field === "galleryNewImages")
        .map((u) => ({
          title: galleryTitleFromFile(u.file),
          image: u.publicUrl,
        }));

      const completeNewBrowcherPdfs = newBrowcherPdfs.filter(
        (b) => b.title?.trim() && b.file
      );
      const newBrowcherPdfUrls = uploaded
        .filter((u) => u.field === "newBrowcherPdfs")
        .map((u) => u.publicUrl);
      const completeNewReraCerts = newReraCertificates.filter(
        (r) => r.title?.trim() && r.file
      );
      const newReraCertUrls = uploaded
        .filter((u) => u.field === "newReraCertificates")
        .map((u) => u.publicUrl);
      const completeNewScanners = newReraScannerImages.filter(
        (r) => r.title?.trim() && r.image
      );
      const newScannerUrls = uploaded
        .filter((u) => u.field === "newReraScannerImages")
        .map((u) => u.publicUrl);

      const newLayoutImageUrls = uploaded
        .filter((u) => u.field === "newlayoutImages")
        .map((u) => u.publicUrl);

      let newLayoutUrlIdx = 0;
      const mapLayoutRow = (l) => {
        const uploadedUrls = (l.pendingFiles || []).map(
          () => newLayoutImageUrls[newLayoutUrlIdx++] || ""
        );
        const images = [...(l.images || []), ...uploadedUrls].filter(Boolean);
        return {
          title: l.title,
          area: String(l.area ?? "").trim(),
          price: l.price,
          images,
          image: images[0] || "",
        };
      };

      const payload = {
        id,
        name: form.name,
        builder: form.builder,
        location: form.location,
        propertyType: form.propertyType,
        plans,
        status: form.status,
        contactNumber: form.contactNumber.trim(),
        latitude: form.latitude.trim(),
        longitude: form.longitude.trim(),
        description: form.description,
        reraNo: form.reraNo.trim(),
        reraMonth: form.reraMonth || "",
        reraYear: form.reraYear || "",
        features,
        browcherPdfChanged: true,
        logoChanged,
        builderLogoChanged,
        coverImageChanged,
        bannerImageChanged,
        coverVideoChanged,
        walkthroughVideoChanged,
        reraCertificateChanged: true,
        reraScannerImageChanged: true,
        ocCertificateChanged,
        browcherPdf: (browcherPdfs || []).map((b) => ({
          title: b.title.trim(),
          file: b.file,
        })),
        newBrowcherPdfs: completeNewBrowcherPdfs.map((b, i) => ({
          title: b.title.trim(),
          file: newBrowcherPdfUrls[i],
        })),
        reraCertificate: (reraCertificates || []).map((r) => ({
          title: r.title.trim(),
          file: r.file,
        })),
        newReraCertificates: completeNewReraCerts.map((r, i) => ({
          title: r.title.trim(),
          file: newReraCertUrls[i],
        })),
        reraScannerImage: (reraScannerImages || []).map((r) => ({
          title: r.title.trim(),
          image: r.image,
        })),
        newReraScannerImages: completeNewScanners.map((r, i) => ({
          title: r.title.trim(),
          image: newScannerUrls[i],
        })),
        galleryImages: galleryImages || [],
        galleryNewImages: newGalleryPaths,
        layouts: (layouts || []).map(mapLayoutRow),
        newLayouts: (newLayouts || []).map(mapLayoutRow),
        active: form.active,
      };

      if (logoChanged)
        payload.logo =
          firstUrl("logo") || (typeof logo === "string" ? logo : "") || "";
      if (builderLogoChanged)
        payload.builderLogo =
          firstUrl("builderLogo") ||
          (typeof builderLogo === "string" ? builderLogo : "") ||
          "";
      if (coverImageChanged)
        payload.coverImage =
          firstUrl("coverImage") ||
          (typeof coverImage === "string" ? coverImage : "") ||
          "";
      if (bannerImageChanged)
        payload.bannerImage =
          firstUrl("bannerImage") ||
          (typeof bannerImage === "string" ? bannerImage : "") ||
          "";
      if (coverVideoChanged)
        payload.coverVideo =
          firstUrl("coverVideo") ||
          (typeof coverVideo === "string" ? coverVideo : "") ||
          "";
      if (walkthroughVideoChanged)
        payload.walkthroughVideo =
          firstUrl("walkthroughVideo") ||
          (typeof walkthroughVideo === "string" ? walkthroughVideo : "") ||
          "";
      if (ocCertificateChanged)
        payload.ocCertificate =
          firstUrl("ocCertificate") ||
          (typeof ocCertificate === "string" ? ocCertificate : "") ||
          "";

      await updateProject(id, payload);
      setOk("Project updated");
      router.push("/projects");
    } catch (err) {
      console.error(err);
      setError(
        err.code === "S3_CORS"
          ? err.message
          : err.message || "Error saving project"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className={styles.muted}>Loading project…</p>;
  }

  const titledRows = isEdit
    ? {
        brochures: browcherPdfs,
        setBrochures: setBrowcherPdfs,
        newBrochures: newBrowcherPdfs,
        setNewBrochures: setNewBrowcherPdfs,
        reraCerts: reraCertificates,
        setReraCerts: setReraCertificates,
        newReraCerts: newReraCertificates,
        setNewReraCerts: setNewReraCertificates,
        scanners: reraScannerImages,
        setScanners: setReraScannerImages,
        newScanners: newReraScannerImages,
        setNewScanners: setNewReraScannerImages,
      }
    : {
        brochures: browcherPdfs,
        setBrochures: setBrowcherPdfs,
        newBrochures: null,
        reraCerts: reraCertificates,
        setReraCerts: setReraCertificates,
        newReraCerts: null,
        scanners: reraScannerImages,
        setScanners: setReraScannerImages,
        newScanners: null,
      };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Admin</p>
        <h1 className={styles.title}>
          {isEdit ? "Edit Project" : "Add Project"}
        </h1>
        <p className={styles.copy}>
          {isEdit
            ? "Update inventory details, media, and documents."
            : "Create a project with media, layouts, and RERA docs."}
        </p>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {ok ? <p className={styles.ok}>{ok}</p> : null}

      <form onSubmit={handleSubmit} className={styles.form}>
        <fieldset disabled={submitting} className={styles.fieldset}>
          {/* Basics */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Basics</h2>
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span className={styles.label}>Name *</span>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Builder</span>
                <input
                  className={styles.input}
                  value={form.builder}
                  onChange={(e) => setField("builder", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Location</span>
                <input
                  className={styles.input}
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Property type</span>
                <select
                  className={styles.input}
                  value={form.propertyType}
                  onChange={(e) => setField("propertyType", e.target.value)}
                >
                  {PROPERTY_TYPES.map(({ value, label }) => (
                    <option key={value || "none"} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Status</span>
                <select
                  className={styles.input}
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Contact number</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  maxLength={10}
                  value={form.contactNumber}
                  onChange={(e) =>
                    setField("contactNumber", normalizeContact(e.target.value))
                  }
                  placeholder="10-digit mobile"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Latitude</span>
                <input
                  className={styles.input}
                  value={form.latitude}
                  onChange={(e) => setField("latitude", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Longitude</span>
                <input
                  className={styles.input}
                  value={form.longitude}
                  onChange={(e) => setField("longitude", e.target.value)}
                />
              </label>
            </div>
            <label className={styles.field}>
              <span className={styles.label}>Description</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </label>
            <div className={styles.grid3}>
              <label className={styles.field}>
                <span className={styles.label}>RERA no.</span>
                <input
                  className={styles.input}
                  value={form.reraNo}
                  onChange={(e) => setField("reraNo", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Possession month</span>
                <select
                  className={styles.input}
                  value={form.reraMonth}
                  onChange={(e) => setField("reraMonth", e.target.value)}
                >
                  {MONTHS.map((m) => (
                    <option key={m || "none"} value={m}>
                      {m || "—"}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Possession year</span>
                <input
                  className={styles.input}
                  value={form.reraYear}
                  onChange={(e) => setField("reraYear", e.target.value)}
                  placeholder="YYYY"
                />
              </label>
            </div>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setField("active", e.target.checked)}
              />
              <span>Active (visible to brokers)</span>
            </label>
          </section>

          {/* Plans */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Plans</h2>
            <div className={styles.chipRow}>
              {PLAN_OPTIONS.map((plan) => {
                const on = plans.includes(plan);
                return (
                  <button
                    key={plan}
                    type="button"
                    className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                    onClick={() => togglePlan(plan)}
                  >
                    {plan}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Features */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Features</h2>
            <div className={styles.tagAdd}>
              <input
                className={styles.input}
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
                placeholder="Add feature…"
              />
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={addFeature}
              >
                <Plus size={14} strokeWidth={2} />
                Add
              </button>
            </div>
            {features.length ? (
              <ul className={styles.tagList}>
                {features.map((tag) => (
                  <li key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove ${tag}`}
                      onClick={() =>
                        setFeatures((prev) => prev.filter((f) => f !== tag))
                      }
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* Media */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Media</h2>
            <div className={styles.grid2}>
              <MediaSlot
                label="Logo"
                preview={logoSrc}
                accept="image/*"
                inputRef={logoInputRef}
                disabled={submitting}
                onPick={(e) =>
                  pickSingle(e, {
                    setFile: setLogo,
                    setPreview: setLogoPreview,
                    setChanged: isEdit ? setLogoChanged : undefined,
                    prevPreview: logoPreview,
                  })
                }
                onClear={() =>
                  clearSingle({
                    setFile: setLogo,
                    setPreview: setLogoPreview,
                    setChanged: isEdit ? setLogoChanged : undefined,
                    preview: logoPreview,
                    inputRef: logoInputRef,
                    clearToEmpty: isEdit,
                  })
                }
              />
              <MediaSlot
                label="Builder logo"
                preview={builderLogoSrc}
                accept="image/*"
                inputRef={builderLogoInputRef}
                disabled={submitting}
                onPick={(e) =>
                  pickSingle(e, {
                    setFile: setBuilderLogo,
                    setPreview: setBuilderLogoPreview,
                    setChanged: isEdit ? setBuilderLogoChanged : undefined,
                    prevPreview: builderLogoPreview,
                  })
                }
                onClear={() =>
                  clearSingle({
                    setFile: setBuilderLogo,
                    setPreview: setBuilderLogoPreview,
                    setChanged: isEdit ? setBuilderLogoChanged : undefined,
                    preview: builderLogoPreview,
                    inputRef: builderLogoInputRef,
                    clearToEmpty: isEdit,
                  })
                }
              />
              <MediaSlot
                label="Cover image"
                preview={coverSrc}
                accept="image/*"
                inputRef={coverImageInputRef}
                disabled={submitting}
                onPick={(e) =>
                  pickSingle(e, {
                    setFile: setCoverImage,
                    setPreview: setCoverImagePreview,
                    setChanged: isEdit ? setCoverImageChanged : undefined,
                    prevPreview: coverImagePreview,
                  })
                }
                onClear={() =>
                  clearSingle({
                    setFile: setCoverImage,
                    setPreview: setCoverImagePreview,
                    setChanged: isEdit ? setCoverImageChanged : undefined,
                    preview: coverImagePreview,
                    inputRef: coverImageInputRef,
                    clearToEmpty: isEdit,
                  })
                }
              />
              <MediaSlot
                label="Banner image"
                preview={bannerSrc}
                accept="image/*"
                inputRef={bannerImageInputRef}
                disabled={submitting}
                onPick={(e) =>
                  pickSingle(e, {
                    setFile: setBannerImage,
                    setPreview: setBannerImagePreview,
                    setChanged: isEdit ? setBannerImageChanged : undefined,
                    prevPreview: bannerImagePreview,
                  })
                }
                onClear={() =>
                  clearSingle({
                    setFile: setBannerImage,
                    setPreview: setBannerImagePreview,
                    setChanged: isEdit ? setBannerImageChanged : undefined,
                    preview: bannerImagePreview,
                    inputRef: bannerImageInputRef,
                    clearToEmpty: isEdit,
                  })
                }
              />
              <MediaSlot
                label="Cover video"
                preview={coverVideoSrc}
                accept="video/*"
                isVideo
                inputRef={coverVideoInputRef}
                disabled={submitting}
                onPick={(e) =>
                  pickSingle(e, {
                    setFile: setCoverVideo,
                    setPreview: setCoverVideoPreview,
                    setChanged: isEdit ? setCoverVideoChanged : undefined,
                    prevPreview: coverVideoPreview,
                  })
                }
                onClear={() =>
                  clearSingle({
                    setFile: setCoverVideo,
                    setPreview: setCoverVideoPreview,
                    setChanged: isEdit ? setCoverVideoChanged : undefined,
                    preview: coverVideoPreview,
                    inputRef: coverVideoInputRef,
                    clearToEmpty: isEdit,
                  })
                }
              />
              <MediaSlot
                label="Walkthrough video"
                preview={walkthroughSrc}
                accept="video/*"
                isVideo
                inputRef={walkthroughVideoInputRef}
                disabled={submitting}
                onPick={(e) =>
                  pickSingle(e, {
                    setFile: setWalkthroughVideo,
                    setPreview: setWalkthroughVideoPreview,
                    setChanged: isEdit
                      ? setWalkthroughVideoChanged
                      : undefined,
                    prevPreview: walkthroughVideoPreview,
                  })
                }
                onClear={() =>
                  clearSingle({
                    setFile: setWalkthroughVideo,
                    setPreview: setWalkthroughVideoPreview,
                    setChanged: isEdit
                      ? setWalkthroughVideoChanged
                      : undefined,
                    preview: walkthroughVideoPreview,
                    inputRef: walkthroughVideoInputRef,
                    clearToEmpty: isEdit,
                  })
                }
              />
            </div>
          </section>

          {/* Gallery */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Gallery</h2>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => galleryInputRef.current?.click()}
              >
                <Plus size={14} />
                Add images
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.hiddenInput}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  const rows = files.map((file, idx) => ({
                    id: `${Date.now()}-${idx}`,
                    file,
                    preview: URL.createObjectURL(file),
                  }));
                  if (isEdit) setNewGalleryImages((prev) => [...prev, ...rows]);
                  else setGalleryImages((prev) => [...prev, ...rows]);
                  e.target.value = "";
                }}
              />
            </div>
            <div className={styles.thumbGrid}>
              {isEdit
                ? galleryImages.map((g, i) => {
                    const src = typeof g === "string" ? g : g.image || g.preview;
                    const key = g._id || g.image || i;
                    return (
                      <div key={key} className={styles.thumb}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" />
                        <button
                          type="button"
                          className={styles.thumbRemove}
                          onClick={() =>
                            setGalleryImages((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                : null}
              {(isEdit ? newGalleryImages : galleryImages).map((g) => (
                <div key={g.id} className={styles.thumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.preview} alt="" />
                  <button
                    type="button"
                    className={styles.thumbRemove}
                    onClick={() => {
                      if (g.preview) URL.revokeObjectURL(g.preview);
                      if (isEdit) {
                        setNewGalleryImages((prev) =>
                          prev.filter((x) => x.id !== g.id)
                        );
                      } else {
                        setGalleryImages((prev) =>
                          prev.filter((x) => x.id !== g.id)
                        );
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Layouts */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Layouts</h2>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  const row = {
                    id: Date.now(),
                    title: "",
                    area: "",
                    price: "",
                    images: [],
                    imageFiles: [],
                    pendingFiles: [],
                  };
                  if (isEdit) setNewLayouts((prev) => [...prev, row]);
                  else setLayouts((prev) => [...prev, row]);
                }}
              >
                <Plus size={14} />
                Add layout
              </button>
            </div>
            <div className={styles.stack}>
              {(isEdit ? [...layouts, ...newLayouts] : layouts).map((l) => {
                const isNew =
                  isEdit && newLayouts.some((nl) => nl.id === l.id);
                const filesKey = isEdit ? "pendingFiles" : "imageFiles";
                const files = l[filesKey] || [];
                return (
                  <div key={l.id} className={styles.layoutCard}>
                    <div className={styles.grid3}>
                      <label className={styles.field}>
                        <span className={styles.label}>Title</span>
                        <input
                          className={styles.input}
                          value={l.title}
                          onChange={(e) => {
                            const v = e.target.value;
                            const upd = (prev) =>
                              prev.map((x) =>
                                x.id === l.id ? { ...x, title: v } : x
                              );
                            if (isNew) setNewLayouts(upd);
                            else setLayouts(upd);
                          }}
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.label}>Area</span>
                        <input
                          className={styles.input}
                          value={l.area}
                          onChange={(e) => {
                            const v = e.target.value;
                            const upd = (prev) =>
                              prev.map((x) =>
                                x.id === l.id ? { ...x, area: v } : x
                              );
                            if (isNew) setNewLayouts(upd);
                            else setLayouts(upd);
                          }}
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.label}>Price</span>
                        <input
                          className={styles.input}
                          value={l.price}
                          onChange={(e) => {
                            const v = e.target.value;
                            const upd = (prev) =>
                              prev.map((x) =>
                                x.id === l.id ? { ...x, price: v } : x
                              );
                            if (isNew) setNewLayouts(upd);
                            else setLayouts(upd);
                          }}
                        />
                      </label>
                    </div>
                    <div className={styles.mediaActions}>
                      <label className={styles.secondaryBtn}>
                        <Upload size={14} />
                        Images
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className={styles.hiddenInput}
                          onChange={(e) => {
                            const picked = Array.from(e.target.files || []);
                            if (!picked.length) return;
                            const added = picked.map((file, idx) => ({
                              id: `${Date.now()}-${idx}`,
                              file,
                              preview: URL.createObjectURL(file),
                            }));
                            const upd = (prev) =>
                              prev.map((x) =>
                                x.id === l.id
                                  ? {
                                      ...x,
                                      [filesKey]: [
                                        ...(x[filesKey] || []),
                                        ...added,
                                      ],
                                    }
                                  : x
                              );
                            if (isNew) setNewLayouts(upd);
                            else setLayouts(upd);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => {
                          files.forEach(
                            (f) => f.preview && URL.revokeObjectURL(f.preview)
                          );
                          if (isNew) {
                            setNewLayouts((prev) =>
                              prev.filter((x) => x.id !== l.id)
                            );
                          } else {
                            setLayouts((prev) =>
                              prev.filter((x) => x.id !== l.id)
                            );
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        Remove layout
                      </button>
                    </div>
                    <div className={styles.thumbGrid}>
                      {(l.images || []).map((src, i) => (
                        <div key={`${src}-${i}`} className={styles.thumb}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" />
                          <button
                            type="button"
                            className={styles.thumbRemove}
                            onClick={() => {
                              const upd = (prev) =>
                                prev.map((x) =>
                                  x.id === l.id
                                    ? {
                                        ...x,
                                        images: (x.images || []).filter(
                                          (_, idx) => idx !== i
                                        ),
                                      }
                                    : x
                                );
                              if (isNew) setNewLayouts(upd);
                              else setLayouts(upd);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {files.map((f) => (
                        <div key={f.id} className={styles.thumb}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.preview} alt="" />
                          <button
                            type="button"
                            className={styles.thumbRemove}
                            onClick={() => {
                              if (f.preview) URL.revokeObjectURL(f.preview);
                              const upd = (prev) =>
                                prev.map((x) =>
                                  x.id === l.id
                                    ? {
                                        ...x,
                                        [filesKey]: (x[filesKey] || []).filter(
                                          (img) => img.id !== f.id
                                        ),
                                      }
                                    : x
                                );
                              if (isNew) setNewLayouts(upd);
                              else setLayouts(upd);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Brochures */}
          <TitledFileSection
            title="Brochures (PDF)"
            accept="application/pdf"
            urlKey="file"
            existing={titledRows.brochures}
            setExisting={titledRows.setBrochures}
            news={titledRows.newBrochures}
            setNews={titledRows.setNewBrochures}
            isEdit={isEdit}
          />

          <TitledFileSection
            title="RERA certificates"
            accept="application/pdf,image/*"
            urlKey="file"
            existing={titledRows.reraCerts}
            setExisting={titledRows.setReraCerts}
            news={titledRows.newReraCerts}
            setNews={titledRows.setNewReraCerts}
            isEdit={isEdit}
          />

          <TitledFileSection
            title="RERA scanner images"
            accept="image/*"
            urlKey="image"
            existing={titledRows.scanners}
            setExisting={titledRows.setScanners}
            news={titledRows.newScanners}
            setNews={titledRows.setNewScanners}
            isEdit={isEdit}
            imagePreview
          />

          {/* OC */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>OC certificate</h2>
            <div className={styles.mediaBox}>
              {ocCertificate instanceof File ? (
                <p className={styles.fileName}>{ocCertificate.name}</p>
              ) : isEdit && existingOcUrl && !ocCertificateChanged ? (
                <p className={styles.fileName}>Existing OC on file</p>
              ) : (
                <p className={styles.mediaEmpty}>No file</p>
              )}
              <div className={styles.mediaActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => ocCertInputRef.current?.click()}
                >
                  <Upload size={14} />
                  {isEdit && (existingOcUrl || ocCertificate)
                    ? "Replace"
                    : "Upload"}
                </button>
                {(ocCertificate || (isEdit && existingOcUrl)) && (
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    onClick={() => {
                      setOcCertificate(isEdit ? "" : null);
                      if (isEdit) {
                        setOcCertificateChanged(true);
                        setExistingOcUrl("");
                      }
                      resetFileInput(ocCertInputRef);
                    }}
                  >
                    <X size={14} />
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={ocCertInputRef}
                type="file"
                accept="application/pdf,image/*"
                className={styles.hiddenInput}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setOcCertificate(file);
                  if (isEdit) setOcCertificateChanged(true);
                  e.target.value = "";
                }}
              />
            </div>
          </section>
        </fieldset>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            disabled={submitting}
            onClick={() => router.push("/projects")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TitledFileSection({
  title,
  accept,
  urlKey,
  existing,
  setExisting,
  news,
  setNews,
  isEdit,
  imagePreview,
}) {
  const rowKey = (row) => row.id || row._id;

  const addRow = () => {
    const row = {
      id: Date.now(),
      title: "",
      [urlKey]: null,
      preview: null,
    };
    if (isEdit && setNews) setNews((prev) => [...prev, row]);
    else setExisting((prev) => [...prev, row]);
  };

  const renderRow = (row, isNew) => {
    const fileVal = row[urlKey];
    const hasUrl = typeof fileVal === "string" && fileVal;
    const hasFile = fileVal instanceof File;
    const key = rowKey(row);
    const apply = (updater) => {
      if (isNew) setNews(updater);
      else setExisting(updater);
    };

    return (
      <div key={key} className={styles.titledRow}>
        <input
          className={styles.input}
          placeholder="Title"
          value={row.title}
          onChange={(e) => {
            const v = e.target.value;
            apply((prev) =>
              prev.map((x) => (rowKey(x) === key ? { ...x, title: v } : x))
            );
          }}
        />
        <div className={styles.titledMeta}>
          {imagePreview && (row.preview || hasUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.preview || fileVal}
              alt=""
              className={styles.miniThumb}
            />
          ) : null}
          <span className={styles.fileName}>
            {hasFile ? fileVal.name : hasUrl ? "On file" : "No file"}
          </span>
          {(!isEdit || isNew) && (
            <label className={styles.secondaryBtn}>
              <Upload size={14} />
              File
              <input
                type="file"
                accept={accept}
                className={styles.hiddenInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  apply((prev) =>
                    prev.map((x) => {
                      if (rowKey(x) !== key) return x;
                      if (x.preview) URL.revokeObjectURL(x.preview);
                      return {
                        ...x,
                        [urlKey]: file || null,
                        preview: file ? URL.createObjectURL(file) : null,
                      };
                    })
                  );
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={() => {
              if (row.preview) URL.revokeObjectURL(row.preview);
              apply((prev) => prev.filter((x) => rowKey(x) !== key));
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <button type="button" className={styles.secondaryBtn} onClick={addRow}>
          <Plus size={14} />
          Add
        </button>
      </div>
      <div className={styles.stack}>
        {existing.map((row) => renderRow(row, false))}
        {isEdit && news ? news.map((row) => renderRow(row, true)) : null}
      </div>
    </section>
  );
}
