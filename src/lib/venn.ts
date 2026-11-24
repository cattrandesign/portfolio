export type Pt = [number, number];

const TAU = Math.PI * 2;

function rng(seed: number) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One continuous hand-drawn stroke forming a Venn diagram, returned in stroke
// order: it starts and ends on the left circle's outer edge, so the shape closes
// on itself. With `lead`, it finishes on a short rise below that point, where a
// line can join it flowing straight up into the circle.
export function vennStroke(o: {
  cx: number;
  cy: number;
  r: number;
  seed?: number;
  jitter?: number;
  lead?: number;
  time?: number;
}): Pt[] {
  const rand = rng(o.seed ?? 1);
  const j = o.jitter ?? 1;
  const span = (lo: number, hi: number) => lo + (hi - lo) * rand();
  const time = o.time ?? 0;

  const r = o.r;
  const d = r * (0.45 + j * span(-0.08, 0.08) + 0.08 * Math.sin(time * 0.9));
  const rL = r * (1 + j * span(-0.05, 0.03) + 0.03 * Math.sin(time * 1.1));
  const rR = r * (1 + j * span(-0.03, 0.05) + 0.03 * Math.sin(time * 0.8 + 2));
  const tilt = j * span(-0.12, 0.12) + 0.14 * Math.sin(time * 0.6 + 1);
  const phL = span(0, TAU) + time * 0.9;
  const phR = span(0, TAU) - time * 0.75;
  const [shiftX, shiftY] = vennShift(r, o.time);
  const wob = 0.035 + j * span(0, 0.035);
  const h = Math.sqrt(r * r - (d / 2) * (d / 2));
  const lead = o.lead ?? 0;

  const local: Pt[] = [];
  const wobble = (theta: number, ph: number) =>
    1 + wob * (0.6 * Math.sin(2 * theta + ph) + 0.4 * Math.sin(3 * theta + ph * 1.7));
  // Near the top crossing, where the stroke hops between circles, both circles
  // ease back to the true radius with no wobble, so the hop is seamless.
  const radius = (rad: number, ph: number, theta: number, cross: number) => {
    const gap = Math.abs(((theta - cross + Math.PI) % TAU + TAU) % TAU - Math.PI);
    const ease = Math.min(1, gap / 0.7);
    const k = ease * ease * (3 - 2 * ease);
    return (r + (rad - r) * k) * (1 + (wobble(theta, ph) - 1) * k);
  };
  const arc = (
    ox: number,
    rad: number,
    ph: number,
    cross: number,
    from: number,
    to: number,
  ) => {
    const steps = Math.max(2, Math.ceil((Math.abs(to - from) / TAU) * 40));
    for (let i = 1; i <= steps; i++) {
      const theta = from + (to - from) * (i / steps);
      const rr = radius(rad, ph, theta, cross);
      local.push([ox + rr * Math.cos(theta), rr * Math.sin(theta)]);
    }
  };

  // Optional lead-in, rising into the left circle's outermost point.
  if (lead > 0) {
    local.push([-d / 2 - rL + r * 0.05, r * lead]);
    local.push([-d / 2 - rL, r * lead * 0.45]);
  }

  // Each circle is traced exactly once, all clockwise: part of the left circle
  // up to the top crossing, the whole right circle, then the rest of the left
  // circle back to where the stroke began.
  const lStart = Math.PI;
  const lCross = TAU + Math.atan2(-h, d / 2);
  const rCross = TAU + Math.atan2(-h, -d / 2);
  local.push([-d / 2 - radius(rL, phL, lStart, lCross), 0]);
  arc(-d / 2, rL, phL, lCross, lStart, lCross);
  arc(d / 2, rR, phR, rCross, rCross, rCross + TAU);
  arc(-d / 2, rL, phL, lCross, lCross, lStart + TAU);

  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const pts = local.map(
    ([x, y]) =>
      [o.cx + shiftX + x * cos - y * sin, o.cy + shiftY + x * sin + y * cos] as Pt,
  );
  return pts.reverse();
}

// The drift applied to an animated Venn.
export function vennShift(r: number, time?: number): Pt {
  if (time === undefined) return [0, 0];
  return [r * 0.12 * Math.sin(time * 0.5), r * 0.08 * Math.sin(time * 0.75 + 1.3)];
}

// A cursive "ct" as two strokes. The first is one connected line: a small hook
// into an open c, an exit along the baseline that sweeps up into the t's
// ascender, and back down the stem into a curled foot. The second is the
// crossbar. The joining stroke rises well right of the c's opening so the c
// stays open. Coordinates are relative to the glyph's height (`size`), with a
// small fixed jitter so it reads as handwritten.
export function ctStrokes(o: { cx: number; cy: number; size: number; seed?: number }): Pt[][] {
  const rand = rng(o.seed ?? 7);
  const jitter = () => (rand() - 0.5) * 0.025;
  const word: Pt[] = [
    [-0.02, -0.08],
    [-0.04, -0.16],
    [-0.13, -0.19],
    [-0.27, -0.13],
    [-0.33, 0.02],
    [-0.26, 0.17],
    [-0.12, 0.21],
    [0.02, 0.17],
    [0.12, 0.1],
    [0.2, -0.08],
    [0.22, -0.28],
    [0.17, -0.38],
    [0.12, -0.28],
    [0.11, -0.05],
    [0.11, 0.12],
    [0.16, 0.2],
    [0.25, 0.2],
    [0.34, 0.12],
  ];
  const bar: Pt[] = [
    [0.03, -0.11],
    [0.18, -0.12],
    [0.31, -0.14],
  ];
  // Lean the letters like handwriting: higher points shift right.
  const slant = 0.2;
  const place = (pts: Pt[]) =>
    pts.map(([x, y]) => {
      const yy = y + 0.085 + jitter();
      const xx = x - 0.01 - yy * slant + jitter();
      return [o.cx + xx * o.size, o.cy + yy * o.size] as Pt;
    });
  return [place(word), place(bar)];
}

// Catmull-Rom spline through the points. `closed` treats the first and last
// points as the same spot so the seam where the shape closes stays smooth.
export function smoothPath(pts: Pt[], closed = false) {
  const f = (v: number) => v.toFixed(2);
  const last = pts.length - 1;
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < last; i++) {
    const p0 = pts[i - 1] || (closed ? pts[last - 1] : pts[i]);
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || (closed ? pts[1] : pts[i + 1]);
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}, ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}, ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
