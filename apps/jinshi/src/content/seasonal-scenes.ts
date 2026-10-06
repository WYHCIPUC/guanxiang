import type { Phase } from '../systems/time-system';

// These are intentionally product-facing scene labels, not claims about a
// historical fixed flower calendar. Replace them with reviewed solar-term data
// before presenting them as factual phenology.
export const seasonalScenes: Record<Phase, { label: string; note: string }> = {
  dawn: { label: '花信初醒', note: '露水还在叶尖，天色从纸白慢慢透亮。' },
  day: { label: '花信正盛', note: '日影向前，山水把午后的光铺开。' },
  dusk: { label: '花信将息', note: '光线收拢，远山先一步进入暮色。' },
  night: { label: '花信入梦', note: '看不见的生长仍在继续，夜色替它守着。' },
};
