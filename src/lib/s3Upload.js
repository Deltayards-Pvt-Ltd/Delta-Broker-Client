import { API_URL, getToken } from "@/lib/auth";

const UPLOAD_TIMEOUT_MS = 600_000;

function corsBlockedError() {
  const err = new Error(
    "S3 blocked the upload. Add your admin domain to the bucket CORS rules in AWS S3 → Permissions → CORS."
  );
  err.code = "S3_CORS";
  return err;
}

/** PUT to presigned URL — fetch only sends Content-Type (matches signed headers). */
async function putToPresignedUrl(uploadUrl, file) {
  const contentType = file.type || "application/octet-stream";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`S3 upload failed (${res.status})`);
    }
  } catch (e) {
    if (e?.name === "TypeError" && String(e.message).includes("Failed to fetch")) {
      throw corsBlockedError();
    }
    if (e?.name === "AbortError") {
      throw new Error("Upload timed out");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Presign + PUT files directly to S3 (bypasses body size limits).
 * @param {string} projectName
 * @param {{ field: string, file: File }[]} entries
 */
export async function uploadProjectFilesToS3(projectName, entries) {
  const validEntries = (entries || []).filter((e) => e?.file instanceof File);
  if (!validEntries.length) return [];

  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }

  const token = getToken();
  const res = await fetch(`${API_URL}/api/projects/presign-uploads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      projectName,
      files: validEntries.map(({ field, file }) => ({
        field,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      })),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success || !Array.isArray(data.uploads)) {
    throw new Error(data?.message || "Could not get upload URLs");
  }

  if (data.uploads.length !== validEntries.length) {
    throw new Error("Upload URL count mismatch");
  }

  const BATCH = 4;
  for (let i = 0; i < data.uploads.length; i += BATCH) {
    const slice = data.uploads.slice(i, i + BATCH);
    await Promise.all(
      slice.map((upload, j) =>
        putToPresignedUrl(upload.uploadUrl, validEntries[i + j].file)
      )
    );
  }

  return data.uploads.map((upload, i) => ({
    field: upload.field,
    publicUrl: upload.publicUrl,
    file: validEntries[i].file,
  }));
}

/**
 * Presign + PUT offer banner to S3.
 * @param {string} offerTitle
 * @param {{ field: string, file: File }[]} entries
 */
export async function uploadOfferFilesToS3(offerTitle, entries) {
  const validEntries = (entries || []).filter((e) => e?.file instanceof File);
  if (!validEntries.length) return [];

  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }

  const token = getToken();
  const res = await fetch(`${API_URL}/api/offers/presign-uploads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      offerTitle,
      files: validEntries.map(({ field, file }) => ({
        field,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      })),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success || !Array.isArray(data.uploads)) {
    throw new Error(data?.message || "Could not get upload URLs");
  }

  if (data.uploads.length !== validEntries.length) {
    throw new Error("Upload URL count mismatch");
  }

  await Promise.all(
    data.uploads.map((upload, i) =>
      putToPresignedUrl(upload.uploadUrl, validEntries[i].file)
    )
  );

  return data.uploads.map((upload, i) => ({
    field: upload.field,
    publicUrl: upload.publicUrl,
    file: validEntries[i].file,
  }));
}

export function galleryTitleFromFile(file) {
  return file.name.replace(/\s+/g, "_").split(".")[0];
}
