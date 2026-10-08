# 《步天》原型来源记录

本原型使用自绘 SVG 线稿、CSS 背景、系统字体、手工整理数据和一份开源星表，未打包外部图片、商业字体或音频。

## 数据

- 背景星野：**HYG Database v3.5**（David Nash / astronexus），许可 **CC BY-SA 4.0**，
  来源 https://github.com/astronexus/HYG-Database 。本仓库使用其过滤衍生版：
  星等 ≤ 5.5 的 2,865 颗（J2000，赤经换算为度，剔除太阳），由
  `scripts/build-starfield.mjs` 生成 `src/data/starfield.ts`，生成日期 2026-10-06。
  原始 CSV（`.hyg-*.csv`）不入库（见 `.gitignore`），需要时按脚本注释地址重新下载。
- 交互恒星赤经赤纬（参宿七星、北斗七星）：J2000 历元标准值的手工整理，教学精度。
- 二十八宿距星赤经：J2000 近似值手工整理，待逐宿校对；觜宿在 J2000 呈“负宽度”，按退化宿处理（详见 `src/lib/astro.ts` 注释）。
- 二十八宿成员星（`src/data/lodges.ts`，27 宿 121 星）：成员识别为常见口径的手工整理（待逐宿校对；翼宿取代表星、张宿/奎宿为子集），J2000 坐标取自 HYG v3.5；由 `scripts/build-lodges.mjs` 生成。
- 88 西方星座连线（`src/data/western-sky.ts`，86 组 698 段）：取自 **d3-celestial**（Olaf Frohn，**BSD-3-Clause**，https://github.com/ofrohn/d3-celestial ），由 `scripts/build-western-sky.mjs` 生成（排除 Ori/UMa，赤经归一化 0–360°）。BSD 再分发需保留版权声明：本条即为其来源声明。
- 三垣主官（`src/data/enclosures.ts`，3 垣 9 星）：成员为常见口径的手工整理（各垣代表主官，待校对），J2000 坐标取自 HYG v3.5；由 `scripts/build-enclosures.mjs` 生成。
- 客星剧场史料：《宋史·天文志》《宋会要辑稿》相关记载（公版），见于 `src/lib/kestar.ts`。
- 星官连线与说明：本原型自绘与自撰，待接入经过许可核验的正式星官资料。
- 坐标读数：由上述坐标实时换算；教学近似值（未含岁差归算与大气折射修正），不代表专业天文测量结果。

## 代码

- React / Vite / TypeScript：依赖版本和许可证以 `package.json` 与安装时的官方包信息为准。

## 版权边界

- HYG（CC BY-SA 4.0）的署名要求已在本文件履行；衍生数据（starfield.ts）随仓库分发时须保持相同许可声明。
- 发布前必须补充正式星官整理、字体和音频的来源、许可证、署名要求和核查日期。
