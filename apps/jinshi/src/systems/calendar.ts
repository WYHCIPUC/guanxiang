import { Solar } from 'lunar-javascript';
import { phenologyFor } from '../content/phenology';

const TERM_NAMES = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'];

function parseLocalDate(value: string) {
  return new Date(value.replace(' ', 'T'));
}

export type CalendarLabel = { lunar: string; currentTerm: string; nextTerm: string; nextAt: Date | null; currentTermAt: Date | null; phenology: string | null };

export function calendarLabel(date: Date): CalendarLabel {
  try {
    const lunar = Solar.fromDate(date).getLunar();
    const table = lunar.getJieQiTable();
    const terms = TERM_NAMES.map((name) => ({ name, at: parseLocalDate(table[name].toYmdHms()) })).sort((a, b) => a.at.getTime() - b.at.getTime());
    const previousTerms = terms.filter((item) => item.at.getTime() <= date.getTime());
    const previous = previousTerms[previousTerms.length - 1] ?? terms[0];
    const next = terms.find((item) => item.at.getTime() > date.getTime()) ?? terms[0];
    return { lunar: lunar.toString(), currentTerm: previous.name, nextTerm: next.name, nextAt: next.at, currentTermAt: previous.at, phenology: phenologyFor(previous.name, previous.at, date) };
  } catch {
    return { lunar: '农历资料暂不可用', currentTerm: '节气资料暂不可用', nextTerm: '', nextAt: null, currentTermAt: null, phenology: null };
  }
}
