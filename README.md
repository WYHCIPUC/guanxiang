# 观象 · 天时人三部曲

《今时·中国时间》《步天》《璇玑·数字观象台》三项目的整合仓库（npm workspaces monorepo）。

> 观乎天文，以察时变；观乎人文，以化成天下。——《周易·贲·彖》

一座数字观象台，三间殿：

| 部 | 作品 | 位置 | 一句话 | 状态 |
|---|---|---|---|---|
| 时 | 今时·中国时间 | [`apps/jinshi/`](apps/jinshi/) | 把时间从数字里放出来，让它在山水之间行走 | 原型 v0.2.0，待试用 |
| 天 | 步天 | [`apps/butian/`](apps/butian/) | 同一片天空，两套名字，一台仪器 | v0.2.0，真实星表计算 |
| 人 | 璇玑·数字观象台 | [`apps/xuanji/`](apps/xuanji/) | 属于你的可旋转宇宙，与每日观象记录 | 桌面 Alpha v0.3.0 |

## 整体开发文档（总纲层）

| 文档 | 内容 |
|---|---|
| [00-观象总纲](docs/00-观象总纲.md) | 愿景、现状盘点、统一价值观、仓库结构 |
| [01-产品整合与联动方案](docs/01-产品整合与联动方案.md) | 联邦原则、观象档案、L1–L4 联动分层 |
| [02-技术整合方案](docs/02-技术整合方案.md) | monorepo 规划、P1 迁移映射、技术栈策略 |
| [03-共享内核规划](docs/03-共享内核规划.md) | core / palette / cardkit 三包设计 |
| [04-开发流程与质量基线](docs/04-开发流程与质量基线.md) | 命令约定、测试分层、伦理与无障碍 |
| [05-发布与传播策略](docs/05-发布与传播策略.md) | 发布矩阵、三卡体系、节气营销 |
| [06-整合路线图](docs/06-整合路线图.md) | P0–P4 阶段计划（P0、P1 已完成） |
| [整合决策记录](docs/decisions.md) | INT 系列跨产品决策 |

产品层文档：[docs/butian/](docs/butian/)（步天）、[apps/jinshi/docs/](apps/jinshi/docs/)、[apps/xuanji/docs/](apps/xuanji/docs/)。

## 快速开始

根目录一次性安装（npm workspaces）：

```bash
npm install        # 在仓库根执行，统一安装三应用依赖
npm run verify:all # 总闸门：依次跑三应用完整验收链
```

也可进入各应用目录独立安装与启动（联邦原则，见 INT-001）：

**步天**（`apps/butian`）

```bash
cd apps/butian
npm run dev        # 打开后访问 /app.html；双击 index.html 为静态预览
npm run build && npm run test:smoke && npm run test:astro && npm run test:render && npm run test:interaction   # 完整验收
```

**今时**（`apps/jinshi`）

```bash
cd apps/jinshi
npm install
npm run dev
npm run check-release   # 单测 + 构建 + 发布检查 + 界面冒烟
```

**璇玑**（`apps/xuanji`；Windows 优先桌面客户端，网页为开发预览）

```powershell
cd apps/xuanji
npm start               # 网页预览 http://127.0.0.1:4173/（或双击 启动璇玑.bat）
npm run desktop:dev     # Electron 桌面壳
npm run verify          # 六链完整验收
```

所有检查均在本地运行，不上传用户文件；三项目均无后端、无账号、无追踪。

## 共同约定

- 用户数据只存本地，可导出、可导入、可删除；
- 历法与术数内容为文化演绎，口径与近似性在页面明示，不构成人生建议；
- 内容来源逐条登记（步天 `apps/butian/SOURCES.md`、今时 `apps/jinshi/src/content/sources.json`、璇玑 `apps/xuanji/docs/content-sources.md`）；
- 对外宣传边界以 [05 文档](docs/05-发布与传播策略.md)第三节为准。

## 下一步

见 [06-整合路线图](docs/06-整合路线图.md)：P0（文档统一）、P1（仓库归一）已完成；P2（共享内核抽取）待璇玑历法核验与今时试用结论后推进。
