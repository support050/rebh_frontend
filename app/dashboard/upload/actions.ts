"use server";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const internalKey = process.env.INTERNAL_API_KEY || "";

/**
 * Server-side Excel upload — uses INTERNAL_API_KEY (never sent to the browser).
 */
export async function uploadExcelReportAction(formData: FormData) {
  if (!internalKey) {
    return { success: false, error: "Internal API key not configured on server" };
  }

  try {
    const res = await fetch(`${backendUrl}/api/scraper/upload-excel`, {
      method: "POST",
      headers: {
        "X-Internal-Key": internalKey,
      },
      body: formData,
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const detail = data.detail;
      return {
        success: false,
        error: typeof detail === "string" ? detail : `Upload failed (Status ${res.status})`,
      };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return { success: false, error: message };
  }
}
