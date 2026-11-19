import multer from "multer";
import { Router } from "express";
import { z } from "zod";
import {
  buildProgress,
  computeTeacherStats,
  createActivityRecords,
  parseJsonArray,
  toDiscussionQuestion,
  toJobMatch,
  toResumeAnalysis,
  toSharePost,
  toUserProfile,
} from "../lib/formatters.ts";
import { prisma } from "../lib/prisma.ts";
import {
  deepSeekJobMatch,
  deepSeekResumeAnalysis,
} from "../lib/deepseek.ts";
import { buildResumeImportResult } from "../lib/resume-parser.ts";
import { emptyStructuredResume, normalizeStructuredResume, structuredResumeToText } from "../lib/resume.ts";
import { analyzeJobMatch, analyzeResume } from "../../src/mock/engine.ts";

export const appRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const userIdSchema = z.object({ userId: z.string().min(1) });
const structuredResumeSchema = z.object({
  userId: z.string().min(1),
  structuredResume: z.any(),
});
const jobSchema = z.object({
  userId: z.string().min(1),
  jobDescription: z.string().min(10),
  jobName: z.string().min(2).optional(),
  resumeText: z.string().optional(),
});
const shareCreateSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(5),
  excerpt: z.string().min(8),
  content: z.string().min(10),
  category: z.string().min(2),
  tags: z.array(z.string().min(1)).default([]),
});
const discussionCreateSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(5),
  content: z.string().min(10),
  category: z.string().min(2),
  tags: z.array(z.string().min(1)).default([]),
});
const discussionReplySchema = z.object({
  userId: z.string().min(1),
  content: z.string().min(2),
});

appRouter.get("/bootstrap/student/:userId", async (req, res) => {
  const parsed = userIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "用户参数错误" });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: {
      resume: true,
      resumeAnalyses: { orderBy: { createdAt: "desc" } },
      jobAnalyses: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "用户不存在" });
  }

  const sharePosts = await prisma.sharePost.findMany({
    include: { author: true, tags: { include: { tag: true } } },
    orderBy: [{ isHot: "desc" }, { createdAt: "desc" }],
  });
  const discussions = await prisma.discussionPost.findMany({
    include: {
      author: true,
      tags: { include: { tag: true } },
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const resumeAnalysisHistory = user.resumeAnalyses.map(toResumeAnalysis);
  const jobMatchHistory = user.jobAnalyses.map(toJobMatch);

  const progress = buildProgress(
    resumeAnalysisHistory[0] ?? null,
    jobMatchHistory[0] ?? null,
  );

  const structuredResume =
    user.resume?.structuredJson ? normalizeStructuredResume(JSON.parse(user.resume.structuredJson)) : emptyStructuredResume();

  return res.json({
    user: toUserProfile(user),
    resumeText: user.resume?.content ?? "",
    structuredResume,
    targetJob: user.jobAnalyses[0]?.jobDescription ?? "",
    resumeAnalysis: resumeAnalysisHistory[0] ?? null,
    resumeAnalysisHistory,
    jobMatch: jobMatchHistory[0] ?? null,
    jobMatchHistory,
    records: createActivityRecords(resumeAnalysisHistory, jobMatchHistory),
    progress,
    sharePosts: sharePosts.map(toSharePost),
    discussions: discussions.map(toDiscussionQuestion),
  });
});

appRouter.get("/bootstrap/teacher/:userId", async (req, res) => {
  const parsed = userIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "用户参数错误" });
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return res.status(404).json({ message: "用户不存在" });
  }

  const students = await prisma.user.findMany({
    where: { role: "student" },
    include: {
      resumeAnalyses: true,
      jobAnalyses: true,
    },
  });
  const discussions = await prisma.discussionPost.findMany({ include: { tags: { include: { tag: true } } } });
  const sharePosts = await prisma.sharePost.findMany({ include: { tags: { include: { tag: true } } } });

  const issueCounter = new Map<string, number>();
  const directionCounter = new Map<string, number>();
  const gapCounter = new Map<string, number>();
  const topicCounter = new Map<string, number>();
  const shareTagCounter = new Map<string, number>();

  students.forEach((student) => {
    const latestResume = [...student.resumeAnalyses].sort((a, b) => +b.createdAt - +a.createdAt)[0];
    const latestJob = [...student.jobAnalyses].sort((a, b) => +b.createdAt - +a.createdAt)[0];
    if (latestResume) {
      parseJsonArray(latestResume.issuesJson).forEach((item: string) =>
        issueCounter.set(item, (issueCounter.get(item) ?? 0) + 1),
      );
    }
    if (latestJob) {
      parseJsonArray(latestJob.directionsJson).forEach((item: string) =>
        directionCounter.set(item, (directionCounter.get(item) ?? 0) + 1),
      );
      parseJsonArray(latestJob.gapsJson).forEach((item: string) =>
        gapCounter.set(item, (gapCounter.get(item) ?? 0) + 1),
      );
    }
  });

  discussions.forEach((post) => topicCounter.set(post.title, (topicCounter.get(post.title) ?? 0) + 1));
  sharePosts.forEach((post) =>
    post.tags.forEach((tag) => shareTagCounter.set(tag.tag.name, (shareTagCounter.get(tag.tag.name) ?? 0) + 1)),
  );

  const stats = computeTeacherStats({
    students: students.length,
    resumeScores: students.flatMap((student) => student.resumeAnalyses.slice(-1).map((item) => item.score)),
    jobScores: students.flatMap((student) => student.jobAnalyses.slice(-1).map((item) => item.score)),
    issueCounter,
    directionCounter,
    gapCounter,
    topicCounter,
    shareTagCounter,
    shareCount: sharePosts.length,
    discussionCount: discussions.length,
  });

  stats.studentAccounts = students
    .sort((a, b) => +b.createdAt - +a.createdAt)
    .map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email ?? "",
      school: student.school ?? "",
      major: student.major ?? "",
      targetRole: student.targetRole ?? "",
      joinedAt: student.createdAt.toISOString().slice(0, 10),
    }));

  return res.json({
    user: toUserProfile(user),
    teacherStats: stats,
  });
});

