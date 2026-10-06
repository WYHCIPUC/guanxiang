export type City = { id: string; name: string; lon: number; lat: number };

export const cities: City[] = [
  { id: 'beijing', name: '北京', lon: 116.4, lat: 39.9 },
  { id: 'shanghai', name: '上海', lon: 121.5, lat: 31.2 },
  { id: 'guangzhou', name: '广州', lon: 113.3, lat: 23.1 },
  { id: 'chengdu', name: '成都', lon: 104.1, lat: 30.7 },
  { id: 'urumqi', name: '乌鲁木齐', lon: 87.6, lat: 43.8 },
];

export const signTexts = [
  '把此刻收好，时间会替你继续向前。',
  '日影正在移动，山水也有自己的刻度。',
  '你所站的这一刻，今天只会经过一次。',
  '慢一点看，天色正在告诉你时间。',
];
