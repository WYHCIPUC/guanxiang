import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ArrowLeft, ChevronDown, Download, Info, RotateCcw, Sparkles, X } from 'lucide-react'
import { chinaLines, locations, stars, timeLabels, westernLines } from '../data/demo'
import { starfield as hygStars } from '../data/starfield'
import {
  compassLabel,
  findRiseTime,
  formatClock,
  formatDegrees,
  formatHours,
  formatSignedDegrees,
  isRising,
  projectOnDome,
  starHorizontal,
  tonightAt,
  type Horizontal,
} from '../lib/astro'
import { silkGrainDataUri } from '../lib/visuals'
import { downloadMemorial, makeObservation } from '../lib/observation'
import type { Observation, SkyMode, Star } from '../types'

const modeLabels: Record<SkyMode, string> = { china: '中国星官', western: '西方星座', both: '叠合观天' }

type Placement = { x: number; y: number; above: boolean; horizontal: Horizontal }

// 西方模式的星点标签用拜耳编号（ζ Ori），与中国星名一一对应
const bayerOf = (star: Star) => star.modernName.split('·')[1]?.trim() ?? star.modernName

// 测量台靶星位置（台面百分比坐标）与准星初始位
const AIM_TARGET = { x: 50, y: 50 }
const AIM_HOME = { x: 21, y: 28 }

