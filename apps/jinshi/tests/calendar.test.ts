import { describe, expect, it } from 'vitest';
import { calendarLabel } from '../src/systems/calendar';

describe('农历与节气数据', () => {
  it('可以解析当前节气、下一节气和农历日期', () => {
    const label = calendarLabel(new Date(2026, 9, 3, 12));
    expect(label.lunar).toContain('年');
    expect(label.currentTerm).toBeTruthy();
    expect(label.nextTerm).toBeTruthy();
    expect(label.nextAt).toBeInstanceOf(Date);
    expect(label.phenology).toBeTruthy();
  });
});
