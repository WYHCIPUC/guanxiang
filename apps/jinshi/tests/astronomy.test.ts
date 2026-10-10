import { describe, expect, it } from 'vitest';
import { moonPhase, phaseForSolarMinute, solarEvents } from '../src/systems/astronomy';
import { cities } from '../src/content/data';

// 与产品同源的城市坐标（@guanxiang/core/cities，北京为四位精度合并值）——锚点快照据此计算
const beijing = cities.find((city) => city.id === 'beijing') ?? { id: 'beijing', name: '北京', lat: 39.9042, lon: 116.4074 };

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

  // 数值锚点（防漂移）：实现已上收 @guanxiang/core/solar，以下快照为当前正确输出；
  // 共享内核改动导致任一值漂移时，此测试当场红链，防止无感回归。
  it('夏至晨昏快照（北京 2026-06-21）', () => {
    const events = solarEvents(new Date(2026, 5, 21, 12), beijing);
    expect(events.sunrise).toBeCloseTo(285.511, 2);
    expect(events.sunset).toBeCloseTo(1185.886, 2);
    expect(events.dusk - events.sunset).toBeCloseTo(30, 6);
  });

  it('冬至晨昏快照（北京 2026-12-21）', () => {
    const events = solarEvents(new Date(2026, 11, 21, 12), beijing);
    expect(events.sunrise).toBeCloseTo(452.090, 2);
    expect(events.sunset).toBeCloseTo(1012.309, 2);
  });

  it('冬夏日出日落符合昼夜长短规律', () => {
    const summer = solarEvents(new Date(2026, 5, 21, 12), beijing);
    const winter = solarEvents(new Date(2026, 11, 21, 12), beijing);
    expect(summer.sunrise).toBeLessThan(winter.sunrise);
    expect(summer.sunset).toBeGreaterThan(winter.sunset);
  });

  it('月相锚点：历元新月与满月', () => {
    const newMoon = moonPhase(new Date('2000-01-06T18:14:00Z'));
    expect(newMoon.age).toBeLessThan(0.05);
    expect(newMoon.illumination).toBeLessThan(0.01);
    expect(newMoon.label).toBe('朔月');
    const fullMoon = moonPhase(new Date('2000-01-21T06:14:00Z'));
    expect(fullMoon.illumination).toBeGreaterThan(0.99);
    expect(fullMoon.label).toBe('满月');
  });
});
