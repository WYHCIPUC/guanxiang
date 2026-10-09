export type City = { id: string; name: string; lon: number; lat: number };

// 城市坐标已上收共享内核 @guanxiang/core/cities（北京/上海/广州为四位精度合并值）；字段访问 lon/lat 不变
export { cities } from '@guanxiang/core/cities';

export const signTexts = [
  '把此刻收好，时间会替你继续向前。',
  '日影正在移动，山水也有自己的刻度。',
  '你所站的这一刻，今天只会经过一次。',
  '慢一点看，天色正在告诉你时间。',
];
