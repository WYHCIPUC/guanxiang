import './styles.css';
import { cities, signTexts } from './content/data';
import { seasonalScenes } from './content/seasonal-scenes';
import { moonPhase, phaseForSolarMinute, solarEvents, type SolarEvents } from './systems/astronomy';
import { calendarLabel } from './systems/calendar';
import { formatClock, hourLabel, minutesOfDay, phaseLabel, solarMinute, watchLabel, wrapMinute } from './systems/time-system';

type Mode = 'beijing' | 'solar';

const app = document.querySelector<HTMLDivElement>('#app')!;
const timelineWidth = 2880;
const state = {
  cityId: localStorage.getItem('jinshi-city') ?? 'beijing',
  mode: (localStorage.getItem('jinshi-mode') as Mode | null) ?? 'beijing',
  viewedMinute: 0,
  nowMinute: 0,
};
let lastPhase: string | undefined;

function getCity() {
  return cities.find((city) => city.id === state.cityId) ?? cities[0];
}

function dateText() {
  const now = new Date();
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(now);
}

function countdownLabel(at: Date | null) {
  if (!at) return '节气资料暂不可用';
  const diff = Math.max(0, at.getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return `${days} 日 ${hours} 时`;
}

function viewedDate(minute = state.viewedMinute) {
  const date = new Date();
  const m = wrapMinute(minute);
  date.setHours(Math.floor(m / 60), Math.floor(m % 60), 0, 0);
  return date;
}

function displaySolarEvents(date = new Date()): SolarEvents {
  const city = getCity();
  const events = solarEvents(date, city);
  if (state.mode !== 'solar') return events;
  const correction = solarMinute(date, city) - minutesOfDay(date);
  const shift = (value: number) => wrapMinute(value + correction);
  return { dawn: shift(events.dawn), sunrise: shift(events.sunrise), sunset: shift(events.sunset), dusk: shift(events.dusk) };
}

function currentPhase(minute: number) {
  return phaseForSolarMinute(minute, displaySolarEvents(viewedDate(minute)));
}

function renderShell() {
  app.innerHTML = `
    <main class="app-shell" aria-labelledby="page-title">
      <header class="topbar">
        <div class="brand-lockup">
          <span class="brand-mark" aria-hidden="true">今</span>
          <div>
            <h1 id="page-title">今时 <span>· 中国时间</span></h1>
            <p>把时间从数字里放出来</p>
          </div>
        </div>
        <div class="top-actions">
          <button class="text-button" id="year-button">看一年</button>
          <button class="text-button" id="about-button">关于与来源</button>
          <button class="icon-button" id="settings-button" aria-label="打开设置">☰</button>
        </div>
      </header>

      <section class="hero-copy" aria-live="polite">
        <div>
          <p class="eyebrow" id="phase-label">此刻</p>
          <h2 id="viewed-clock">--:--</h2>
          <p id="viewed-meta">正在读取时间……</p>
        </div>
        <div class="location-pill" id="location-pill">北京 · 北京时间</div>
      </section>

      <section class="scene-wrap" aria-label="24小时中国时间长卷">
        <div class="scene-viewport" id="scene-viewport" tabindex="0">
          <div class="timeline" id="timeline" style="width:${timelineWidth}px">
            <div class="mountain mountain-back" aria-hidden="true"></div>
            <div class="mountain mountain-front" aria-hidden="true"></div>
            <div class="river" aria-hidden="true"></div>
            <div class="sun-or-moon" id="sun-or-moon" aria-hidden="true"></div>
            <div class="tree tree-a" aria-hidden="true">枝</div>
            <div class="tree tree-b" aria-hidden="true">叶</div>
            <div class="flower-bloom" id="flower-bloom" aria-live="polite">花信</div>
            <div class="solar-marker sunrise-marker" id="sunrise-marker"><span>日出</span></div>
            <div class="solar-marker sunset-marker" id="sunset-marker"><span>日落</span></div>
            <div class="now-line" id="now-line"><span>现在</span></div>
            <div class="view-line" id="view-line"><span>你在这里</span></div>
            <div class="hour-markers" id="hour-markers"></div>
          </div>
        </div>
        <div class="scroll-hint" id="scroll-hint">左右拖动，看看时间如何变</div>
      </section>
      <div class="phase-transition" id="phase-transition" role="status" aria-live="polite"></div>

      <section class="controls" aria-label="时间操作">
        <div class="quick-times" id="quick-times">
          <button data-minute="360">日出 <small>06:00</small></button>
          <button data-minute="720">正午 <small>12:00</small></button>
          <button data-minute="1080">日落 <small>18:00</small></button>
          <button data-minute="0">子夜 <small>00:00</small></button>
        </div>
        <div class="primary-actions">
          <button class="secondary-button" id="now-button">回到此刻</button>
          <button class="primary-button" id="sign-button">取签 <span aria-hidden="true">↗</span></button>
        </div>
      </section>

      <footer class="footer-note">
        <span id="solar-note">日影按地点修正</span>
        <span id="next-term-note">声音默认关闭</span>
      </footer>

      <div class="scrim" id="scrim" hidden></div>
      <aside class="drawer" id="settings-drawer" aria-label="设置" aria-hidden="true">
        <div class="drawer-head"><h2>设置</h2><button class="close-button" data-close>×</button></div>
        <label class="field-label" for="city-select">所在城市</label>
        <select id="city-select">${cities.map((city) => `<option value="${city.id}">${city.name}</option>`).join('')}</select>
        <div class="segmented" role="group" aria-label="时间模式">
          <button data-mode="beijing">北京时间</button>
          <button data-mode="solar">真太阳时</button>
        </div>
        <label class="switch-row"><span>减少动画</span><input type="checkbox" id="motion-toggle"><span class="switch-ui"></span></label>
        <label class="switch-row"><span>环境声音（默认关闭）</span><input type="checkbox" id="sound-toggle"><span class="switch-ui"></span></label>
        <button class="text-button reset-button" id="reset-button">恢复默认设置</button>
        <div class="drawer-foot"><button class="text-button" id="source-from-settings">查看数据来源 →</button></div>
      </aside>

      <dialog class="sign-dialog" id="sign-dialog" aria-labelledby="sign-title">
        <div class="sign-card" id="sign-card">
          <button class="close-button dialog-close" aria-label="关闭取签">×</button>
          <p class="sign-kicker">此刻签 · ${dateText()}</p>
          <h2 id="sign-title">正在生成……</h2>
          <p class="sign-time" id="sign-time"></p>
          <div class="sign-rule"></div>
          <p class="sign-quote" id="sign-quote"></p>
          <p class="sign-foot" id="sign-foot"></p>
        </div>
        <div class="dialog-actions">
          <button class="secondary-button" id="copy-sign">复制文字</button>
          <button class="primary-button" id="download-sign">下载卡片</button>
          <button class="text-button" id="save-sign">收下这张签</button>
          <button class="text-button" id="share-sign">系统分享</button>
        </div>
      </dialog>

      <dialog class="year-dialog" id="year-dialog">
        <div class="drawer-head"><h2>一年总览</h2><button class="close-button dialog-close">×</button></div>
        <p class="year-intro">先从一天抬头看一年。这里是季节的总览，不替代精确农历或节气日历。</p>
        <div class="year-grid" id="year-grid"></div>
        <div class="collection-summary" id="collection-summary">已收下 0 张此刻签</div>
      </dialog>

      <dialog class="about-dialog" id="about-dialog">
        <div class="drawer-head"><h2>关于与来源</h2><button class="close-button dialog-close">×</button></div>
        <p>“今时·中国时间”是一条随日期、地点和时间变化的互动长卷。第一版先验证“人在时间里行走”的体验。</p>
        <h3>这里的时间怎么算？</h3>
        <p>北京时间是统一使用的标准时间。真太阳时会根据城市经度和太阳在一年中的视运动做近似修正，适合用来理解时间差异，不作为精密天文测量。</p>
        <h3>内容说明</h3>
        <p>当前版本使用少量人工整理的节气和传统时间资料。花影、颜色与文案是产品化的视觉表达，不代表唯一的历史解释。花信标签目前是场景演绎，接入完整候气资料前不会作为历史事实展示。</p>
        <p class="source-line">算法：公开的太阳时与日出日落近似公式；历法：lunar-javascript（MIT）；字体：优先使用系统字体；素材：项目自绘 SVG。</p>
      </dialog>
    </main>
  `;
}

function setInitialState() {
  const now = new Date();
  state.nowMinute = wrapMinute(state.mode === 'solar' ? solarMinute(now, getCity()) : minutesOfDay(now));
  state.viewedMinute = state.nowMinute;
  const citySelect = document.querySelector<HTMLSelectElement>('#city-select')!;
  citySelect.value = state.cityId;
}

function renderMarkers() {
  const container = document.querySelector<HTMLDivElement>('#hour-markers')!;
  container.innerHTML = Array.from({ length: 25 }, (_, hour) => {
    const left = (hour / 24) * timelineWidth;
    return `<div class="hour-marker" style="left:${left}px"><span>${String(hour % 24).padStart(2, '0')}:00</span></div>`;
  }).join('');
}

function applyScene(minute: number) {
  const events = displaySolarEvents();
  const phase = phaseForSolarMinute(minute, events);
  const scene = seasonalScenes[phase];
  const moon = moonPhase(viewedDate(minute));
  const watch = watchLabel(minute);
  const calendar = calendarLabel(viewedDate(minute));
  if (lastPhase && lastPhase !== phase) {
    const transition = document.querySelector<HTMLDivElement>('#phase-transition');
    if (transition) {
      transition.textContent = `${scene.label} · ${scene.note}`;
      transition.classList.add('visible');
      window.setTimeout(() => transition.classList.remove('visible'), 1100);
    }
  }
  lastPhase = phase;
  document.body.dataset.phase = phase;
  const timeline = document.querySelector<HTMLDivElement>('#timeline')!;
  timeline.dataset.phase = phase;
  const viewLine = document.querySelector<HTMLDivElement>('#view-line')!;
  const viewLeft = (wrapMinute(minute) / 1440) * timelineWidth;
  viewLine.style.left = `${viewLeft}px`;
  const nowLine = document.querySelector<HTMLDivElement>('#now-line')!;
  nowLine.style.left = `${(state.nowMinute / 1440) * timelineWidth}px`;
  document.querySelector('#phase-label')!.textContent = phaseLabel(phase);
  document.querySelector('#viewed-clock')!.textContent = formatClock(minute);
  const city = getCity();
  const modeLabel = state.mode === 'solar' ? '真太阳时' : '北京时间';
  document.querySelector('#location-pill')!.textContent = `${city.name} · ${modeLabel}`;
  const phenologyText = calendar.phenology ? `  ·  候应：${calendar.phenology}` : '';
  document.querySelector('#viewed-meta')!.textContent = `${dateText()}  ·  ${calendar.lunar}  ·  ${calendar.currentTerm}${phenologyText}  ·  ${hourLabel(minute)}  ·  ${phaseLabel(phase)}${watch ? `  ·  ${watch}` : ''}  ·  ${moon.label}`;
  document.querySelector('#solar-note')!.textContent = state.mode === 'solar' ? `已按${city.name}经度修正日影` : '日影按北京时间展示';
  document.querySelector('#next-term-note')!.textContent = calendar.nextAt ? `距${calendar.nextTerm}约 ${countdownLabel(calendar.nextAt)}` : '节气资料暂不可用';
  document.querySelector('#sun-or-moon')!.className = `sun-or-moon ${phase === 'night' ? 'moon' : 'sun'}`;
  const flower = document.querySelector<HTMLDivElement>('#flower-bloom')!;
  flower.textContent = scene.label;
  flower.title = scene.note;
  flower.dataset.phase = phase;
  document.querySelector<HTMLDivElement>('#sunrise-marker')!.style.left = `${(events.sunrise / 1440) * timelineWidth}px`;
  document.querySelector<HTMLDivElement>('#sunset-marker')!.style.left = `${(events.sunset / 1440) * timelineWidth}px`;
}

function scrollToMinute(minute: number, smooth = true) {
  const viewport = document.querySelector<HTMLDivElement>('#scene-viewport')!;
  const maxScroll = Math.max(0, timelineWidth - viewport.clientWidth);
  const target = Math.max(0, Math.min(maxScroll, (wrapMinute(minute) / 1440) * timelineWidth - viewport.clientWidth / 2));
  viewport.scrollTo({ left: target, behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  state.viewedMinute = wrapMinute(minute);
  applyScene(state.viewedMinute);
}

function minuteFromScroll() {
  const viewport = document.querySelector<HTMLDivElement>('#scene-viewport')!;
  const center = viewport.scrollLeft + viewport.clientWidth / 2;
  return wrapMinute((center / timelineWidth) * 1440);
}

function openDialog(dialog: HTMLDialogElement) {
  if (!dialog.open) dialog.showModal();
}

function signText() {
  const index = Math.floor(state.viewedMinute / 360) % signTexts.length;
  return signTexts[index];
}

function savedSigns(): Array<{ time: string; city: string; quote: string; savedAt: string }> {
  try { return JSON.parse(localStorage.getItem('jinshi-signs') ?? '[]'); } catch { return []; }
}

function renderYearOverview() {
  const months = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
  const seasons = ['春 · 萌动', '春 · 花信', '春 · 风暖', '夏 · 初长', '夏 · 日盛', '夏 · 长昼', '秋 · 初凉', '秋 · 天高', '秋 · 露白', '冬 · 风起', '冬 · 日短', '冬 · 藏养'];
  document.querySelector<HTMLDivElement>('#year-grid')!.innerHTML = months.map((month, index) => `<button class="year-cell" data-month="${month}"><strong>${month}</strong><span>${seasons[index]}</span><i></i></button>`).join('');
  document.querySelector<HTMLDivElement>('#collection-summary')!.textContent = `已收下 ${savedSigns().length} 张此刻签`;
  document.querySelectorAll<HTMLButtonElement>('.year-cell').forEach((cell) => cell.addEventListener('click', () => {
    const month = cell.dataset.month ?? '';
    document.querySelector<HTMLDivElement>('#collection-summary')!.textContent = `你正在看${month} · 这是季节的视觉预览`;
  }));
}

function updateSign() {
  const phase = currentPhase(state.viewedMinute);
  document.querySelector('#sign-title')!.textContent = `${hourLabel(state.viewedMinute)} · ${phaseLabel(phase)}`;
  document.querySelector('#sign-time')!.textContent = `${formatClock(state.viewedMinute)}  /  ${getCity().name} · ${state.mode === 'solar' ? '真太阳时' : '北京时间'}`;
  document.querySelector('#sign-quote')!.textContent = `“${signText()}”`;
  document.querySelector('#sign-foot')!.textContent = '今时 · 中国时间  · 视觉表达，非专业天文建议';
}

function copySign() {
  const text = `今时·中国时间\n${formatClock(state.viewedMinute)} · ${hourLabel(state.viewedMinute)} · ${phaseLabel(currentPhase(state.viewedMinute))}\n${signText()}`;
  if (!navigator.clipboard) {
    const button = document.querySelector<HTMLButtonElement>('#copy-sign')!;
    button.textContent = '浏览器不支持复制';
    window.setTimeout(() => (button.textContent = '复制文字'), 1800);
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    const button = document.querySelector<HTMLButtonElement>('#copy-sign')!;
    const original = button.textContent;
    button.textContent = '已复制';
    window.setTimeout(() => (button.textContent = original), 1500);
  }).catch(() => {
    const button = document.querySelector<HTMLButtonElement>('#copy-sign')!;
    button.textContent = '复制失败，请手动选择';
    window.setTimeout(() => (button.textContent = '复制文字'), 1800);
  });
}

function downloadSign() {
  const phase = currentPhase(state.viewedMinute);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#e6ded0"/><text x="90" y="150" font-family="serif" font-size="34" fill="#6d5d51">此刻签 · 今时</text><text x="90" y="360" font-family="serif" font-size="72" fill="#2d2925">${formatClock(state.viewedMinute)}</text><text x="90" y="430" font-family="serif" font-size="34" fill="#6d5d51">${hourLabel(state.viewedMinute)} · ${phaseLabel(phase)}</text><text x="90" y="720" font-family="serif" font-size="42" fill="#2d2925">${signText()}</text><text x="90" y="1220" font-family="sans-serif" font-size="24" fill="#6d5d51">${getCity().name} · ${state.mode === 'solar' ? '真太阳时' : '北京时间'}</text></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jinshi-${formatClock(state.viewedMinute).replace(':', '')}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  const viewport = document.querySelector<HTMLDivElement>('#scene-viewport')!;
  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  viewport.addEventListener('pointerdown', (event) => {
    dragging = true;
    dragStartX = event.clientX;
    dragStartScroll = viewport.scrollLeft;
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    viewport.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  });
  const stopDragging = (event: PointerEvent) => {
    dragging = false;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  };
  viewport.addEventListener('pointerup', stopDragging);
  viewport.addEventListener('pointercancel', stopDragging);
  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); scrollToMinute(state.viewedMinute - 15); }
    if (event.key === 'ArrowRight') { event.preventDefault(); scrollToMinute(state.viewedMinute + 15); }
  });
  viewport.addEventListener('scroll', () => {
    state.viewedMinute = minuteFromScroll();
    applyScene(state.viewedMinute);
  }, { passive: true });

  document.querySelectorAll<HTMLButtonElement>('#quick-times button').forEach((button) => {
    button.addEventListener('click', () => scrollToMinute(Number(button.dataset.minute)));
  });
  document.querySelector<HTMLButtonElement>('#now-button')!.addEventListener('click', () => scrollToMinute(state.nowMinute));
  document.querySelector<HTMLButtonElement>('#sign-button')!.addEventListener('click', () => {
    updateSign();
    openDialog(document.querySelector<HTMLDialogElement>('#sign-dialog')!);
  });
  document.querySelector<HTMLButtonElement>('#download-sign')!.addEventListener('click', downloadSign);
  document.querySelector<HTMLButtonElement>('#copy-sign')!.addEventListener('click', copySign);
  document.querySelector<HTMLButtonElement>('#save-sign')!.addEventListener('click', () => {
    const signs = savedSigns();
    signs.unshift({ time: formatClock(state.viewedMinute), city: getCity().name, quote: signText(), savedAt: new Date().toISOString() });
    localStorage.setItem('jinshi-signs', JSON.stringify(signs.slice(0, 30)));
    const button = document.querySelector<HTMLButtonElement>('#save-sign')!;
    button.textContent = '已收下';
    window.setTimeout(() => (button.textContent = '收下这张签'), 1500);
  });
  document.querySelector<HTMLButtonElement>('#share-sign')!.addEventListener('click', async () => {
    const shareData = { title: '今时·中国时间', text: `${formatClock(state.viewedMinute)} · ${hourLabel(state.viewedMinute)}\n${signText()}` };
    if (navigator.share) await navigator.share(shareData).catch(() => undefined);
    else copySign();
  });
  document.querySelectorAll<HTMLButtonElement>('.dialog-close').forEach((button) => button.addEventListener('click', () => (button.closest('dialog') as HTMLDialogElement)?.close()));

  const scrim = document.querySelector<HTMLDivElement>('#scrim')!;
  const drawer = document.querySelector<HTMLElement>('#settings-drawer')!;
  const closeDrawer = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); scrim.hidden = true; };
  document.querySelector<HTMLButtonElement>('#settings-button')!.addEventListener('click', () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); scrim.hidden = false; });
  scrim.addEventListener('click', closeDrawer);
  drawer.querySelectorAll<HTMLButtonElement>('[data-close]').forEach((button) => button.addEventListener('click', closeDrawer));
  document.querySelector<HTMLSelectElement>('#city-select')!.addEventListener('change', (event) => {
    state.cityId = (event.target as HTMLSelectElement).value;
    localStorage.setItem('jinshi-city', state.cityId);
    const now = new Date();
    state.nowMinute = wrapMinute(state.mode === 'solar' ? solarMinute(now, getCity()) : minutesOfDay(now));
    scrollToMinute(state.viewedMinute, false);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => button.addEventListener('click', () => {
    state.mode = button.dataset.mode as Mode;
    localStorage.setItem('jinshi-mode', state.mode);
    const now = new Date();
    state.nowMinute = wrapMinute(state.mode === 'solar' ? solarMinute(now, getCity()) : minutesOfDay(now));
    document.querySelectorAll('[data-mode]').forEach((item) => item.classList.toggle('active', (item as HTMLElement).dataset.mode === state.mode));
    scrollToMinute(state.viewedMinute, false);
  }));
  document.querySelectorAll('[data-mode]').forEach((item) => item.classList.toggle('active', (item as HTMLElement).dataset.mode === state.mode));
  document.querySelector<HTMLButtonElement>('#reset-button')!.addEventListener('click', () => {
    state.cityId = 'beijing'; state.mode = 'beijing';
    localStorage.removeItem('jinshi-city'); localStorage.removeItem('jinshi-mode');
    document.querySelector<HTMLSelectElement>('#city-select')!.value = state.cityId;
    document.querySelectorAll('[data-mode]').forEach((item) => item.classList.toggle('active', (item as HTMLElement).dataset.mode === state.mode));
    const now = new Date(); state.nowMinute = minutesOfDay(now); scrollToMinute(state.nowMinute, false);
  });
  document.querySelector<HTMLButtonElement>('#about-button')!.addEventListener('click', () => openDialog(document.querySelector<HTMLDialogElement>('#about-dialog')!));
  document.querySelector<HTMLButtonElement>('#year-button')!.addEventListener('click', () => {
    renderYearOverview();
    openDialog(document.querySelector<HTMLDialogElement>('#year-dialog')!);
  });
  document.querySelector<HTMLButtonElement>('#source-from-settings')!.addEventListener('click', () => { closeDrawer(); openDialog(document.querySelector<HTMLDialogElement>('#about-dialog')!); });
  document.querySelector<HTMLInputElement>('#motion-toggle')!.addEventListener('change', (event) => document.body.classList.toggle('reduce-motion', (event.target as HTMLInputElement).checked));
  let audioContext: AudioContext | undefined;
  let ambientOscillator: OscillatorNode | undefined;
  let ambientGain: GainNode | undefined;
  const stopAmbientSound = () => {
    if (!ambientOscillator) return;
    ambientOscillator.stop();
    ambientOscillator.disconnect();
    ambientOscillator = undefined;
    ambientGain?.disconnect();
    ambientGain = undefined;
  };
  document.querySelector<HTMLInputElement>('#sound-toggle')!.addEventListener('change', async (event) => {
    const enabled = (event.target as HTMLInputElement).checked;
    if (!enabled) { stopAmbientSound(); return; }
    audioContext ??= new AudioContext();
    await audioContext.resume();
    ambientOscillator = audioContext.createOscillator();
    ambientGain = audioContext.createGain();
    ambientOscillator.type = 'sine';
    ambientOscillator.frequency.value = currentPhase(state.viewedMinute) === 'night' ? 196 : 262;
    ambientGain.gain.value = 0.018;
    ambientOscillator.connect(ambientGain).connect(audioContext.destination);
    ambientOscillator.start();
  });
}

renderShell();
setInitialState();
renderMarkers();
bindEvents();
applyScene(state.viewedMinute);
requestAnimationFrame(() => scrollToMinute(state.nowMinute, false));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => undefined));
}

window.setInterval(() => {
  const now = new Date();
  state.nowMinute = wrapMinute(state.mode === 'solar' ? solarMinute(now, getCity()) : minutesOfDay(now));
  document.querySelector<HTMLDivElement>('#now-line')!.style.left = `${(state.nowMinute / 1440) * timelineWidth}px`;
}, 10000);
