# 璇玑 · 数字观象台

璇玑的主要产品形式是 Windows 优先的桌面客户端。当前仓库同时包含原生前端核心、桌面客户端开发 Alpha 壳和浏览器开发预览，用来验证“今日观象 → 记录一件事 → 七日复盘”的持续使用闭环；总盘、五行、命纹是个人底色和视觉锚点。

## 产品形态

- **主要交付物**：无地址栏的单窗口桌面客户端；当前 Electron 开发壳已安装依赖并通过静态安全检查，尚未生成安装包。
- **开发预览**：使用 `npm start` 打开的本地网页，便于 AI 和负责人快速检查界面；它不是主要发布形态。
- **正式桌面路线**：先验证桌面窗口和本地存储，再决定打包器、签名和安装包；具体边界见 [桌面客户端形态修订](docs/desktop-client-plan.md)。

## 开发预览启动方式

在项目目录打开终端，运行：

```powershell
npm start
```

然后打开 <http://127.0.0.1:4173/>。Node.js 是运行 JavaScript 的工具，`npm` 是随 Node.js 提供的命令工具；这里使用项目自带的 Node 内置静态服务器，不需要安装额外的第三方包。

如果提示端口已被占用，可运行 `npm start -- --port 4174`，再打开 <http://127.0.0.1:4174/>。

Windows用户也可以直接双击根目录的 `启动璇玑.bat`。

如果电脑没有 Node.js，也可以使用 Python 的备用方式：

```powershell
python -m http.server 4173 --directory D:\璇玑
```

不要把直接双击 `index.html` 当作网页预览的正式测试方式：浏览器可能阻止 `file://` 下的模块脚本加载。桌面客户端不会依赖网页 Service Worker；它会由桌面壳加载随包提供的本地资源。

## 桌面开发 Alpha

在项目目录运行：

```powershell
npm install --save-dev electron
npm run desktop:dev
```

第一次安装会下载较大的开发依赖；如果依赖已经存在，可直接运行第二条命令。当前桌面壳的安全设置和窗口边界可先运行：

```powershell
npm run desktop-check
```

检查项目文件是否完整：

```bash
npm test
```

这个检查不需要安装依赖，会验证入口、计算模块、核心流程文件和离线缓存行为。

发布前再运行：

```bash
npm run verify
```

`npm run verify` 会依次运行静态构建检查、桌面壳检查、方案完整性检查、核心烟测、发布检查和 HTTP 资源检查。它不会生成桌面安装包；安装包必须在桌面 Alpha 通过后单独配置和验收。

验证静态服务器实际能返回资源：

```bash
npm run http-check
```

这个检查默认使用临时的 Node 静态检查服务器，不需要安装额外依赖；设置 `XUANJI_HTTP_BASE` 时也可以检查一个已经启动的服务器。

## 当前包含

- 姓名（可选）和公历生日输入
- 性别和出生时辰暂不进入当前版本计算；避免在资料不足时生成猜测结果
- 三柱基础盘面（近似节气口径，仍需正式核验）
- 五行分布与主色
- 本命星官V2试验页（28日循环演示）
- 阴阳四维V2试验页（四条可调滑杆）
- 生日节气V2试验页（固定日期表演示）
- 命纹生成
- 总盘、命盘、五行、命纹详情页
- 说明与隐私页
- 浏览器本地保存
- 总盘鼠标/触摸拖拽旋转
- 分享摘要复制、SVG卡片下载、打印保存路径
- 出生日期范围校验和本地记录清除
- 移动端布局和 `prefers-reduced-motion` 支持
- 桌面客户端开发 Alpha 壳（Electron，未打包）
- 今日观象：选择一个五行行动镜头，记录一件事、场景、事实、感受、下一步、精力、专注和完成状态
- 观象日志：按日期编辑和回看本地记录，可导出/导入 JSON；导入会先预览，删除后支持 5 秒内撤销
- 记录对照：选择两条记录并排查看，帮助用户比较当时的事实、感受、行动和个人底色
- 七日复盘：显示记录天数、连续记录、平均精力/专注、完成事项和镜头使用情况
- 浏览器预览的离线缓存（Service Worker；不作为桌面离线证据）

## 当前限制

当前三柱和五行计算使用近似节气边界、公历日序和天干地支五行映射，用于验证交互，不应作为正式历法结论。正式发布前需要用核验资料逐条确认边界、时区和样本结果，并重新审核所有文案和来源。

本命星官页面是V2垂直切片，当前使用28日循环作为产品化演示，不代表正式二十八宿定位。
生日节气页面使用固定近似日期表，不代表精确节气时刻。

本原型不包含账号、后端、外部API、支付、社区和用户数据上传；桌面壳也不暴露文件系统或 Shell API。日志复盘只描述用户自己填写的数据，不生成自动预测或因果结论。

当前创意文档中提到的生肖/纳音/太岁、五格印、二十五人对照、双雷达、音效、PNG、大运、合婚和称骨等模块均留到后续版本，不作为当前发布承诺。

相关记录：

- [docs/初步开发设计整体方案.md](docs/初步开发设计整体方案.md)：面向零基础负责人的十四部分执行方案
- [docs/desktop-client-plan.md](docs/desktop-client-plan.md)：桌面客户端形态、Electron/Tauri路线和桌面验收
- [docs/value-loop-local-journal.md](docs/value-loop-local-journal.md)：从一次性盘面升级为观象记录工作台的产品设计
- [docs/testing.md](docs/testing.md)：第一阶段验收检查
- [docs/browser-qa-2026-10-04.md](docs/browser-qa-2026-10-04.md)：真实浏览器验收记录
- [docs/completion-audit-2026-10-04.md](docs/completion-audit-2026-10-04.md)：完成审计与负责人门槛
- [docs/external-gate-status-2026-10-04.md](docs/external-gate-status-2026-10-04.md)：外部发布门槛的当前状态
- [docs/external-qa-runbook.md](docs/external-qa-runbook.md)：电脑、手机、离线和真实用户验收手册
- [docs/user-test.md](docs/user-test.md)：真实用户试用记录模板
- [docs/decisions.md](docs/decisions.md)：口径、范围和技术决策
- [docs/content-sources.md](docs/content-sources.md)：内容来源与版权登记
- [docs/algorithm-spec.md](docs/algorithm-spec.md)：基础计算模块规格和替换门槛
- [docs/release.md](docs/release.md)：启动、静态部署和发布检查
- [CHANGELOG.md](CHANGELOG.md)：版本更新记录
- [docs/roadmap-status.md](docs/roadmap-status.md)：各阶段完成状态和发布门槛
