import { describe, expect, it } from "vitest";
import {
  azimuthDegrees,
  compass8,
  elevationMils,
  hudBearing,
  nudge,
  parsePair,
  rangeMeters,
  solve,
} from "./math";

describe("range and azimuth", () => {
  it("treats one grid as 100 m", () => {
    expect(
      rangeMeters({ gunX: 105, gunY: 115.1, tgtX: 105.1, tgtY: 115.1 }),
    ).toBeCloseTo(10, 6);
  });

  it("reads 0° as north", () => {
    expect(azimuthDegrees({ gunX: 50, gunY: 50, tgtX: 50, tgtY: 51 })).toBeCloseTo(
      0,
      6,
    );
    expect(hudBearing(0)).toBe("000N");
  });

  it("reads 90° as east", () => {
    expect(azimuthDegrees({ gunX: 50, gunY: 50, tgtX: 51, tgtY: 50 })).toBeCloseTo(
      90,
      6,
    );
    expect(hudBearing(90)).toBe("090E");
  });

  it("reads 180° as south and 270° as west", () => {
    expect(azimuthDegrees({ gunX: 50, gunY: 50, tgtX: 50, tgtY: 49 })).toBeCloseTo(
      180,
      6,
    );
    expect(azimuthDegrees({ gunX: 50, gunY: 50, tgtX: 49, tgtY: 50 })).toBeCloseTo(
      270,
      6,
    );
  });

  it("matches in-game HUD style 227SW", () => {
    expect(hudBearing(227.4)).toBe("227SW");
    expect(compass8(227)).toBe("SW");
    expect(hudBearing(47)).toBe("047NE");
    expect(hudBearing(359.6)).toBe("000N");
  });

  it("puts equal SW on 225", () => {
    const az = azimuthDegrees({ gunX: 10, gunY: 10, tgtX: 9, tgtY: 9 });
    expect(az).toBeCloseTo(225, 6);
    expect(hudBearing(az)).toBe("225SW");
  });
});

describe("elevation table", () => {
  it("hits table knots", () => {
    expect(elevationMils(132)).toBe(850);
    expect(elevationMils(300)).toBe(690);
    expect(elevationMils(684)).toBe(150);
  });

  it("interpolates between knots", () => {
    // 290 m → 700, 300 m → 690
    expect(elevationMils(295)).toBeCloseTo(695, 6);
  });
});

describe("solve", () => {
  it("flags zero range", () => {
    expect(solve({ gunX: 1, gunY: 1, tgtX: 1, tgtY: 1 }).status).toBe("zero");
  });

  it("flags too close / too far / ok", () => {
    expect(solve({ gunX: 0, gunY: 0, tgtX: 0.5, tgtY: 0 }).status).toBe("close");
    expect(solve({ gunX: 0, gunY: 0, tgtX: 3, tgtY: 0 }).status).toBe("ok");
    expect(solve({ gunX: 0, gunY: 0, tgtX: 8, tgtY: 0 }).status).toBe("far");
  });
});

describe("parse and nudge", () => {
  it("parses labeled and raw pairs", () => {
    expect(parsePair("x100.05, y109.14")).toEqual({ x: 100.05, y: 109.14 });
    expect(parsePair("87.45 102.31")).toEqual({ x: 87.45, y: 102.31 });
  });

  it("nudges 10 m on the 100 m grid", () => {
    expect(nudge(10, 10, "N", 10)).toEqual({ x: 10, y: 10.1 });
    expect(nudge(10, 10, "W", 50)).toEqual({ x: 9.5, y: 10 });
  });
});
