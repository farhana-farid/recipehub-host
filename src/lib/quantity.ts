/** Quantity scaling with pretty fractions for the serving multiplier. */

const FRACTIONS: Array<[number, string]> = [
  [0.125, "⅛"], [0.25, "¼"], [0.333, "⅓"], [0.375, "⅜"],
  [0.5, "½"], [0.625, "⅝"], [0.666, "⅔"], [0.75, "¾"], [0.875, "⅞"],
];

export function fmtQuantity(q: number | null | undefined, scale = 1): string {
  if (q == null) return "";
  const v = q * scale;
  const whole = Math.floor(v + 1e-9);
  const frac = v - whole;
  if (frac < 0.04) return String(whole);
  // find nearest friendly fraction
  let best = FRACTIONS[0];
  let bestDiff = Infinity;
  for (const f of FRACTIONS) {
    const d = Math.abs(frac - f[0]);
    if (d < bestDiff) {
      bestDiff = d;
      best = f;
    }
  }
  if (bestDiff > 0.04 || best[0] === 0.999) {
    return (Math.round(v * 100) / 100).toString();
  }
  if (whole === 0) return best[1];
  return `${whole} ${best[1]}`;
}

export function scaleMinutes(min: number, scale: number): number {
  // Rough heuristics: cook time doesn't scale fully linearly for larger batches.
  return Math.round(min * Math.pow(scale, 0.72));
}
