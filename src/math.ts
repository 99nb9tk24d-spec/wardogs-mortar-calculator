import { MAX_RANGE_M, MIN_RANGE_M, MORTAR_TABLE } from "./table";

export const METERS_PER_GRID = 100;
export const COMPASS_8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export type Compass8 = (typeof COMPASS_8)[number];
export type RangeStatus = "incomplete" | "zero" | "close" | "ok" | "far";
export type Cardinal = "N" | "S" | "E" | "W";

export type Coords = {
  gunX: number;
  gunY: number;
  tgtX: number;
  tgtY: number;
};

export type Solution = {
  rangeM: number;
  azimuthDeg: number;
  compass: Compass8;
  hud: string;
  elevationMil: number | null;
  status: RangeStatus;
};

export function parseNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** Pull the first two numbers from pasted HUD / chat text. */
export function parsePair(text: string): { x: number; y: number } | null {
  const normalized = text.replace(/,/g, " ").replace(/[xXyY:=]/g, " ");
  const nums = normalized.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  const x = Number(nums[0]);
  const y = Number(nums[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

export function roundCoord(n: number): number {
  return Math.round(n * 100) / 100;
}

export function eastingMeters(gunX: number, tgtX: number): number {
  return (tgtX - gunX) * METERS_PER_GRID;
}

export function northingMeters(gunY: number, tgtY: number): number {
  return (tgtY - gunY) * METERS_PER_GRID;
}

export function rangeMeters(coords: Coords): number {
  return Math.hypot(
    eastingMeters(coords.gunX, coords.tgtX),
    northingMeters(coords.gunY, coords.tgtY),
  );
}

/** 0° = north, clockwise, 0–360. Undefined (NaN) when range is 0. */
export function azimuthDegrees(coords: Coords): number {
  const east = eastingMeters(coords.gunX, coords.tgtX);
  const north = northingMeters(coords.gunY, coords.tgtY);
  const deg = (Math.atan2(east, north) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function compass8(deg: number): Compass8 {
  const wrapped = ((deg % 360) + 360) % 360;
  const idx = Math.round(wrapped / 45) % 8;
  return COMPASS_8[idx];
}

/** In-game compass style: `227SW`, `000N`, `047NE`. */
export function hudBearing(deg: number): string {
  const rounded = Math.round(((deg % 360) + 360) % 360) % 360;
  return `${String(rounded).padStart(3, "0")}${compass8(rounded)}`;
}

export function elevationMils(rangeM: number): number | null {
  const table = MORTAR_TABLE;
  const first = table[0][0];
  const last = table[table.length - 1][0];
  if (rangeM < first || rangeM > last) return null;

  for (let i = 0; i < table.length - 1; i++) {
    const [r0, m0] = table[i];
    const [r1, m1] = table[i + 1];
    if (rangeM >= r0 && rangeM <= r1) {
      if (r1 === r0) return m0;
      const t = (rangeM - r0) / (r1 - r0);
      return m0 + t * (m1 - m0);
    }
  }
  return table[table.length - 1][1];
}

export function rangeStatus(rangeM: number): RangeStatus {
  if (rangeM < 0.5) return "zero";
  if (rangeM < MIN_RANGE_M) return "close";
  if (rangeM > MAX_RANGE_M) return "far";
  return "ok";
}

export function solve(coords: Coords): Solution {
  const rangeM = rangeMeters(coords);
  const status = rangeStatus(rangeM);
  if (status === "zero") {
    return {
      rangeM: 0,
      azimuthDeg: 0,
      compass: "N",
      hud: "—",
      elevationMil: null,
      status,
    };
  }
  const azimuthDeg = azimuthDegrees(coords);
  return {
    rangeM,
    azimuthDeg,
    compass: compass8(azimuthDeg),
    hud: hudBearing(azimuthDeg),
    elevationMil: elevationMils(rangeM),
    status,
  };
}

export function nudge(
  x: number,
  y: number,
  dir: Cardinal,
  meters: number,
): { x: number; y: number } {
  const d = meters / METERS_PER_GRID;
  switch (dir) {
    case "N":
      return { x: roundCoord(x), y: roundCoord(y + d) };
    case "S":
      return { x: roundCoord(x), y: roundCoord(y - d) };
    case "E":
      return { x: roundCoord(x + d), y: roundCoord(y) };
    case "W":
      return { x: roundCoord(x - d), y: roundCoord(y) };
  }
}
