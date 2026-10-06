# 步天 · 最小可运行原型

同一片天空，两套名字，一台仪器。星点按 J2000 星表坐标随时间与地点实时计算（教学精度）。

- 产品文档：[`docs/butian/`](../../docs/butian/)（范围、决策、测试清单）
- 系列总纲：[`docs/`](../../docs/)（观象 · 天时人三部曲）
- 启动：`npm install` 后 `npm run dev`，访问 `/app.html`（React 版）；`index.html` 为可双击打开的静态预览
- 验收链：`npm run build && npm run test:smoke && npm run test:astro && npm run test:render && npm run test:interaction`
