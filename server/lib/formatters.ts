import type {
  ActivityRecord,
  DiscussionQuestion,
  DiscussionReply,
  JobMatchResult,
  ResumeAnalysis,
  SharePost,
  StudentProgress,
  TeacherStats,
  UserProfile,
} from "../../src/types.ts";

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

/**
 * 解析数据库里存的分析数组。
 * 历史数据里 issues / gaps 可能是字符串，也可能是 {level, issue, suggestion} 对象，
 * 统一压成字符串，避免前端渲染对象导致白屏。
 */
export function parseJsonArray(value: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item): string => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const issue = typeof record.issue === "string" ? record.issue : "";
        const suggestion = typeof record.suggestion === "string" ? record.suggestion : "";
        if (issue && suggestion) return `${issue}；建议：${suggestion}`;
        if (issue) return issue;
        if (typeof record.label === "string") return record.label;
        if (typeof record.text === "string") return record.text;
        return JSON.stringify(record);
      }
      return String(item ?? "");
    })
    .filter((item) => item.length > 0);
}

export function toUserProfile(user: {
  id: string;
  name: string;
  role: string;
  school: string | null;
  major: string | null;
  targetRole: string | null;
  email?: string | null;
  phone?: string | null;
}): UserProfile {
  return {
    id: user.id,
    name: user.name,
    role: user.role as UserProfile["role"],
    school: user.school ?? "",
    major: user.major ?? "",
    targetRole: user.targetRole ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
  };
}

export function toResumeAnalysis(item: {
  id: string;
  createdAt: Date;
  score: number;
  completenessJson: string;
  issuesJson: string;
  keywordJson: string;
  fitJson: string;
  strengthsJson: string;
}): ResumeAnalysis {
  return {
    id: item.id,
    createdAt: formatDateTime(item.createdAt),
    score: item.score,
    completeness: parseJsonArray(item.completenessJson),
    issues: parseJsonArray(item.issuesJson),
    keywordSuggestions: parseJsonArray(item.keywordJson),
    fitSuggestions: parseJsonArray(item.fitJson),
    strengths: parseJsonArray(item.strengthsJson),
  };
}

export function toJobMatch(item: {
  id: string;
  createdAt: Date;
  jobName: string;
  score: number;
  keywordsJson: string;
  strengthsJson: string;
  gapsJson: string;
  deliveryAdviceJson: string;
  directionsJson: string;
}): JobMatchResult {
  return {
    id: item.id,
    createdAt: formatDateTime(item.createdAt),
    roleName: item.jobName,
    score: item.score,
    keywords: parseJsonArray(item.keywordsJson),
    strengths: parseJsonArray(item.strengthsJson),
    gaps: parseJsonArray(item.gapsJson),
    deliveryAdvice: parseJsonArray(item.deliveryAdviceJson),
    recommendedDirections: parseJsonArray(item.directionsJson),
  };
}

export function buildProgress(
  latestResume: ResumeAnalysis | null,
  latestJob: JobMatchResult | null,
): StudentProgress {
  return {
    resumeReady: latestResume?.score ?? 0,
    matchReady: latestJob?.score ?? 0,
  };
}

export function toSharePost(item: {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  likes: number;
  views: number;
  favorites: number;
  isHot: boolean;
  createdAt: Date;
  author: { name: string };
  tags: Array<{ tag: { name: string } }>;
}): SharePost {
  return {
    id: item.id,
    title: item.title,
    excerpt: item.excerpt,
    content: item.content,
    author: item.author.name,
    publishedAt: formatDateTime(item.createdAt),
    category: item.category,
    tags: item.tags.map((entry) => entry.tag.name),
    likes: item.likes,
    views: item.views,
    favorites: item.favorites,
    isHot: item.isHot,
  };
}

export function toDiscussionReply(item: {
  id: string;
  content: string;
  likes: number;
  createdAt: Date;
  author: { name: string };
}): DiscussionReply {
  return {
    id: item.id,
    author: item.author.name,
    content: item.content,
    time: formatDateTime(item.createdAt),
    likes: item.likes,
  };
}

export function toDiscussionQuestion(item: {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  views: number;
  createdAt: Date;
  author: { name: string };
  tags: Array<{ tag: { name: string } }>;
  replies: Array<{
    id: string;
    content: string;
    likes: number;
    createdAt: Date;
    author: { name: string };
  }>;
}): DiscussionQuestion {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    author: item.author.name,
    category: item.category,
    tags: item.tags.map((entry) => entry.tag.name),
    status: item.status as DiscussionQuestion["status"],
    views: item.views,
    createdAt: formatDateTime(item.createdAt),
    replies: item.replies.map(toDiscussionReply),
  };
}

export function createActivityRecords(
  latestResume: ResumeAnalysis[],
  latestJobs: JobMatchResult[],
): ActivityRecord[] {
  const records: ActivityRecord[] = [];

  latestResume.slice(0, 2).forEach((item) => {
    records.push({
      id: item.id ?? `resume-${item.createdAt ?? "latest"}`,
      title: "简历诊断记录",
      time: item.createdAt ?? "",
      tag: "简历优化",
      summary: `综合评分 ${item.score} 分，已保存诊断历史。`,
    });
  });

  latestJobs.slice(0, 2).forEach((item) => {
    records.push({
      id: item.id ?? `job-${item.createdAt ?? "latest"}`,
      title: "岗位匹配记录",
      time: item.createdAt ?? "",
      tag: "岗位匹配",
      summary: `${item.roleName ?? "目标岗位"} 匹配度 ${item.score} 分。`,
    });
  });

  return records.slice(0, 5);
}

export function computeTeacherStats(input: {
  students: number;
  resumeScores: number[];
  jobScores: number[];
  issueCounter: Map<string, number>;
  directionCounter: Map<string, number>;
  gapCounter: Map<string, number>;
  topicCounter: Map<string, number>;
  shareTagCounter: Map<string, number>;
  shareCount: number;
  discussionCount: number;
}): TeacherStats {
  const average = (items: number[]) =>
    items.length ? Math.round(items.reduce((sum, item) => sum + item, 0) / items.length) : 0;

  const toArray = (counter: Map<string, number>) =>
    [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

  return {
    overview: {
      students: input.students,
      averageResumeScore: average(input.resumeScores),
      averageMatchScore: average(input.jobScores),
    },
    studentAccounts: [],
    issueDistribution: toArray(input.issueCounter),
    directionDistribution: toArray(input.directionCounter),
    gapDistribution: toArray(input.gapCounter),
    communityTopics: toArray(input.topicCounter),
    shareTags: toArray(input.shareTagCounter),
    activityOverview: [
      { label: "本周新增经验帖", value: `${input.shareCount} 篇` },
      { label: "本周新增讨论问题", value: `${input.discussionCount} 条` },
      { label: "教师参与答疑", value: `${Math.round(input.discussionCount / 2)} 次` },
    ],
  };
}
