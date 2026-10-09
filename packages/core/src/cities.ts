// 共享内核 · 城市坐标（代表点，教学精度）
// 北京/上海/广州取步天四位精度值，成都/乌鲁木齐沿用今时值（2026-10-09 上收合并）。
// 字段序统一为 { id, name, lat, lon }——结构类型下与 lon/lat 声明序互通，消费方无感。

export type City = { id: string; name: string; lat: number; lon: number };

export const cities: City[] = [
  { id: 'beijing', name: '北京', lat: 39.9042, lon: 116.4074 },
  { id: 'shanghai', name: '上海', lat: 31.2304, lon: 121.4737 },
  { id: 'guangzhou', name: '广州', lat: 23.1291, lon: 113.2644 },
  { id: 'chengdu', name: '成都', lat: 30.7, lon: 104.1 },
  { id: 'urumqi', name: '乌鲁木齐', lat: 43.8, lon: 87.6 },
];
