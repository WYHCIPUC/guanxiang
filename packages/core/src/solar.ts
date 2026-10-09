// 共享内核 · 太阳与月相（教学精度）
// NOAA-style approximation, accurate enough for a visual prototype.
// 迁移自 apps/jinshi/src/systems/astronomy.ts（2026-10-09，行为不变）

export type Phase = 'night' | 'dawn' | 'day' | 'dusk';

const RAD = Math.PI / 180;
const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export type SolarEvents = { dawn: number; sunrise: number; sunset: number; dusk: number };

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

function clampMinute(value: number) { return Math.max(0, Math.min(1439, value)); }

/** NOAA-style approximation, accurate enough for a visual prototype. */
export function solarEvents(date: Date, city: { lat: number; lon: number }, timezone = 8): SolarEvents {
  const n = dayOfYear(date);
  const gamma = (2 * Math.PI / 365) * (n - 1);
  const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const latitude = city.lat * RAD;
  const cosHourAngle = (Math.cos(90.833 * RAD) / (Math.cos(latitude) * Math.cos(declination))) - Math.tan(latitude) * Math.tan(declination);
  if (cosHourAngle >= 1 || cosHourAngle <= -1) return { dawn: 0, sunrise: 0, sunset: 1439, dusk: 1439 };
  const hourAngle = Math.acos(cosHourAngle) / RAD;
  const solarNoon = 720 - 4 * city.lon - equation + timezone * 60;
  const sunrise = solarNoon - 4 * hourAngle;
  const sunset = solarNoon + 4 * hourAngle;
  return { dawn: clampMinute(sunrise - 30), sunrise: clampMinute(sunrise), sunset: clampMinute(sunset), dusk: clampMinute(sunset + 30) };
}

export function phaseForSolarMinute(minute: number, events: SolarEvents): Phase {
  const m = ((minute % 1440) + 1440) % 1440;
  if (m < events.dawn || m >= events.dusk) return 'night';
  if (m < events.sunrise) return 'dawn';
  if (m <= events.sunset) return 'day';
  return 'dusk';
}

export type MoonPhase = { age: number; label: string; illumination: number };

export function moonPhase(date: Date): MoonPhase {
  const age = ((date.getTime() - KNOWN_NEW_MOON) / 86400000) % SYNODIC_MONTH;
  const normalized = (age + SYNODIC_MONTH) % SYNODIC_MONTH;
  const phase = normalized / SYNODIC_MONTH;
  const labels = ['朔月', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];
  return { age: normalized, label: labels[Math.round(phase * 8) % 8], illumination: (1 - Math.cos(phase * 2 * Math.PI)) / 2 };
}
