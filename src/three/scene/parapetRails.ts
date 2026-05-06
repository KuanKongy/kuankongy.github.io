import { ARENA } from "../constants";

/**
 * Parapet pattern: 1×1 stone blocks one cell above the castle top, on EVERY
 * side of the 6×6 footprint, with the same gap pattern on each side — the
 * 6 cells along a side are at positions 0..5 and we keep cells 0, 2, 3, 5
 * (gaps at positions 1 and 4). Corner cells are shared between two adjacent
 * sides; we de-duplicate so only one block sits at each corner.
 */
export function getCastleParapetRailXZ(): Array<[number, number]> {
  const halfW = ARENA.platformHalfWidth;
  const halfD = ARENA.platformHalfDepth;
  const colXs: number[] = [];
  for (let i = 0; i < halfW * 2; i++) colXs.push(-halfW + 0.5 + i);
  const rowZs: number[] = [];
  for (let i = 0; i < halfD * 2; i++) rowZs.push(-halfD + 0.5 + i);

  const keepIndices = new Set([0, 2, 3, 5]); // skip positions 1 and 4

  const seen = new Set<string>();
  const out: Array<[number, number]> = [];
  const push = (x: number, z: number) => {
    const k = `${x.toFixed(2)},${z.toFixed(2)}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push([x, z]);
  };

  const frontZ = halfD - 0.5;
  const backZ = -halfD + 0.5;
  const leftX = -halfW + 0.5;
  const rightX = halfW - 0.5;

  for (let i = 0; i < colXs.length; i++) {
    if (!keepIndices.has(i)) continue;
    push(colXs[i], frontZ);
    push(colXs[i], backZ);
  }
  for (let j = 0; j < rowZs.length; j++) {
    if (!keepIndices.has(j)) continue;
    push(leftX, rowZs[j]);
    push(rightX, rowZs[j]);
  }
  return out;
}
