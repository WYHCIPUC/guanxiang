import { describe, expect, it } from 'vitest';
import { hourLabel, watchLabel } from '../src/systems/time-system';

describe('传统时间标签', () => {
  it('把整点和刻转换成可读的时辰', () => {
    expect(hourLabel(0)).toBe('子时初');
    expect(hourLabel(15)).toBe('子时一刻');
    expect(hourLabel(45)).toBe('子时三刻');
  });

  it('只在夜间显示一至五更', () => {
    expect(watchLabel(20 * 60)).toBe('一更');
    expect(watchLabel(22 * 60)).toBe('二更');
    expect(watchLabel(30)).toBe('三更');
    expect(watchLabel(4 * 60)).toBe('五更');
    expect(watchLabel(12 * 60)).toBe('');
  });
});
