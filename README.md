# Forest Data - AI 应用作品集

这是一个可以放到 GitHub 上展示的个人作品集项目。首页是公开的作品集页面，内容来自本地 JSON 文件；原来的 AI 工具工作台、运营 BI、记账台、股票概念学习和 Image2Video 仍保留为可运行演示模块。

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
- 保留原应用演示入口，登录页在 `/login`，工作台在 `/app`。
- 新增 GitHub Pages 自动部署工作流 `.github/workflows/deploy-pages.yml`。
- 新增 `.gitignore`，忽略依赖、构建产物、上传文件、生成视频和后端运行数据。

## 功能模块

- **个人作品集首页**：公开展示个人定位、项目模块、技能关键词、项目演进和改动备注。
- **Aether Studio 工作台**：统一登录、侧栏导航、模块化业务页面和内置 AI 助手。
- **运营 BI 看板**：展示活跃用户、渠道来源、转化漏斗、活动推进和异常预警。
- **个人记账台**：支持收支记录、分类统计、流水表格和本地文件数据保存。
- **股票概念理解**：整理股票指标、概念学习和偏好扫描结果。
- **Image2Video**：上传图片后配置字幕、分辨率、帧率和转场，生成可预览下载的视频。

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

- **前端**：React 18 + Vite + React Router + lucide-react
- **后端**：Python FastAPI + Pydantic + 文件型 JSON 存储
- **视频生成**：Pillow + imageio + imageio-ffmpeg
- **部署**：GitHub Pages + GitHub Actions