import type {
  DiscussionQuestion,
  JobMatchResult,
  RegisterPayload,
  ResumeAnalysis,
  ResumeImportResult,
  SharePost,
  StudentBootstrap,
  StructuredResume,
  TeacherStats,
  UserProfile,
} from "../types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "请求失败");
  }

  return response.json() as Promise<T>;
}

async function requestForm<T>(url: string, formData: FormData): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || "请求失败");
  }

  return response.json() as Promise<T>;
}

export const api = {
  getAccounts: () => request<Array<UserProfile & { label: string }>>("/api/auth/accounts"),
  register: (payload: RegisterPayload) =>
    request<{ user: UserProfile; message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ user: UserProfile }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getStudentBootstrap: (userId: string) => request<StudentBootstrap>(`/api/bootstrap/student/${userId}`),
  getTeacherBootstrap: (userId: string) =>
    request<{ user: UserProfile; teacherStats: TeacherStats }>(`/api/bootstrap/teacher/${userId}`),
  saveResume: (userId: string, structuredResume: StructuredResume) =>
    request<{ success: boolean; updatedAt: string; content: string; structuredResume: StructuredResume }>(
      "/api/resume/save",
      {
        method: "POST",
        body: JSON.stringify({ userId, structuredResume }),
      },
    ),
  uploadResumeFile: (userId: string, file: File) => {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("resumeFile", file);
    return requestForm<ResumeImportResult>("/api/resume/upload-parse", formData);
  },
  analyzeResume: (userId: string, content: string, targetJob: string) =>
    request<ResumeAnalysis>("/api/resume/analyze", {
      method: "POST",
      body: JSON.stringify({ userId, content, targetJob }),
    }),
  analyzeJob: (userId: string, jobName: string, jobDescription: string, resumeText: string) =>
    request<JobMatchResult>("/api/job/analyze", {
      method: "POST",
      body: JSON.stringify({ userId, jobName, jobDescription, resumeText }),
    }),
  getShares: () => request<SharePost[]>("/api/shares"),
  getShareDetail: (id: string) => request<SharePost>(`/api/shares/${id}`),
  createShare: (payload: {
    userId: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
  }) =>
    request<SharePost>("/api/shares", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  likeShare: (id: string) =>
    request<SharePost>(`/api/shares/${id}/like`, {
      method: "PATCH",
    }),
  getDiscussions: () => request<DiscussionQuestion[]>("/api/discussions"),
  getDiscussionDetail: (id: string) => request<DiscussionQuestion>(`/api/discussions/${id}`),
  createDiscussion: (payload: { userId: string; title: string; content: string; category: string; tags: string[] }) =>
    request<DiscussionQuestion>("/api/discussions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  replyDiscussion: (id: string, payload: { userId: string; content: string }) =>
    request<DiscussionQuestion>(`/api/discussions/${id}/replies`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
