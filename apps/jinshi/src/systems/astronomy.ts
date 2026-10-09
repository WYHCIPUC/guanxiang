// 太阳与月相计算——实现已上收共享内核 @guanxiang/core/solar（packages/core）。
// 本文件是既有 import 路径的兼容门面；精度口径不变（NOAA 近似，教学精度）。
export { solarEvents, phaseForSolarMinute, moonPhase } from '@guanxiang/core/solar';
export type { SolarEvents, MoonPhase, Phase } from '@guanxiang/core/solar';
