# 职引未来 · 大学生就业与简历优化智能服务平台

> 2026 第五届"未来杯"创新大赛 · 赛道二（科学智能 AI4S 流程与应用创新）
> 宁夏大学 · 职在必得队

一个面向大学生求职场景的轻量 Web 平台：从结构化简历、AI 简历诊断、岗位匹配，到 AI 视频模拟面试与教师端学情统计，
把"写简历—选岗位—练面试"串成一条完整链路。

---

## 一、核心功能

| 模块 | 说明 |
|---|---|
| 简历填写 | 在线结构化填写；支持上传 PDF / DOCX 自动解析并导入表单 |
| AI 简历诊断 | 打分 + 完整度检查 + 问题清单 + 逐条修改方向，可保存历史记录 |
| 岗位匹配 | 粘贴 JD，提取能力关键词，输出匹配度、匹配优势、能力缺口与投递建议 |
| 模拟面试 | 基于智谱 GLM Realtime 的实时语音/视频对话，同步文字转录（需配置 Key） |
| 成长工作台 | 简历、诊断、匹配记录统一留存，展示准备进度 |
| 社区 | 经验分享帖、讨论区提问与回复 |
| 教师端 | 学生账号概况、平均简历/匹配得分、问题分布、活跃统计 |

> AI 能力采用"能连大模型就连，连不上自动回退本地规则引擎"的策略，保证离线或没有 Key 时依然可演示、不中断。

## 二、技术栈

- 前端：React 18 + TypeScript + Vite + React Router
- 后端：Express 5（Node.js，原生 TS 运行）
- 数据库：MySQL 8（推荐）/ SQLite（可选），ORM 使用 Prisma
- 大模型：DeepSeek Chat API（JSON 结构化输出）；智谱 GLM Realtime（实时音视频面试）

## 三、目录结构

```
.
├─ src/                 # 前端
│  ├─ pages/            # 登录、工作台、简历、岗位、面试、社区、教师端
│  ├─ context/          # 全局状态（登录态、简历草稿、自动保存）
│  ├─ layouts/          # 侧边栏框架
│  ├─ lib/              # 接口封装、实时通话、简历工具
│  └─ mock/             # 本地规则引擎（AI 兜底）
├─ server/              # 后端
│  ├─ routes/           # auth / app 路由
│  └─ lib/              # Prisma、DeepSeek、简历解析、格式化
├─ prisma/
│  ├─ schema.prisma     # 当前使用的 schema（当前为 MySQL）
│  ├─ schema.mysql.prisma
│  ├─ schema.sqlite.prisma
│  └─ seed.ts           # 演示数据
├─ scripts/             # 数据迁移、切换到 MySQL
└─ 启动服务器.bat / 停止服务器.bat   # Windows 一键脚本
```

## 四、快速开始

**环境要求**：Node.js ≥ 20，MySQL 8（或改用 SQLite）

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（Windows 下可复制 .env.example 为 .env）
cp .env.example .env
# 编辑 .env，把 DATABASE_URL 改成你自己的数据库

# 3. 生成 Prisma 客户端并建表
npx prisma generate
npx prisma db push

# 4. （可选）写入演示数据
npm run db:seed

# 5. 启动
npm run dev     # 开发模式：前端 http://localhost:5173，后端 :3001
# 或
npm run serve   # 生产模式：构建后由 Express 统一托管在 http://localhost:8080
```

### 切换到 SQLite（不想装 MySQL 时）

```bash
# 用 SQLite 版 schema 覆盖当前 schema
copy prisma\schema.sqlite.prisma prisma\schema.prisma     # Windows
cp prisma/schema.sqlite.prisma prisma/schema.prisma         # macOS / Linux
# .env 改成 DATABASE_URL="file:./dev.db"
npx prisma generate && npx prisma db push && npm run db:seed
```

## 五、环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | MySQL：`mysql://用户:密码@127.0.0.1:3306/career_ai`；SQLite：`file:./dev.db` |
| `DEEPSEEK_API_KEY` | 否 | 不填时自动使用本地规则引擎 |
| `DEEPSEEK_BASE_URL` | 否 | 默认 `https://api.deepseek.com` |
| `VITE_ZHIPU_API_KEY` | 否 | 视频模拟面试用；也可以在页面里临时填写 |
| `PORT` | 否 | 生产模式端口，默认 3001；`npm run serve` 脚本里用 8080 |

> 仓库中不包含 `.env`、数据库文件和任何密钥，请按 `.env.example` 自行配置。

## 六、演示账号

| 角色 | 邮箱 | 密码 |
|---|---|---|
| 学生 | `student@demo.local` | `123456` |
| 教师 | `teacher@demo.local` | `123456` |

（执行 `npm run db:seed` 后生成；也可以直接在登录页注册新账号。）

## 七、局域网访问（把自己的电脑当服务器）

```bash
npm run serve
```

启动后终端会打印：

```
本机访问：    http://localhost:8080
同网段访问：  http://192.168.x.x:8080
```

同一 Wi-Fi 下的手机 / 其他电脑用第二个地址即可访问。若要公网访问，需要额外做内网穿透（如 cloudflared）或部署到云服务器。

## 八、常见问题

**1. `prisma generate` 报 EPERM / 文件被占用**
先停掉正在运行的 `node` 进程（占用 Prisma 引擎 DLL），再重新生成。

**2. 登录后刷新掉线 / 内容丢失**
项目已做持久化：登录态存 `localStorage`，简历编辑有本地草稿并自动写库。若仍异常，请确认浏览器未禁用本地存储。

**3. MySQL 连接失败**
检查 `DATABASE_URL` 里的用户名、密码（特殊字符要 URL 编码，如 `@` → `%40`）、端口和库名，并确认 MySQL 服务已启动。

**4. 页面白屏**
打开浏览器控制台看第一条红色报错；常见原因是后端未启动（`/api` 请求失败）。

## 九、团队

- 宁夏大学 · 职在必得队
- 队长：丁希妍　队员：张宁　指导教师：吴笑江
