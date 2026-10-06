import { describe, expect, it } from 'vitest';
import { moonPhase, phaseForSolarMinute, solarEvents } from '../src/systems/astronomy';

const beijing = { id: 'beijing', name: '北京', lon: 116.4, lat: 39.9 };

describe('天文近似计算', () => {
  it('返回合理的日出日落顺序', () => {
    const events = solarEvents(new Date(2026, 5, 21, 12), beijing);
    expect(events.dawn).toBeLessThan(events.sunrise);
    expect(events.sunrise).toBeLessThan(events.sunset);
    expect(events.sunset).toBeLessThan(events.dusk);
  });

  it('可以根据日出日落划分场景阶段', () => {
    const events = solarEvents(new Date(2026, 5, 21, 12), beijing);
    expect(phaseForSolarMinute(events.sunrise - 10, events)).toBe('dawn');
    expect(phaseForSolarMinute(12 * 60, events)).toBe('day');
    expect(phaseForSolarMinute(events.sunset + 10, events)).toBe('dusk');
  });

  it('月相照度始终在0到1之间', () => {
    const phase = moonPhase(new Date(2026, 9, 3, 12));
    expect(phase.illumination).toBeGreaterThanOrEqual(0);
    expect(phase.illumination).toBeLessThanOrEqual(1);
    expect(phase.label).toBeTruthy();
  });
});
