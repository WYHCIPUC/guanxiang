// 程序化视觉素材：随机星野与绢纹肌理（确定性种子，构建后稳定不变）。
// 本地 AI 图像生成不可用时的等价方案：全部为内联 SVG data-URI，无外部请求。

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// 背景星野：避免规则点阵的模板感；星色偏暖白/冷白，少数带金色
export function starfieldDataUri(seed = 20261006, count = 110, width = 800, height = 500): string {
  const rand = mulberry32(seed)
  const palette = ['#f5f1e6', '#e8eefc', '#ffe9c0', '#dce6f5']
  const parts: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (rand() * width).toFixed(1)
    const y = (rand() * height).toFixed(1)
    const r = (0.35 + rand() * 0.85).toFixed(2)
    const o = (0.16 + rand() * 0.6).toFixed(2)
    const c = palette[Math.floor(rand() * palette.length)]
    parts.push(`<circle cx='${x}' cy='${y}' r='${r}' fill='${c}' opacity='${o}'/>`)
  }
  // 数颗较亮的定标星，带微光晕
  for (let i = 0; i < 7; i++) {
    const x = (rand() * width).toFixed(1)
    const y = (rand() * height).toFixed(1)
    parts.push(
      `<circle cx='${x}' cy='${y}' r='1.7' fill='#fdf8ea' opacity='.14'/>` +
      `<circle cx='${x}' cy='${y}' r='.8' fill='#fdf8ea' opacity='.8'/>`,
    )
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}' preserveAspectRatio='xMidYMid slice'>${parts.join('')}</svg>`
  return svgDataUri(svg)
}

// 绢丝肌理：低透明度噪点，叠在星图与仪器台上，替代"平面深蓝"的塑料感
export function silkGrainDataUri(seed = 77, baseFrequency = 0.82): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(%23g)'/></svg>`
  return svgDataUri(svg)
}
