import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 允许同网段的手机/同学电脑访问开发预览（http://你的IP:5173）
    host: true,
    proxy: {
      "/api": "http://localhost:3001",
    },
    watch: {
      // 编辑器「原子保存」会生成 .xxx.tmpdir/xxx.tmp 这类临时目录，
      // Windows 上监听它会报 EBUSY 并把整个 vite 进程带崩（页面直接白屏）。
      ignored: ["**/.*.tmpdir/**", "**/*.tmp", "**/*.swp", "**/*.bak"],
    },
  },
});
