// 程序化视觉素材：绢丝肌理（内联 SVG data-URI，无外部请求）。
// 注：背景星野已改用真实 HYG 星表（src/data/starfield.ts），不再使用程序化星点。
export function silkGrainDataUri(seed = 77, baseFrequency = 0.82): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(%23g)'/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
