# 部署说明

## 本地预览

直接双击项目根目录的 `index.html`，适合离线检查静态预览。

## 本地开发

```bash
npm install
npm run dev
```

然后访问终端显示的地址：

- `/`：无依赖静态预览；
- `/app.html`：React/Vite 组件化版本。

## 构建

```bash
npm run build
```

构建输出在 `dist/`：

- `dist/index.html`：静态预览；
- `dist/app.html`：React版本；
- `dist/assets/`：React版本的脚本和样式。

## GitHub Pages准备

1. 创建一个空的GitHub仓库。
2. 将整个项目上传，保留 `package.json`、`src/`、`index.html`、`app.html` 和 `.github/workflows/pages.yml`。
3. 在仓库设置中启用GitHub Pages，并选择使用GitHub Actions部署。
4. 推送到 `main` 分支后，工作流会自动执行安装、构建和冒烟检查，再发布 `dist/`。
5. 第一轮公开试用建议先分享静态预览页面，避免把未经来源核验的正式数据当作最终产品发布。

当前目录还没有Git仓库或远程地址，因此本轮只完成本地可部署产物，没有擅自上传到外部服务。