appRouter.post("/resume/save", async (req, res) => {
  const parsed = structuredResumeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "简历结构不完整" });
  }

  const structuredResume = normalizeStructuredResume(parsed.data.structuredResume);
  const content = structuredResumeToText(structuredResume);

  const basics = structuredResume.basics;
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: {
      name: basics.name || undefined,
      email: basics.email || undefined,
      phone: basics.phone || undefined,
      targetRole: basics.targetRole || undefined,
      school: structuredResume.education[0]?.school || undefined,
      major: structuredResume.education[0]?.major || undefined,
    },
  });

  const resume = await prisma.resume.upsert({
    where: { userId: parsed.data.userId },
    update: {
      content,
      structuredJson: JSON.stringify(structuredResume),
    },
    create: {
      userId: parsed.data.userId,
      content,
      structuredJson: JSON.stringify(structuredResume),
    },
  });

  return res.json({
    success: true,
    updatedAt: resume.updatedAt,
    content,
    structuredResume,
  });
});

appRouter.post("/resume/upload-parse", upload.single("resumeFile"), async (req, res) => {
  const userId = typeof req.body.userId === "string" ? req.body.userId : "";
  if (!userId) {
    return res.status(400).json({ message: "缺少用户信息" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "请上传 PDF 或 DOCX 简历文件" });
  }

  const lowerName = req.file.originalname.toLowerCase();
  if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
    return res.status(400).json({ message: "仅支持上传 PDF 或 DOCX 文件" });
  }

  try {
    const result = await buildResumeImportResult(req.file.originalname, req.file.buffer);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "文件解析失败，请尝试更换简历文件或手动填写。",
    });
  }
});

appRouter.post("/resume/analyze", async (req, res) => {
  const parsed = z
    .object({
      userId: z.string().min(1),
      content: z.string().min(10),
      targetJob: z.string().min(5),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "诊断参数不完整" });
  }

  const result =
    (await deepSeekResumeAnalysis(parsed.data.content, parsed.data.targetJob)) ??
    analyzeResume(parsed.data.content, parsed.data.targetJob);

  const saved = await prisma.resumeAnalysis.create({
    data: {
      userId: parsed.data.userId,
      resumeContent: parsed.data.content,
      score: result.score,
      completenessJson: JSON.stringify(result.completeness),
      issuesJson: JSON.stringify(result.issues),
      keywordJson: JSON.stringify(result.keywordSuggestions),
      fitJson: JSON.stringify(result.fitSuggestions),
      strengthsJson: JSON.stringify(result.strengths),
    },
  });

  return res.json(toResumeAnalysis(saved));
});

