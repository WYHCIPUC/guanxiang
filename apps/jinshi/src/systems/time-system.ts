import type { City } from '../content/data';

export type Phase = 'night' | 'dawn' | 'day' | 'dusk';

export function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

// A compact equation-of-time approximation is enough for this first prototype.
function equationOfTime(date: Date) {
  const b = (2 * Math.PI * (dayOfYear(date) - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

export function solarMinute(date: Date, city: City) {
  const longitudeCorrection = (city.lon - 120) * 4;
  return minutesOfDay(date) + longitudeCorrection + equationOfTime(date);
}

export function wrapMinute(minute: number) {
  return (minute + 1440) % 1440;
}

export function phaseFor(minute: number): Phase {
  const m = wrapMinute(minute);
  if (m >= 300 && m < 420) return 'dawn';
  if (m >= 420 && m < 1020) return 'day';
  if (m >= 1020 && m < 1140) return 'dusk';
  return 'night';
}

export function phaseLabel(phase: Phase) {
  return { night: '夜半', dawn: '黎明', day: '白昼', dusk: '黄昏' }[phase];
}

export function formatClock(minute: number) {
  const m = Math.round(wrapMinute(minute));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function hourLabel(minute: number) {
  const hour = Math.floor(wrapMinute(minute) / 60);
  const minutePart = Math.floor(wrapMinute(minute) % 60);
  const hourNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const index = Math.floor(((hour + 1) % 24) / 2);
  const quarter = Math.min(3, Math.floor(minutePart / 15));
  const quarterLabel = ['初', '一刻', '二刻', '三刻'][quarter];
  return `${hourNames[index]}时${quarterLabel}`;
}

export function watchLabel(minute: number) {
  const m = wrapMinute(minute);
  if (m >= 19 * 60 && m < 21 * 60) return '一更';
  if (m >= 21 * 60 && m < 23 * 60) return '二更';
  if (m >= 23 * 60 || m < 1 * 60) return '三更';
  if (m >= 1 * 60 && m < 3 * 60) return '四更';
  if (m >= 3 * 60 && m < 5 * 60) return '五更';
  return '';
}
