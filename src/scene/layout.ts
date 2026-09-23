export const COLS = 4;
export const ROWS = 3;
export const TILE = 1;
export const GAP = 0.18;
export const SURVIVOR = 6; // tile-07
export const FALL_ORDER: readonly number[] = [2, 9, 0, 11, 5, 3, 8, 1, 10, 4, 7];

export function gridPositions(): { x: number; y: number }[] {
  const step = TILE + GAP;
  const out: { x: number; y: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push({ x: (c - (COLS - 1) / 2) * step, y: ((ROWS - 1) / 2 - r) * step });
    }
  }
  return out;
}

export function tileName(i: number): string {
  return `tile-${String(i + 1).padStart(2, '0')}`;
}
