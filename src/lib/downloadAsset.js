import { downloadZip } from "client-zip";
import { API_URL, getToken } from "@/lib/auth";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function safeFilename(name, fallback = "file") {
  const cleaned = String(name || "")
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return cleaned || fallback;
}

function guessExt(url, fallback = "bin") {
  const m = String(url).match(/\.(jpe?g|png|webp|gif|avif|pdf|mp4)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : fallback;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Same pattern as Mira Client: try direct fetch, fallback to download-asset proxy. */
export async function downloadAssetFile(assetUrl, filename) {
  if (!assetUrl) return;

  try {
    const res = await fetch(assetUrl, { mode: "cors" });
    if (!res.ok) throw new Error("direct fetch failed");
    const blob = await res.blob();
    triggerBlobDownload(blob, filename);
    return;
  } catch {
    // fall through to proxy
  }

  const qs = new URLSearchParams({
    url: assetUrl,
    filename,
  });
  const res = await fetch(`${API_URL}/api/projects/download-asset?${qs}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Download failed");
  }
  const blob = await res.blob();
  triggerBlobDownload(blob, filename);
}

export async function downloadNamedImage(url, name, fallback = "image") {
  if (!url) return;
  const title = safeFilename(name, fallback);
  const ext = guessExt(url, "jpg");
  await downloadAssetFile(url, `${title}.${ext}`);
}

export async function downloadLayoutImage(projectName, layout) {
  const src = layout?.image || layout?.images?.[0];
  if (!src) return;
  const title = safeFilename(layout?.title || "layout", "layout");
  const ext = guessExt(src, "jpg");
  await downloadAssetFile(src, `${title}.${ext}`);
}

export async function downloadBrochure(brochure, projectName) {
  const src = brochure?.file || brochure;
  if (!src || typeof src !== "string") return;
  const title = safeFilename(
    brochure?.title || projectName || "brochure",
    "brochure"
  );
  const ext = guessExt(src, "pdf");
  await downloadAssetFile(src, `${title}.${ext}`);
}

export async function downloadWalkthroughVideo(project) {
  const src = project?.walkthroughVideo;
  if (!src) return;
  const title = safeFilename(
    `${project?.name || "project"}-walkthrough`,
    "walkthrough"
  );
  const ext = guessExt(src, "mp4");
  await downloadAssetFile(src, `${title}.${ext}`);
}

export async function downloadGalleryZip(project) {
  const items = (project?.galleryImages || [])
    .map((g) => ({
      title: safeFilename(g?.title || "photo", "photo"),
      src: String(g?.image || "").trim(),
    }))
    .filter((g) => g.src);

  if (!items.length) return;

  const files = await Promise.all(
    items.map(async (item) => {
      const qs = new URLSearchParams({ url: item.src });
      const res = await fetch(`${API_URL}/api/projects/download-asset?${qs}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed: ${item.title}`);
      const blob = await res.blob();
      const ext = guessExt(item.src, "jpg");
      const folder = safeFilename(project.name || "gallery", "gallery");
      return {
        name: `${folder}/${item.title}.${ext}`,
        input: blob,
      };
    })
  );

  const blob = await downloadZip(files).blob();
  const zipName = `${safeFilename(project.name || "project", "project")}-gallery.zip`;
  triggerBlobDownload(blob, zipName);
}
