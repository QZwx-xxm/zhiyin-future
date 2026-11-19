import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { toUserProfile } from "../lib/formatters.ts";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, "请输入至少 2 个字符的昵称"),
  email: z.string().email("请输入正确的邮箱"),
  password: z.string().min(6, "密码至少 6 位"),
  role: z.enum(["student", "teacher"]).default("student"),
});

const loginSchema = z.object({
  email: z.string().email("请输入正确的邮箱"),
  password: z.string().min(1, "请输入密码"),
});

authRouter.get("/accounts", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  res.json(
    users.map((user) => ({
      ...toUserProfile(user),
      label: `${user.name} · ${user.role === "teacher" ? "教师端" : "学生端"}`,
    })),
  );
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "注册信息不完整" });
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (exists) {
    return res.status(400).json({ message: "该邮箱已被注册" });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      targetRole: parsed.data.role === "student" ? "待填写求职意向" : "就业指导教师",
    },
  });

  return res.json({
    user: toUserProfile(user),
    message: "注册成功，请登录",
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "登录信息不完整" });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || !user.passwordHash) {
    return res.status(400).json({ message: "账号或密码错误" });
  }

  const matched = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!matched) {
    return res.status(400).json({ message: "账号或密码错误" });
  }

  return res.json({
    user: toUserProfile(user),
  });
});
