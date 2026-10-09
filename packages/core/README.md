# @guanxiang/core · 观象三部曲共享内核

三部曲唯一的天文/历法/格式化实现（盘点与迁移顺序见 `docs/07-P2共享内核盘点.md`）。

## 模块

| 导出 | 内容 | 迁移自 |
| --- | --- | --- |
| `@guanxiang/core/sidereal` | 恒星时、赤道→地平、天穹投影、升起时刻（J2000 教学精度） | 步天 `lib/astro.ts` |
| `@guanxiang/core/format` | 度分秒、时刻、八方位格式化 | 步天 `lib/astro.ts` |
| `@guanxiang/core/solar` | 晨昏、太阳赤纬、月相（NOAA 近似） | 今时 `systems/astronomy.ts` |
| `@guanxiang/core/cities` | 城市代表点坐标（`{id,name,lat,lon}`） | 今时 `content/data.ts` |

## 约定

- **精度口径**：全部为教学精度（J2000、未含岁差/折射；节气精确版 `terms` 待璇玑历法核验后上收）。接口带 `mode` 字段时必须向用户声明口径。
- **分发**：TS 源直接经 package `exports` 暴露；步天/今时（Vite + Node 类型剥离）引源即可。璇玑（无构建原生 JS）待其历法核验后走 `.js` 产物接入。
- **行为基线**：迁移前后的数值锚点断言在各应用检查脚本里（步天 astro-check / 今时 check-release），改本包必须全链绿。