function App() {
  const [mode, setMode] = useState<SkyMode>('china')
  const [selectedStar, setSelectedStar] = useState<Star | null>(null)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [observation, setObservation] = useState<Observation | null>(null)
  const [location, setLocation] = useState('北京')
  const [timeIndex, setTimeIndex] = useState(2)
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('butian-onboarding-seen') !== '1')
  const [showLocation, setShowLocation] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [notice, setNotice] = useState('')
  const [aim, setAim] = useState(AIM_HOME)
  const [aimed, setAimed] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)

  const silkGrain = useMemo(() => silkGrainDataUri(), [])

  useEffect(() => {
    const saved = localStorage.getItem('butian-last-observation')
    if (saved) {
      try { setObservation(JSON.parse(saved) as Observation) } catch { /* ignore invalid local state */ }
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 360)
    return () => window.clearTimeout(timer)
  }, [])

  const timeLabel = timeLabels[timeIndex]
  const site = locations.find((item) => item.name === location) ?? locations[0]
  const moment = useMemo(() => tonightAt(timeLabel), [timeLabel])
  const target = selectedStar ?? stars[0]

  // 星点位置：真实 J2000 坐标 → 地平坐标 → 天穹投影（计算失败时退回静态示意位置）
  const placements = useMemo(() => {
    const map = new Map<string, Placement>()
    for (const star of stars) {
      const horizontal = starHorizontal(star, moment, site.latitude, site.longitude)
      const dome = projectOnDome(horizontal)
      map.set(star.id, {
        x: Number.isFinite(dome.x) ? dome.x : star.x,
        y: Number.isFinite(dome.y) ? dome.y : star.y,
        above: dome.above,
        horizontal,
      })
    }
    return map
  }, [moment, site])

  // 背景星野：HYG 星表（≤5.5 等）按同一套天文计算落位，只画地平线以上的星
  const fieldDots = useMemo(() => {
    const dots: { x: number; y: number; r: number; o: number }[] = []
    for (const [raDeg, decDeg, mag] of hygStars) {
      const horizontal = starHorizontal({ raHours: raDeg / 15, decDegrees: decDeg }, moment, site.latitude, site.longitude)
      if (horizontal.altitude < 0) continue
      const dome = projectOnDome(horizontal)
      if (!Number.isFinite(dome.x) || !Number.isFinite(dome.y)) continue
      const brightness = 5.5 - mag
      dots.push({
        x: dome.x,
        y: dome.y,
        r: Math.min(0.5, 0.14 + brightness * 0.06),
        o: Math.min(0.95, 0.3 + brightness * 0.09),
      })
    }
    return dots
  }, [moment, site])

  // 三种模式各自要画的连线：叠合模式两套同屏，颜色与线型区分
  const lineSets = useMemo(() => {
    const build = (pairs: [string, string][]) => pairs.flatMap(([a, b]) => {
      const first = placements.get(a)
      const second = placements.get(b)
      return first && second ? [{ id: `${a}-${b}`, first, second }] : []
    })
    return { china: build(chinaLines), western: build(westernLines) }
  }, [placements])

  // 标签防叠压：每个星官/星座簇只给最亮的 3 颗常显标签，其余悬停或选中时展开
  const brightLabelIds = useMemo(() => {
    const clusters = new Map<string, Star[]>()
    for (const star of stars) {
      const placement = placements.get(star.id)
      if (!placement?.above) continue
      const key = star.chineseGroup
      clusters.set(key, [...(clusters.get(key) ?? []), star])
    }
    const ids = new Set<string>()
    for (const group of clusters.values()) {
      group.sort((a, b) => a.magnitude - b.magnitude)
      for (const star of group.slice(0, 3)) ids.add(star.id)
    }
    return ids
  }, [placements])

  // 参宿四作为“参宿是否已升”的锚点；未升时给出今夜的升起时刻
  const shenAnchor = stars.find((star) => star.id === 'shen-4') ?? stars[0]
  const shenUp = placements.get(shenAnchor.id)?.above ?? false
  const shenRiseLabel = useMemo(() => {
    if (shenUp) return ''
    const rise = findRiseTime(shenAnchor, tonightAt('19:00'), site.latitude, site.longitude)
    return rise ? formatClock(rise) : '今夜晚些'
  }, [shenUp, shenAnchor, site])

  const panelReadings = useMemo(
    () => makeObservation(target, location, timeLabel, moment, site.latitude, site.longitude),
    [target, location, timeLabel, moment, site],
  )

  const skyNowLine = (star: Star) => {
    const placement = placements.get(star.id)
    if (!placement) return ''
    const { altitude, azimuth } = placement.horizontal
    return placement.above
      ? `此刻地平高度 ${formatDegrees(altitude)} · 方位${compassLabel(azimuth)}`
      : `此刻在地平线下（高度 ${formatDegrees(altitude)}），${isRising(star, moment, site.latitude, site.longitude) ? '即将升起' : '已落下'}`
  }

  const closeOnboarding = () => {
    localStorage.setItem('butian-onboarding-seen', '1')
    setShowOnboarding(false)
  }

  const pickStar = (star: Star) => {
    setSelectedStar(star)
    setShowLocation(false)
  }

  const startMeasuring = (star: Star = target) => {
    setSelectedStar(star)
    setShowLocation(false)
    setAim(AIM_HOME)
    setAimed(false)
    setIsMeasuring(true)
  }

  const commitObservation = () => {
    const next = makeObservation(target, location, timeLabel, moment, site.latitude, site.longitude)
    setObservation(next)
    localStorage.setItem('butian-last-observation', JSON.stringify(next))
    setIsMeasuring(false)
  }

  const resetObservation = () => {
    setObservation(null)
    localStorage.removeItem('butian-last-observation')
  }

  const handleDownload = () => {
    try {
      if (!observation) throw new Error('没有可导出的观测记录')
      downloadMemorial(observation, modeLabels[mode])
      setNotice('奏折已生成，浏览器会开始下载。')
    } catch {
      setNotice('图片生成失败，但观测文字仍保存在本地。')
    }
    window.setTimeout(() => setNotice(''), 2600)
  }

  // 测量台：拖拽或方向键移动准星，距靶星足够近即显示“已瞄准”；磁针始终指向目标
  const [aimAngle, setAimAngle] = useState(0)
  const applyAim = (next: { x: number; y: number }) => {
    const clamped = { x: Math.min(95, Math.max(5, next.x)), y: Math.min(93, Math.max(7, next.y)) }
    setAim(clamped)
    setAimAngle(Math.atan2(AIM_TARGET.x - clamped.x, AIM_TARGET.y - clamped.y) * 180 / Math.PI)
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) { setAimed(false); return }
    const dx = ((clamped.x - AIM_TARGET.x) / 100) * rect.width
    const dy = ((clamped.y - AIM_TARGET.y) / 100) * rect.height
    setAimed(Math.hypot(dx, dy) < 26)
  }
  const onAimPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    if (event.type === 'pointerdown') {
      event.currentTarget.setPointerCapture(event.pointerId)
      applyAim({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 })
      return
    }
    if ((event.buttons & 1) === 1) {
      applyAim({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 })
    }
  }
  const onAimKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 1 : 3
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    applyAim({ x: aim.x + move[0], y: aim.y + move[1] })
  }

  if (!isReady) {
    return <main className="loading-screen"><div className="loading-seal">步</div><p>正在铺开星图</p><small>按今晚的时刻排布星辰</small></main>
  }

  if (!stars.length) {
    return <main className="loading-screen"><div className="loading-seal error-seal">!</div><p>星图暂时不可用</p><small>请刷新页面，或使用静态演示模式。</small></main>
  }

  const edgeClass = (x: number) => (x < 12 ? ' edge-left' : x > 88 ? ' edge-right' : '')

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">步</span>
          <div>
            <p className="eyebrow">今夜观星 · 真实星表排布</p>
            <h1>步天</h1>
          </div>
        </div>
        <div className="topbar-meta">
          <button className="quiet-button" onClick={() => setShowLocation((value) => !value)} aria-expanded={showLocation}>
            {location} · {timeLabel} <ChevronDown size={15} />
          </button>
          {showLocation && (
            <div className="location-popover">
              <p className="popover-title">选择观测地点</p>
              {locations.map((item) => (
                <button key={item.id} className={item.name === location ? 'location-option active' : 'location-option'} onClick={() => { setLocation(item.name); setShowLocation(false) }}>
                  <span>{item.name}</span><small>{item.hint}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <section className="hero-copy">
        <div className="hero-text">
          <p className="hero-kicker"><span className="status-dot" />你正在值守观星台</p>
          <h2>同一片天空，<em>两套名字。</em></h2>
          <p>{shenUp ? '星点已按今晚的时刻与地点排好。先看见星，再选择古人如何称呼它。' : `星点已按今晚的时刻与地点排好。参宿约 ${shenRiseLabel} 升起，先认头顶的北斗。`}</p>
        </div>
        {(() => {
          const dou = placements.get('dou-1')
          return (
            <aside className="hero-brief" aria-label="今夜简报">
              <p className="brief-title">今夜简报</p>
              <p className="brief-row"><small>时刻</small><strong>{timeLabel} · {location}</strong></p>
              <p className="brief-row"><small>参宿</small><strong>{shenUp ? '已升 · 可测' : shenRiseLabel ? `未升 · 约 ${shenRiseLabel}` : '未升'}</strong></p>
              <p className="brief-row"><small>北斗</small><strong>{dou?.above ? `高 ${formatDegrees(dou.horizontal.altitude)}` : '在地平线下'}</strong></p>
            </aside>
          )
        })()}
      </section>

      <section className="observatory-card" aria-label="观星台">
        <div className="sky-toolbar">
          <div>
            <p className="section-label">当前天区</p>
            <strong>{modeLabels[mode]}</strong>
          </div>
          <div className="mode-switcher" role="group" aria-label="切换天空命名方式">
            {(Object.keys(modeLabels) as SkyMode[]).map((key) => (
              <button key={key} className={mode === key ? 'mode-button active' : 'mode-button'} onClick={() => { setMode(key); setShowLocation(false) }}>{modeLabels[key]}</button>
            ))}
          </div>
        </div>

        <div className={selectedStar ? 'sky-stage has-selection' : 'sky-stage'}>
          <div className="silk-grain" style={{ backgroundImage: `url("${silkGrain}")` }} aria-hidden="true" />
          <div className="milky-way" aria-hidden="true" />
          <svg className="constellation-lines" viewBox="0 0 100 100" aria-hidden="true">
            {fieldDots.map((dot, index) => (
              <circle key={index} className="field-star" cx={dot.x} cy={dot.y} r={dot.r} fillOpacity={dot.o} />
            ))}
            <circle cx="50" cy="50" r="47" className="horizon-ring" />
            <text x="50" y="3.4" className="compass-mark">北</text>
            <text x="96.6" y="51.2" className="compass-mark">西</text>
            <text x="50" y="99.2" className="compass-mark">南</text>
            <text x="3.4" y="51.2" className="compass-mark">东</text>
            {(mode === 'western' ? lineSets.western : lineSets.china).map(({ id, first, second }) => (
              <line key={id} x1={first.x} y1={first.y} x2={second.x} y2={second.y} className={mode === 'western' ? 'western-line' : 'china-line'} />
            ))}
            {mode === 'both' && lineSets.western.map(({ id, first, second }) => (
              <line key={`w-${id}`} x1={first.x} y1={first.y} x2={second.x} y2={second.y} className="western-line faint" />
            ))}
          </svg>
          {mode === 'both' && (
            <div className="mode-legend" aria-hidden="true">
              <span className="legend-item legend-china">— 中国星官</span>
              <span className="legend-item legend-western">— 西方星座</span>
            </div>
          )}
          {stars.map((star) => {
            const placement = placements.get(star.id)
            const x = placement?.x ?? star.x
            const y = placement?.y ?? star.y
            const isSelected = selectedStar?.id === star.id
            const isBelow = placement ? !placement.above : false
            return (
              <button
                key={star.id}
                className={isSelected ? 'star-point selected' : isBelow ? 'star-point below-horizon' : 'star-point'}
                style={{ left: `${x}%`, top: `${y}%`, '--star-size': `${Math.max(8, 18 - star.magnitude * 3)}px` } as CSSProperties}
                onClick={() => pickStar(star)}
                aria-label={`查看${star.name}${isBelow ? '，此刻在地平线下' : ''}`}
              >
                <span className="star-core" />
                {!isBelow && mode !== 'both' && (
                  <span className={`star-label${edgeClass(x)}${brightLabelIds.has(star.id) || isSelected ? '' : ' hint'}`}>{mode === 'western' ? bayerOf(star) : star.name}</span>
                )}
                {!isBelow && mode === 'both' && (
                  <>
                    <span className={`star-label-west${edgeClass(x)}${brightLabelIds.has(star.id) || isSelected ? '' : ' hint'}`}>{bayerOf(star)}</span>
                    <span className={`star-label${edgeClass(x)}${brightLabelIds.has(star.id) || isSelected ? '' : ' hint'}`}>{star.name}</span>
                  </>
                )}
              </button>
            )
          })}
          <div className="sky-caption">天穹俯视 · 北在上东在左 · 暗星为未升之星 · 星位实时计算（J2000，教学精度）· 背景星野 {hygStars.length.toLocaleString()} 颗（HYG ≤5.5 等）</div>
        </div>

        <div className="time-control">
          <div className="time-heading"><span>夜行时间</span><strong>{timeLabel}</strong></div>
          <input aria-label="调整教学时间" type="range" min="0" max={timeLabels.length - 1} step="1" value={timeIndex} onChange={(event) => setTimeIndex(Number(event.target.value))} />
          <div className="time-scale"><span>黄昏</span><span>深夜</span><span>凌晨</span></div>
        </div>

        <div className="observatory-actions">
          <button className="secondary-button" onClick={() => pickStar(target)}><Info size={17} />查看星官</button>
          <button className="primary-button" onClick={() => startMeasuring()}><Sparkles size={18} />测一测 {target.name}</button>
        </div>
      </section>

      <section className="insight-strip">
        <div className="insight-icon">镜</div>
        <div>
          <strong>铜镜提示</strong>
          <p>{shenUp ? '切换“西方星座”，看看参宿如何变成猎户座。' : `参宿约 ${shenRiseLabel} 升起；先看低垂的北斗——切到“西方星座”，它就是大熊座。`}</p>
        </div>
        <button className="text-button" onClick={() => setMode(mode === 'china' ? 'western' : mode === 'western' ? 'both' : 'china')}>翻转天空 <RotateCcw size={15} /></button>
      </section>

      {selectedStar && !isMeasuring && !observation && (
        <aside className="info-card" aria-live="polite">
          <button className="icon-button close-card" onClick={() => setSelectedStar(null)} aria-label="关闭星官信息"><X size={18} /></button>
          <p className="card-eyebrow">{selectedStar.chineseGroup} · {selectedStar.westernGroup}</p>
          <h3>{selectedStar.name}</h3>
          <p className="modern-name">{bayerOf(selectedStar)} · 赤经 {formatHours(selectedStar.raHours)} · 赤纬 {formatSignedDegrees(selectedStar.decDegrees)}</p>
          <p className="sky-now">{skyNowLine(selectedStar)}</p>
          <p>{selectedStar.chineseNote}</p>
          <div className="card-source">读数按 J2000 星表实时换算 · 宿距星表为手工整理近似值</div>
          <button className="card-cta" onClick={() => startMeasuring(selectedStar)}>选它来测量</button>
        </aside>
      )}

      {observation && !isMeasuring && (
        <aside className="record-card" aria-live="polite">
          <div className="record-card-top"><div><p className="card-eyebrow">最近一次观测</p><h3>{observation.star.name}</h3></div><button className="icon-button" onClick={resetObservation} aria-label="清除最近记录"><X size={18} /></button></div>
          <p className="modern-name">{observation.location} · {observation.timeLabel} · {observation.altitudeNote}</p>
          <div className="mini-reading"><span>{observation.ru}</span><span>{observation.ju}</span></div>
          <span className="record-seal" aria-hidden="true">步天</span>
          <button className="card-cta" onClick={handleDownload}><Download size={16} />下载奏折</button>
          <button className="link-button" onClick={() => startMeasuring(observation.star)}>重新测量</button>
        </aside>
      )}

      {isMeasuring && (
        <div className="modal-backdrop" role="presentation">
          <section className="measure-panel" role="dialog" aria-modal="true" aria-labelledby="measure-title">
            <div className="panel-header"><div><p className="card-eyebrow">第二步 · 测天</p><h2 id="measure-title">把准星放在{target.name}上</h2></div><button className="icon-button" onClick={() => setIsMeasuring(false)} aria-label="关闭测量"><X size={19} /></button></div>
            <div
              className={aimed ? 'instrument-stage aimed' : 'instrument-stage'}
              ref={stageRef}
              onPointerDown={onAimPointer}
              onPointerMove={onAimPointer}
              onKeyDown={onAimKey}
              tabIndex={0}
              role="application"
              aria-label={`测量台：拖动准星瞄准${target.name}，或聚焦后用方向键微调`}
            >
              <div className="silk-grain" style={{ backgroundImage: `url("${silkGrain}")` }} aria-hidden="true" />
              <div className="instrument-ring outer" /><div className="instrument-ring inner" />
              <span className="ring-tag ring-tag-outer" aria-hidden="true">去极度环</span>
              <span className="ring-tag ring-tag-inner" aria-hidden="true">入宿度环</span>
              <div className="aim-needle" style={{ transform: `rotate(${aimAngle}deg)` }} aria-hidden="true" />
              <div className="aim-star" style={{ left: `${AIM_TARGET.x}%`, top: `${AIM_TARGET.y}%` }} aria-hidden="true">
                <span className="aim-star-core" />
                <span className="aim-star-label">{target.name}</span>
              </div>
              <div className="crosshair" style={{ left: `${aimed ? AIM_TARGET.x : aim.x}%`, top: `${aimed ? AIM_TARGET.y : aim.y}%` }} aria-hidden="true"><span /><span /></div>
              <p className="aim-note" aria-live="polite">{aimed ? `已瞄准 · ${target.name}` : '拖动准星套住亮星 · 也可聚焦后用方向键微调'}</p>
            </div>
            <div className="measure-copy">
              <p>古人用浑仪量出的两个数——入宿度与去极度——描述同一颗星；右侧现代坐标说的是同一件事。{panelReadings.altitudeNote}。</p>
              <div className={aimed ? 'reading-grid' : 'reading-grid pending'}>
                <div><small>入宿度（古）</small><strong>{panelReadings.ru}</strong></div>
                <div><small>去极度（古）</small><strong>{panelReadings.ju}</strong></div>
                <div><small>赤经（今）</small><strong>{panelReadings.ra}</strong></div>
                <div><small>赤纬（今）</small><strong>{panelReadings.dec}</strong></div>
              </div>
              <p className="precision-note">{aimed ? '真实换算 · J2000 历元，未含岁差与大气折射修正；宿距星赤经为近似整理值' : '瞄准目标星后点亮读数 · J2000 历元教学换算'}</p>
            </div>
            <div className="panel-actions"><button className="secondary-button" onClick={() => setIsMeasuring(false)}>先不记录</button><button className="primary-button" onClick={commitObservation}>记入奏折 <Download size={16} /></button></div>
          </section>
        </div>
      )}

      {showOnboarding && (
        <div className="modal-backdrop onboarding-backdrop">
          <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
            <div className="onboarding-seal">步天</div>
            <p className="card-eyebrow">欢迎来到观星台</p>
            <h2 id="welcome-title">今夜，你值守一片有两套名字的天空。</h2>
            <p>星点已按今晚的时刻与地点排布。点击铜镜切换命名方式，点一颗星查看星官，再用简化浑仪完成一次真实换算的测量。</p>
            <div className="onboarding-steps"><span><b>01</b>看星</span><span><b>02</b>翻转</span><span><b>03</b>测量</span><span><b>04</b>记天</span></div>
            <button className="primary-button full-width" onClick={closeOnboarding}>开始观星 <ArrowLeft size={17} className="rotate-180" /></button>
            <small>原型范围：参宿—猎户与北斗—大熊 · 真实 J2000 星表坐标</small>
          </section>
        </div>
      )}

      {notice && <div className="toast" role="status">{notice}</div>}

      <footer className="footer-note"><span>步天 · 最小可运行原型</span><span>星位真实计算 · 读数为教学精度</span></footer>
    </main>
  )
}

export default App
