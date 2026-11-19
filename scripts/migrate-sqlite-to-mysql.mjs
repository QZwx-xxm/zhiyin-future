/**
 * 把 SQLite（prisma/dev.db）里的数据搬到 MySQL。
 * 运行前提：prisma/schema.prisma 已切到 mysql，且已执行 prisma db push。
 * 用法：node scripts/migrate-sqlite-to-mysql.mjs
 */
import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const db = new DatabaseSync("prisma/dev.db");

const rows = (table) => db.prepare(`select * from "${table}"`).all();
const dt = (v) => (v === null || v === undefined ? null : new Date(Number(v)));
const bool = (v) => Boolean(Number(v));
const orNull = (v) => (v === undefined ? null : v);

let total = 0;

async function copy(table, data, label) {
  if (!data.length) {
    console.log(`  ${label}: 0 条`);
    return;
  }
  const res = await prisma[table].createMany({ data, skipDuplicates: true });
  total += res.count;
  console.log(`  ${label}: ${res.count} / ${data.length} 条`);
}

console.log("开始从 SQLite 迁移到 MySQL...");

try {
  await copy("user", rows("User").map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    school: orNull(r.school),
    major: orNull(r.major),
    targetRole: orNull(r.targetRole),
    email: orNull(r.email),
    passwordHash: orNull(r.passwordHash),
    phone: orNull(r.phone),
    createdAt: dt(r.createdAt),
    updatedAt: dt(r.updatedAt),
  })), "用户");

  await copy("resume", rows("Resume").map((r) => ({
    id: r.id,
    userId: r.userId,
    content: r.content,
    structuredJson: orNull(r.structuredJson),
    createdAt: dt(r.createdAt),
    updatedAt: dt(r.updatedAt),
  })), "简历");

  await copy("resumeAnalysis", rows("ResumeAnalysis").map((r) => ({
    id: r.id,
    userId: r.userId,
    resumeContent: r.resumeContent,
    score: r.score,
    completenessJson: r.completenessJson,
    issuesJson: r.issuesJson,
    keywordJson: r.keywordJson,
    fitJson: r.fitJson,
    strengthsJson: r.strengthsJson,
    createdAt: dt(r.createdAt),
  })), "简历诊断记录");

  await copy("jobAnalysis", rows("JobAnalysis").map((r) => ({
    id: r.id,
    userId: r.userId,
    jobName: r.jobName,
    jobDescription: r.jobDescription,
    score: r.score,
    keywordsJson: r.keywordsJson,
    strengthsJson: r.strengthsJson,
    gapsJson: r.gapsJson,
    deliveryAdviceJson: r.deliveryAdviceJson,
    directionsJson: r.directionsJson,
    createdAt: dt(r.createdAt),
  })), "岗位匹配记录");

  await copy("shareTag", rows("ShareTag").map((r) => ({ id: r.id, name: r.name })), "分享标签");
  await copy("sharePost", rows("SharePost").map((r) => ({
    id: r.id,
    authorId: r.authorId,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    category: r.category,
    likes: r.likes,
    views: r.views,
    favorites: r.favorites,
    isHot: bool(r.isHot),
    createdAt: dt(r.createdAt),
    updatedAt: dt(r.updatedAt),
  })), "分享帖");
  await copy("sharePostTag", rows("SharePostTag").map((r) => ({ postId: r.postId, tagId: r.tagId })), "分享标签关系");

  await copy("discussionTag", rows("DiscussionTag").map((r) => ({ id: r.id, name: r.name })), "讨论标签");
  await copy("discussionPost", rows("DiscussionPost").map((r) => ({
    id: r.id,
    authorId: r.authorId,
    title: r.title,
    content: r.content,
    category: r.category,
    status: r.status,
    views: r.views,
    createdAt: dt(r.createdAt),
    updatedAt: dt(r.updatedAt),
  })), "讨论帖");
  await copy("discussionReply", rows("DiscussionReply").map((r) => ({
    id: r.id,
    postId: r.postId,
    authorId: r.authorId,
    content: r.content,
    likes: r.likes,
    createdAt: dt(r.createdAt),
  })), "讨论回复");
  await copy("discussionPostTag", rows("DiscussionPostTag").map((r) => ({ postId: r.postId, tagId: r.tagId })), "讨论标签关系");

  console.log(`\n迁移完成，共写入 ${total} 条记录。`);
  console.log("可以在 MySQL 里检查：select count(*) from User;");
} catch (error) {
  console.error("\n迁移失败：", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
