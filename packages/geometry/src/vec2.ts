/**
 * İki boyutlu nokta/vektör — immutable.
 * (Saf veri; DOM/render bilgisi içermez. CLAUDE.md §0.8.)
 */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s };
}

export function length(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * `point`'i `origin`'den çıkan en yakın `stepRad` katı açıya kilitler (ortho/polar mod).
 * Uzaklık korunur, yön en yakın açıya yuvarlanır. `stepRad = π/2` → yatay/dikey; `π/4` → +45°.
 * Aynı nokta (uzaklık 0) → değişmeden döner.
 */
export function snapToAngle(origin: Vec2, point: Vec2, stepRad: number): Vec2 {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: point.x, y: point.y };
  const snapped = Math.round(Math.atan2(dy, dx) / stepRad) * stepRad;
  return { x: origin.x + dist * Math.cos(snapped), y: origin.y + dist * Math.sin(snapped) };
}
