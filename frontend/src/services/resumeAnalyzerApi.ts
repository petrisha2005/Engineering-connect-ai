import { API_URL, ApiError, getAuthToken } from "./api";
import type { ResumeReport } from "../types/resume";

async function parseBody(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function analyzeResume(file: File) {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch(`${API_URL}/resume-analyzer/analyze`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  const payload = await parseBody(response);
  if (!response.ok) {
    const message = payload?.message ?? payload?.error?.message ?? "Unable to analyze resume.";
    throw new ApiError(message, payload, response.status, `${API_URL}/resume-analyzer/analyze`);
  }

  return payload as { success: boolean; report: ResumeReport };
}

export async function listResumeReports() {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/resume-analyzer/reports`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const payload = await parseBody(response);
  if (!response.ok) {
    const message = payload?.message ?? payload?.error?.message ?? "Unable to load resume reports.";
    throw new ApiError(message, payload, response.status, `${API_URL}/resume-analyzer/reports`);
  }

  return payload as { success: boolean; reports: ResumeReport[] };
}
