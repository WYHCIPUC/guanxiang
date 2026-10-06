declare module 'lunar-javascript' {
  type JieQiSolar = { toYmdHms(): string };
  type JieQiTable = Record<string, JieQiSolar>;
  type LunarDate = {
    toString(): string;
    getJieQiTable(): JieQiTable;
  };
  type SolarDate = { getLunar(): LunarDate };
  export const Solar: { fromDate(date: Date): SolarDate };
}
