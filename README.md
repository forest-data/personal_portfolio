# Forest Data - AI Agent / LLM 应用作品集

这是一个可以放到 GitHub 上展示的个人作品集项目。首页重点展示 AI Agent / LLM 工程能力，内容来自本地 JSON 文件；`llm_agent` 里的天气 Agent、电商多 Agent、服务器监控 Agent、MCP 工具封装和学习笔记已经整理进作品集首页。

仓库地址：`git@github.com:forest-data/personal_portfolio.git`

## 在线展示

推送到 `main` 分支后，仓库内的 GitHub Actions 会自动构建前端并发布到 `gh-pages` 分支。

预计访问地址：

```text
https://forest-data.github.io/personal_portfolio/
```

如果第一次发布后页面没有立即出现，可以到 GitHub 仓库的 `Settings -> Pages` 中确认 Source 使用 `Deploy from a branch`，Branch 选择 `gh-pages`，目录选择 `/root`。

## 作品集数据

作品集首页的数据以文件形式维护在：

```text
frontend/src/data/portfolio.json
```

你可以直接在 GitHub 上打开这个文件查看，也可以修改其中的个人介绍、项目列表、技能标签、时间线和改动备注。前端页面会自动读取这个 JSON 文件渲染内容。

## 本次改动备注

- 新增公开个人主页，默认访问 `/` 即可查看作品集。
- 新增 `frontend/src/data/portfolio.json`，作品集文案和项目数据都用文件维护。
- 首页定位改为 AI Agent / LLM 方向，并纳入 `llm_agent` 相关案例展示。
- 保留原应用演示入口，登录页在 `/login`，工作台在 `/app`。
- 新增 GitHub Pages 自动部署工作流 `.github/workflows/deploy-pages.yml`。
- 新增 `.gitignore`，忽略依赖、构建产物、上传文件、生成视频和后端运行数据。

## 功能模块

- **天气 Agent**：LLM + LangGraph + MCP 天气工具调用，支持规则/LLM 双模式和 trace 展示。
- **电商客服 / 运营多 Agent**：Router、CustomerService、Ops、Knowledge 多 Agent 协作。
- **服务器监控 Agent**：通过 MCP 采集本机指标，SQLite 留存快照，LangGraph 输出排障建议。
- **MCP 工具封装**：把 Open-Meteo REST API 封装成 Tools、Resources、Prompts。
- **AI Agent 学习笔记**：整理 LLM、Agent、Harness、LangGraph、MCP、Spring AI 的知识体系。
- **Aether Studio 工作台**：保留原前端工作台，作为 AI 产品化界面的补充展示。

## 快速启动

### 1. 启动后端

在项目根目录执行：

```bash
cd backend
pip install -r requirements.txt
python main.py
```

后端默认运行在 `http://localhost:8000`。

### 2. 启动前端

新开一个终端执行：

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:3000`。

### 3. 打开项目

- 作品集首页：`http://localhost:3000`
- 登录演示：`http://localhost:3000/#/login`
- 工作台演示：登录后进入 `http://localhost:3000/#/app`

## 测试账号

- `demo@qq.com` / `123456`
- `ss@qq.com` / `123456`

## 技术栈

- **Agent**：LangGraph + MCP + Tool Calling + 多 Agent 编排
- **后端**：Python Flask / FastAPI + MySQL / SQLite + 文件型 JSON 存储
- **前端**：React 18 + Vite + React Router + lucide-react
- **AI 应用能力**：上下文记忆、LLM Cache、Prompt 版本、任务 trace、规则兜底
- **部署**：GitHub Pages + GitHub Actions