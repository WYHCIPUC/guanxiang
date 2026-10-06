export type PhenologyEntry = { term: string; candidates: [string, string, string]; source: string; certainty: 'traditional-list' };

// Traditional names from the received 72候 lists. They are displayed as
// historical候应 labels; the project does not claim they describe every region's
// present-day ecology.
export const phenology: PhenologyEntry[] = [
  { term: '立春', candidates: ['东风解冻', '蛰虫始振', '鱼陟负冰'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '雨水', candidates: ['獭祭鱼', '鸿雁来', '草木萌动'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '惊蛰', candidates: ['桃始华', '仓庚鸣', '鹰化为鸠'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '春分', candidates: ['玄鸟至', '雷乃发声', '始电'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '清明', candidates: ['桐始华', '田鼠化为鴽', '虹始见'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '谷雨', candidates: ['萍始生', '鸣鸠拂其羽', '戴胜降于桑'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '立夏', candidates: ['蝼蝈鸣', '蚯蚓出', '王瓜生'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '小满', candidates: ['苦菜秀', '靡草死', '麦秋至'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '芒种', candidates: ['螳螂生', '鵙始鸣', '反舌无声'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '夏至', candidates: ['鹿角解', '蜩始鸣', '半夏生'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '小暑', candidates: ['温风至', '蟋蟀居宇', '鹰始鸷'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '大暑', candidates: ['腐草为萤', '土润溽暑', '大雨时行'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '立秋', candidates: ['凉风至', '白露降', '寒蝉鸣'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '处暑', candidates: ['鹰乃祭鸟', '天地始肃', '禾乃登'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '白露', candidates: ['鸿雁来', '玄鸟归', '群鸟养羞'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '秋分', candidates: ['雷始收声', '蛰虫坯户', '水始涸'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '寒露', candidates: ['鸿雁来宾', '雀入大水为蛤', '菊有黄华'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '霜降', candidates: ['豺乃祭兽', '草木黄落', '蛰虫咸俯'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '立冬', candidates: ['水始冰', '地始冻', '雉入大水为蜃'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '小雪', candidates: ['虹藏不见', '天气上升地气下降', '闭塞而成冬'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '大雪', candidates: ['鹖鴠不鸣', '虎始交', '荔挺出'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '冬至', candidates: ['蚯蚓结', '麋角解', '水泉动'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '小寒', candidates: ['雁北乡', '鹊始巢', '雉始雊'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
  { term: '大寒', candidates: ['鸡乳', '征鸟厉疾', '水泽腹坚'], source: '《逸周书·时训解》与《月令七十二候集解》传统列表', certainty: 'traditional-list' },
];

export function phenologyFor(term: string, start: Date | null, date: Date) {
  const entry = phenology.find((item) => item.term === term);
  if (!entry || !start) return null;
  const days = Math.max(0, Math.floor((date.getTime() - start.getTime()) / 86400000));
  return entry.candidates[Math.min(2, Math.floor(days / 5))];
}
