import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ArrowLeft, ChevronDown, Download, Info, RotateCcw, Sparkles, X } from 'lucide-react'
import { chinaLines, locations, stars, timeLabels, westernLines } from '../data/demo'
import { starfield as hygStars } from '../data/starfield'
import { westernSkyGroups } from '../data/western-sky'
import {
  compassLabel,
  DEG,
  findRiseTime,
  formatClock,
  formatDegrees,
  formatHours,
  formatSignedDegrees,
  isRising,
  lodges,
  projectOnDome,
  starHorizontal,
  tonightAt,
  type Horizontal,
} from '../lib/astro'
import { silkGrainDataUri } from '../lib/visuals'
import { downloadMemorial, makeObservation } from '../lib/observation'
import { guestStarCoord, guestStarRecord, kaifeng, theaterScenes } from '../lib/kestar'
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
  /** 客星剧场：非 null 时天穹切换到 SN1054 场景（下标入 theaterScenes） */
  const [theaterScene, setTheaterScene] = useState<number | null>(null)
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
  const inTheater = theaterScene !== null
  const site = inTheater ? kaifeng : (locations.find((item) => item.name === location) ?? locations[0])
  const moment = useMemo(
    () => (inTheater ? new Date(theaterScenes[theaterScene].utc) : tonightAt(timeLabel)),
    [timeLabel, theaterScene],
  )

  // 客星此刻位置（剧场内）：与所有星点走同一套天文计算
  const guestPlacement = useMemo(() => {
    if (theaterScene === null) return null
    const scene = theaterScenes[theaterScene]
    const horizontal = starHorizontal(guestStarCoord, moment, kaifeng.latitude, kaifeng.longitude)
    const dome = projectOnDome(horizontal)
    return { scene, horizontal, dome }
  }, [theaterScene, moment])

  const guestReadings = useMemo(
    () => (guestPlacement ? makeObservation(guestStarRecord, kaifeng.name, guestPlacement.scene.label, moment, kaifeng.latitude, kaifeng.longitude) : null),
    [guestPlacement, moment],
  )

  // 窄屏判定：标签避让的间距策略随画布宽高比切换
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    const onChange = (event: MediaQueryListEvent) => setIsNarrow(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

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

  // 主 CTA 与测量默认指向：优先选一颗已升起的星，避免“测一颗图上找不到的星”
  const firstAboveStar = stars.find((star) => placements.get(star.id)?.above) ?? stars[0]
  const target = selectedStar ?? firstAboveStar

  // 背景星野：HYG 星表（≤5.5 等）按同一套天文计算落位，只画地平线以上的星
  const fieldDots = useMemo(() => {
    const dots: { x: number; y: number; r: number; o: number }[] = []
    for (const [raDeg, decDeg, mag] of hygStars) {
      const horizontal = starHorizontal({ raHours: raDeg / 15, decDegrees: decDeg }, moment, site.latitude, site.longitude)
      if (horizontal.altitude < 0) continue
      const dome = projectOnDome(horizontal)
      if (!Number.isFinite(dome.x) || !Number.isFinite(dome.y)) continue
      if (dome.x < 3 || dome.x > 97 || dome.y > 97) continue // 贴地平线的星点会被容器裁切成残影
      const brightness = 5.5 - mag
      dots.push({
        x: dome.x,
        y: dome.y,
        r: Math.min(0.5, 0.12 + brightness * 0.06),
        o: Math.min(0.95, 0.22 + brightness * 0.09),
      })
    }
    return dots
  }, [moment, site])

  // 二十八宿宿度环：每宿距星此刻的方位落在地平圈外环上，随时间缓缓转动；
  // 已升之宿亮显，未升之宿暗显——古人以二十八宿度量周天，这圈就是那把"天尺"
  const lodgeRing = useMemo(() => {
    return lodges.map((lodge) => {
      const horizontal = starHorizontal({ raHours: lodge.raHours, decDegrees: lodge.decDegrees }, moment, site.latitude, site.longitude)
      const az = horizontal.azimuth * DEG
      const sinA = Math.sin(az)
      const cosA = Math.cos(az)
      return {
        key: lodge.name,
        name: lodge.name,
        above: horizontal.altitude >= 0,
        tick: { x1: 50 - 47.3 * sinA, y1: 50 - 47.3 * cosA, x2: 50 - 47.9 * sinA, y2: 50 - 47.9 * cosA },
        label: { x: 50 - 48.2 * sinA, y: 50 - 48.2 * cosA },
      }
    })
  }, [moment, site])

  // 88 西方星座连线（d3-celestial 数据）：端点经同一套天文计算落位，两端都在地平线上才画
  const skyWestern = useMemo(() => {
    const segments: { key: string; x1: number; y1: number; x2: number; y2: number }[] = []
    for (const group of westernSkyGroups) {
      group.segments.forEach(([ra1, dec1, ra2, dec2], index) => {
        const h1 = starHorizontal({ raHours: ra1 / 15, decDegrees: dec1 }, moment, site.latitude, site.longitude)
        const h2 = starHorizontal({ raHours: ra2 / 15, decDegrees: dec2 }, moment, site.latitude, site.longitude)
        if (h1.altitude < 0 || h2.altitude < 0) return
        const p1 = projectOnDome(h1)
        const p2 = projectOnDome(h2)
        if (!Number.isFinite(p1.x) || !Number.isFinite(p2.x)) return
        segments.push({ key: `${group.id}-${index}`, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
      })
    }
    return segments
  }, [moment, site])

  // 三种模式各自要画的连线：只在两端星都升起时绘制，避免地平线下出现孤儿线段
  const lineSets = useMemo(() => {
    const build = (pairs: [string, string][]) => pairs.flatMap(([a, b]) => {
      const first = placements.get(a)
      const second = placements.get(b)
      return first && second && first.above && second.above ? [{ id: `${a}-${b}`, first, second }] : []
    })
    return { china: build(chinaLines), western: build(westernLines) }
  }, [placements])

  // 标签排布引擎：按"著名亮星/北斗 → 亮度"优先级逐颗安放。
  // 候选位：星点下方；被占则试侧挂；再被占则降为悬停展开。
  // 碰撞按标签盒逐轴判定；多成员宿群（≥4 颗升起）只安放距星（首位成员）锚点，其余降为悬停展开，
  // 避免"奎娄壁室"一带的签注雪崩。
  const PRIORITY_STAR_IDS = new Set(['zhi-1', 'tian-4', 'he-2', 'gou-1', 'wu-2', 'bi-5', 'bei-3', 'dou-1', 'dou-2', 'dou-3', 'dou-4', 'dou-5', 'dou-6', 'dou-7'])
  type LabelSpot = 'below' | 'side' | 'hint'
  const labelPlan = useMemo(() => {
    const plan = new Map<string, LabelSpot>()
    const anchorHidden = new Map<string, number>()
    const visible = stars.filter((star) => placements.get(star.id)?.above)
    // 叠合模式的双行芯片高度约为单行标签两倍，碰撞盒同步放大，否则必然互压
    const isBoth = mode === 'both'
    const boxW = isNarrow ? 15 : isBoth ? 5.6 : 4.8
    const boxH = isNarrow ? (isBoth ? 9.5 : 4.8) : isBoth ? 6.6 : 3.2
    // 宿群锚点：同组升起成员 ≥4 时只保留组内第一颗（距星）参与排布，其余降为悬停展开并计入"+N"
    // 宿度环已挂牌二十八宿宿名：普通宿无论升起几颗都整组降为悬停（哨兵 ''），避免"奎娄壁室"一带的标签串珠
    const groupCounts = new Map<string, number>()
    for (const star of visible) groupCounts.set(star.chineseGroup, (groupCounts.get(star.chineseGroup) ?? 0) + 1)
    const bigGroups = new Map<string, string>() // 组名 → 距星 id（源序首位）；'' 表示整组悬停、无锚
    for (const star of stars) {
      if (!visible.includes(star)) continue
      if (star.chineseGroup.endsWith('宿') && star.chineseGroup !== '参宿') {
        if (!bigGroups.has(star.chineseGroup)) bigGroups.set(star.chineseGroup, '')
        continue
      }
      if ((groupCounts.get(star.chineseGroup) ?? 0) >= 4 && !bigGroups.has(star.chineseGroup) && !PRIORITY_STAR_IDS.has(star.id)) {
        bigGroups.set(star.chineseGroup, star.id)
      }
    }
    const placed: { x: number; y: number }[] = []
    const hits = (p: { x: number; y: number }, w: number) => placed.some((q) => Math.abs(p.x - q.x) < w && Math.abs(p.y - q.y) < boxH)
    // 窄屏（移动端）寸土寸金：仅著名亮星挂牌，三垣各留第一颗升起的锚星，其余一律悬停展开
    const narrowCandidates = isNarrow ? new Set(PRIORITY_STAR_IDS) : null
    if (narrowCandidates) {
      for (const group of ['紫微垣', '太微垣', '天市垣']) {
        const first = visible.find((s) => s.chineseGroup === group)
        if (first) narrowCandidates.add(first.id)
      }
    }
    for (const star of [...visible].sort((a, b) => (Number(PRIORITY_STAR_IDS.has(b.id)) - Number(PRIORITY_STAR_IDS.has(a.id))) || (a.magnitude - b.magnitude))) {
      const anchor = bigGroups.get(star.chineseGroup)
      // 优先亮星（如毕宿五）不受组规约束；普通宿整组悬停、不写"+N"尾注
      if (anchor !== undefined && anchor !== star.id && !PRIORITY_STAR_IDS.has(star.id)) {
        plan.set(star.id, 'hint')
        if (anchor) anchorHidden.set(anchor, (anchorHidden.get(anchor) ?? 0) + 1)
        continue
      }
      if (narrowCandidates && !narrowCandidates.has(star.id)) {
        plan.set(star.id, 'hint')
        continue
      }
      const p = placements.get(star.id)!
      const w = boxW + (anchorHidden.has(star.id) ? 2.4 : 0)
      const below = { x: p.x, y: p.y + (isBoth ? (isNarrow ? 4.6 : 3.6) : isNarrow ? 3.2 : 2.9) }
      // 右缘标签向左挂，避免被视口裁切（移动端阈值更宽）
      const sideLeft = p.x > (isNarrow ? 76 : 80)
      const side = { x: p.x + (sideLeft ? -(w / 2 + 2.2) : w / 2 + 2.2), y: p.y }
      if (!hits(below, w)) { placed.push(below); plan.set(star.id, 'below') }
      else if (!hits(side, w)) { placed.push(side); plan.set(star.id, 'side') }
      else plan.set(star.id, 'hint')
    }
    return { plan, anchorHidden }
  }, [placements, isNarrow, mode])

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

  const isTargetBelow = !(placements.get(target.id)?.above ?? true)

  return (
    <main className={(selectedStar && !isMeasuring) || (observation && !isMeasuring) ? 'app-shell has-dock' : 'app-shell'}>
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
          <p>{shenUp ? '星点已按今晚的时刻与地点排好。先看见星，再选择古人如何称呼它。' : `星点已按今晚的时刻与地点排好。参宿约 ${shenRiseLabel} 升起，先认北天的北斗。`}</p>
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

        <div className={`sky-stage${selectedStar ? ' has-selection' : ''}${guestPlacement?.scene.daytime ? ' daytime' : ''}`}>
          <div className="silk-grain" style={{ backgroundImage: `url("${silkGrain}")` }} aria-hidden="true" />
          <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {fieldDots.map((dot, index) => (
              <circle key={index} className="field-star" cx={dot.x} cy={dot.y} r={dot.r} fillOpacity={dot.o} />
            ))}
            <circle cx="50" cy="50" r="47" className="horizon-ring" />
            <circle cx="50" cy="50" r="49.4" className="lodge-ring" aria-hidden="true" />
            {lodgeRing.map((mark) => (
              <g key={mark.key} className={mark.above ? 'lodge-mark' : 'lodge-mark below'}>
                <line x1={mark.tick.x1} y1={mark.tick.y1} x2={mark.tick.x2} y2={mark.tick.y2} className="lodge-tick" />
                <text x={mark.label.x} y={mark.label.y + 0.7} className="lodge-name">{mark.name}</text>
              </g>
            ))}
            <text x="50" y="8.6" className="compass-mark">北</text>
            <text x="94" y="51.2" className="compass-mark">西</text>
            <text x="71" y="92" className="compass-mark">南</text>
            <text x="6" y="51.2" className="compass-mark">东</text>
            {mode !== 'china' && skyWestern.map((segment) => (
              <line key={segment.key} x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} className={mode === 'both' ? 'western-sky-line faint' : 'western-sky-line'} />
            ))}
            {(mode === 'western' ? lineSets.western : lineSets.china).map(({ id, first, second }) => (
              <line key={id} x1={first.x} y1={first.y} x2={second.x} y2={second.y} className={mode === 'western' ? 'western-line' : 'china-line'} />
            ))}
            {mode === 'both' && lineSets.western.map(({ id, first, second }) => (
              <line key={`w-${id}`} x1={first.x} y1={first.y} x2={second.x} y2={second.y} className="western-line faint" />
            ))}
          </svg>
          {mode === 'both' && (
            <div className="mode-legend" aria-hidden="true">
              <span className="legend-item legend-china"><i className="legend-line line-china" />中国星官</span>
              <span className="legend-item legend-western"><i className="legend-line line-western" />西方星座 · 部分连线</span>
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
                  <span className={`star-label${labelPlan.plan.get(star.id) === 'side' ? ' side' : ''}${edgeClass(x)}${(labelPlan.plan.get(star.id) ?? 'hint') !== 'hint' || isSelected ? '' : ' hint'}`}>
                    {mode === 'western' ? bayerOf(star) : star.name}{labelPlan.anchorHidden.get(star.id) ? ` 等${(labelPlan.anchorHidden.get(star.id) ?? 0) + 1}星` : ''}
                  </span>
                )}
                {!isBelow && mode === 'both' && (
                  <span className={`star-label-duo${labelPlan.plan.get(star.id) === 'side' ? ' side' : ''}${edgeClass(x)}${(labelPlan.plan.get(star.id) ?? 'hint') !== 'hint' || isSelected ? '' : ' hint'}`}>
                    <b>{star.name}{labelPlan.anchorHidden.get(star.id) ? ` 等${(labelPlan.anchorHidden.get(star.id) ?? 0) + 1}星` : ''}</b>
                    <i>{bayerOf(star)}</i>
                  </span>
                )}
              </button>
            )
          })}
          {guestPlacement && (
            <div
              className={guestPlacement.scene.visible ? 'guest-star' : 'guest-star faded'}
              style={{ left: `${guestPlacement.dome.x}%`, top: `${guestPlacement.dome.y}%` }}
              aria-hidden="true"
            >
              <span className="guest-core" />
              <span className="guest-label">{guestPlacement.scene.visible ? '天关客星' : '客星已没'}</span>
            </div>
          )}
        </div>

        <div className="observatory-actions">
          <button className="secondary-button" onClick={() => pickStar(target)}><Info size={17} />{mode === 'western' ? '查看此星' : '查看星官'}</button>
          <button className={selectedStar && !observation ? 'primary-button ghost' : 'primary-button'} onClick={() => startMeasuring()}><Sparkles size={18} />{selectedStar ? `测一测 ${target.name}` : '测一测'}</button>
        </div>

        {!inTheater && (
          <div className="time-control">
            <div className="time-heading"><span>夜行时间</span><strong>{timeLabel}</strong></div>
            <input aria-label="调整教学时间" type="range" min="0" max={timeLabels.length - 1} step="1" value={timeIndex} onChange={(event) => setTimeIndex(Number(event.target.value))} />
            <div className="time-scale"><span>黄昏</span><span>深夜</span><span>凌晨</span></div>
            <p className="sky-caption">天穹俯视 · 北在上东在左 · 外环为二十八宿宿度环 · 暗者为未升<span className="caption-extra"> · 星位实时计算（J2000，教学精度）· 背景星野 {hygStars.length.toLocaleString()} 颗（HYG ≤5.5 等）</span></p>
          </div>
        )}
        {inTheater && (
          <div className="time-control">
            <div className="time-heading"><span>剧场时刻</span><strong>{guestPlacement?.scene.label} · {guestPlacement?.scene.title.split('·').pop()?.trim()}</strong></div>
            <p className="sky-caption">客星剧场 · 汴京 · {guestPlacement ? `客星此刻${guestPlacement.horizontal.altitude >= 0 ? `高 ${formatDegrees(guestPlacement.horizontal.altitude)} · ${compassLabel(guestPlacement.horizontal.azimuth)}方` : '在地平线下'}` : ''}<span className="caption-extra"> · 教学示意：绝对方位按 J2000 近似</span></p>
          </div>
        )}
      </section>

      <section className="insight-strip">
        <div className="insight-icon">镜</div>
        <div>
          <strong>铜镜提示</strong>
          <p>{mode === 'western'
            ? '此刻图上是拜耳名。点一颗星看看：西方的 Dubhe，就是中国的天枢——同一颗星，两套名字。'
            : mode === 'both'
              ? '贴在一起的两行名就是同一颗星：天枢 ／ α UMa（Dubhe）。找出属于你的一对。'
              : shenUp
                ? '切换「西方星座」，看看参宿如何变成猎户座。'
                : `参宿约 ${shenRiseLabel} 升起；先看低垂的北斗——切到「西方星座」，它就是大熊座。`}</p>
        </div>
        <button className="text-button theater-entry" onClick={() => { setTheaterScene(0); setShowLocation(false) }}>客星剧场 ✦</button>
        <button className="text-button" onClick={() => setMode(mode === 'china' ? 'western' : mode === 'western' ? 'both' : 'china')}>翻转天空 <RotateCcw size={15} /></button>
      </section>

      {selectedStar && !isMeasuring && !observation && (
        <aside className="info-card" aria-live="polite">
          <button className="icon-button close-card" onClick={() => setSelectedStar(null)} aria-label="关闭星官信息"><X size={18} /></button>
          <p className="card-eyebrow">{selectedStar.chineseGroup} · {selectedStar.westernGroup}</p>
          <h3>{selectedStar.name}</h3>
          <p className="modern-name">{bayerOf(selectedStar)}{selectedStar.commonName ? ` · ${selectedStar.commonName}` : ''} · 赤经 {formatHours(selectedStar.raHours)} · 赤纬 {formatSignedDegrees(selectedStar.decDegrees)}</p>
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
          <div className="mini-reading">
            <span className="mini-cell"><small>入宿度</small><b>{observation.ru}</b></span>
            <span className="mini-cell"><small>去极度</small><b>{observation.ju.replace(/^去极\s*/, '')}</b></span>
          </div>
          <span className="record-seal" aria-hidden="true">步天</span>
          <button className="card-cta" onClick={handleDownload}><Download size={16} />下载奏折</button>
          <button className="link-button" onClick={() => startMeasuring(observation.star)}>重新测量</button>
        </aside>
      )}

      {guestPlacement && guestReadings && (
        <aside className="theater-card" aria-live="polite">
          <div className="record-card-top">
            <div><p className="card-eyebrow">客星剧场 · {kaifeng.name}</p><h3>天关客星</h3></div>
            <button className="icon-button" onClick={() => setTheaterScene(null)} aria-label="回到今夜"><X size={18} /></button>
          </div>
          <p className="modern-name">{guestPlacement.scene.title}</p>
          <div className="theater-scene-switch" role="group" aria-label="切换客星场景">
            {theaterScenes.map((scene, index) => (
              <button key={scene.id} className={theaterScene === index ? 'scene-button active' : 'scene-button'} onClick={() => setTheaterScene(index)}>{scene.label}</button>
            ))}
          </div>
          <blockquote className="theater-quote">「{guestPlacement.scene.quote}」<footer>{guestPlacement.scene.source}</footer></blockquote>
          <p className="theater-note">{guestPlacement.scene.note}</p>
          <div className="mini-reading">
            <span className="mini-cell"><small>入宿度</small><b>{guestReadings.ru}</b></span>
            <span className="mini-cell"><small>去极度</small><b>{guestReadings.ju.replace(/^去极\s*/, '')}</b></span>
          </div>
          <div className="card-source">天穹为 1054 年汴京星空 · 星官相对位置正确，绝对方位按 J2000 口径近似（未做岁差归算）</div>
          <button className="card-cta" onClick={() => { setSelectedStar(guestStarRecord); setTheaterScene(null); startMeasuring(guestStarRecord) }}>用浑仪测这颗客星</button>
          <button
            className="link-button"
            onClick={() => {
              try {
                downloadMemorial(guestReadings, `客星剧场 · ${guestPlacement.scene.label}`)
                setNotice('客星帖已生成，浏览器会开始下载。')
              } catch {
                setNotice('图片生成失败。')
              }
              window.setTimeout(() => setNotice(''), 2600)
            }}
          ><Download size={16} />下载客星帖 · {guestPlacement.scene.label}幕</button>
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
              <div className={isTargetBelow ? 'aim-star phantom' : 'aim-star'} style={{ left: `${AIM_TARGET.x}%`, top: `${AIM_TARGET.y}%` }} aria-hidden="true">
                <span className="aim-star-core" />
                <span className="aim-star-label">{target.name}{isTargetBelow ? ' · 未升演示' : ''}</span>
              </div>
              <div className="crosshair" style={{ left: `${aimed ? AIM_TARGET.x : aim.x}%`, top: `${aimed ? AIM_TARGET.y : aim.y}%` }} aria-hidden="true"><span /><span /></div>
              <p className="aim-note" aria-live="polite">{aimed ? `已瞄准 · ${target.name}` : '拖动准星套住亮星 · 也可聚焦后用方向键微调'}</p>
            </div>
            <div className="measure-copy">
              <p>古人用浑仪量出的两个数——入宿度与去极度——描述同一颗星；瞄准后点亮。下方两格的现代坐标说的是同一件事。{panelReadings.altitudeNote}。</p>
              <div className="reading-grid">
                <div className={aimed ? '' : 'pend'}><small>入宿度（古）</small><strong>{panelReadings.ru}</strong></div>
                <div className={aimed ? '' : 'pend'}><small>去极度（古）</small><strong>{panelReadings.ju}</strong></div>
                <div><small>赤经（今）</small><strong>{panelReadings.ra}</strong></div>
                <div><small>赤纬（今）</small><strong>{panelReadings.dec}</strong></div>
              </div>
              <p className="precision-note">{aimed ? '入宿度＝自该宿距星起算的赤经差 · 去极度＝离天极的角距 · J2000 历元，未含岁差与大气折射修正' : '现代坐标即时可读；瞄准目标星后点亮两个古值 · J2000 历元教学换算'}</p>
            </div>
            <div className="panel-actions"><button className="secondary-button" onClick={() => setIsMeasuring(false)}>先不记录</button><button className={aimed ? 'primary-button' : 'primary-button tentative'} onClick={commitObservation}>{aimed ? '记入奏折' : '瞄准后可记入奏折'} <Download size={16} /></button></div>
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
