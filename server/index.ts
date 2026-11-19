import cors from "cors";
import express from "express";
import os from "node:os";
import path from "node:path";
import { authRouter } from "./routes/auth.ts";
import { appRouter } from "./routes/app.ts";

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api", appRouter);

// 托管前端构建产物（npm run build 生成的 dist）
const distDir = path.join(process.cwd(), "dist");
app.use(express.static(distDir));

// 前端路由兜底：非 /api 的请求一律返回 index.html（支持 React Router 刷新）
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(distDir, "index.html"));
});

/** 列出本机可被局域网访问的 IPv4 地址 */
function lanAddresses(): string[] {
  const result: string[] = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const info of interfaces[name] ?? []) {
      if (info.family === "IPv4" && !info.internal && !info.address.startsWith("169.254.")) {
        result.push(info.address);
      }
    }
  }
  return result;
}

app.listen(port, "0.0.0.0", () => {
  console.log("");
  console.log("  职航AI / 职引未来  已启动");
  console.log(`  本机访问：    http://localhost:${port}`);
  for (const ip of lanAddresses()) {
    console.log(`  同网段访问：  http://${ip}:${port}`);
  }
  console.log("");
  console.log("  提示：如果页面打不开，先在项目目录执行一次 npm run build");
  console.log("");
});