appRouter.post("/job/analyze", async (req, res) => {
  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "岗位信息不完整" });
  }

  const result =
    (await deepSeekJobMatch(parsed.data.resumeText ?? "", parsed.data.jobDescription)) ??
    analyzeJobMatch(parsed.data.resumeText ?? "", parsed.data.jobDescription);

  const saved = await prisma.jobAnalysis.create({
    data: {
      userId: parsed.data.userId,
      jobName: parsed.data.jobName ?? "目标岗位",
      jobDescription: parsed.data.jobDescription,
      score: result.score,
      keywordsJson: JSON.stringify(result.keywords),
      strengthsJson: JSON.stringify(result.strengths),
      gapsJson: JSON.stringify(result.gaps),
      deliveryAdviceJson: JSON.stringify(result.deliveryAdvice),
      directionsJson: JSON.stringify(result.recommendedDirections),
    },
  });

  return res.json(toJobMatch(saved));
});

appRouter.get("/shares", async (_req, res) => {
  const posts = await prisma.sharePost.findMany({
    include: { author: true, tags: { include: { tag: true } } },
    orderBy: [{ isHot: "desc" }, { createdAt: "desc" }],
  });
  return res.json(posts.map(toSharePost));
});

appRouter.get("/shares/:id", async (req, res) => {
  const post = await prisma.sharePost.findUnique({
    where: { id: req.params.id },
    include: { author: true, tags: { include: { tag: true } } },
  });
  if (!post) {
    return res.status(404).json({ message: "帖子不存在" });
  }
  await prisma.sharePost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  });
  return res.json(toSharePost({ ...post, views: post.views + 1 }));
});

appRouter.post("/shares", async (req, res) => {
  const parsed = shareCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "分享内容填写不完整" });
  }

  const created = await prisma.sharePost.create({
    data: {
      authorId: parsed.data.userId,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      content: parsed.data.content,
      category: parsed.data.category,
    },
    include: { author: true, tags: { include: { tag: true } } },
  });

  for (const name of parsed.data.tags) {
    const tag = await prisma.shareTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.sharePostTag.create({ data: { postId: created.id, tagId: tag.id } });
  }

  const full = await prisma.sharePost.findUniqueOrThrow({
    where: { id: created.id },
    include: { author: true, tags: { include: { tag: true } } },
  });
  return res.json(toSharePost(full));
});

appRouter.patch("/shares/:id/like", async (req, res) => {
  const post = await prisma.sharePost.update({
    where: { id: req.params.id },
    data: { likes: { increment: 1 } },
    include: { author: true, tags: { include: { tag: true } } },
  });
  return res.json(toSharePost(post));
});

appRouter.get("/discussions", async (_req, res) => {
  const posts = await prisma.discussionPost.findMany({
    include: {
      author: true,
      tags: { include: { tag: true } },
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ createdAt: "desc" }],
  });
  return res.json(posts.map(toDiscussionQuestion));
});

appRouter.get("/discussions/:id", async (req, res) => {
  const post = await prisma.discussionPost.findUnique({
    where: { id: req.params.id },
    include: {
      author: true,
      tags: { include: { tag: true } },
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!post) {
    return res.status(404).json({ message: "讨论不存在" });
  }
  await prisma.discussionPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  });
  return res.json(toDiscussionQuestion({ ...post, views: post.views + 1 }));
});

appRouter.post("/discussions", async (req, res) => {
  const parsed = discussionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "问题信息填写不完整" });
  }

  const created = await prisma.discussionPost.create({
    data: {
      authorId: parsed.data.userId,
      title: parsed.data.title,
      content: parsed.data.content,
      category: parsed.data.category,
      status: "讨论中",
      views: 1,
    },
    include: {
      author: true,
      tags: { include: { tag: true } },
      replies: { include: { author: true } },
    },
  });

  for (const name of parsed.data.tags) {
    const tag = await prisma.discussionTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.discussionPostTag.create({ data: { postId: created.id, tagId: tag.id } });
  }

  const full = await prisma.discussionPost.findUniqueOrThrow({
    where: { id: created.id },
    include: {
      author: true,
      tags: { include: { tag: true } },
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  return res.json(toDiscussionQuestion(full));
});

appRouter.post("/discussions/:id/replies", async (req, res) => {
  const parsed = discussionReplySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "回复内容不完整" });
  }

  await prisma.discussionReply.create({
    data: {
      postId: req.params.id,
      authorId: parsed.data.userId,
      content: parsed.data.content,
    },
  });

  const post = await prisma.discussionPost.findUnique({
    where: { id: req.params.id },
    include: {
      author: true,
      tags: { include: { tag: true } },
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!post) {
    return res.status(404).json({ message: "讨论不存在" });
  }

  const status = post.replies.length >= 2 ? "已解决" : "讨论中";
  const updated = await prisma.discussionPost.update({
    where: { id: req.params.id },
    data: { status },
    include: {
      author: true,
      tags: { include: { tag: true } },
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return res.json(toDiscussionQuestion(updated));
});
