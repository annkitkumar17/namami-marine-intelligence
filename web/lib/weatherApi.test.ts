import { describe, expect, it } from "vitest";
import { degToCompass, parseWmoCode, getSeaCondition, getSimulatedMarineWeather } from "./weatherApi";

describe("weatherApi utilities", () => {
  it("converts degrees to 16-point compass directions correctly", () => {
    expect(degToCompass(0)).toBe("N");
    expect(degToCompass(90)).toBe("E");
    expect(degToCompass(180)).toBe("S");
    expect(degToCompass(270)).toBe("W");
    expect(degToCompass(240)).toBe("WSW");
  });

  it("parses WMO weather codes to human-readable marine descriptions", () => {
    expect(parseWmoCode(0).desc).toBe("Clear Skies");
    expect(parseWmoCode(65).desc).toBe("Heavy Rain");
    expect(parseWmoCode(95).desc).toContain("Thunderstorm");
  });

  it("classifies sea conditions by Douglas wave height scale", () => {
    expect(getSeaCondition(0.8)).toBe("CALM");
    expect(getSeaCondition(1.8)).toBe("MODERATE");
    expect(getSeaCondition(3.2)).toBe("ROUGH");
    expect(getSeaCondition(5.0)).toBe("VERY_ROUGH");
  });

  it("generates fallback marine weather with valid hourly forecast", () => {
    const data = getSimulatedMarineWeather(9.96, 76.24, 2.8);
    expect(data.location.lat).toBe(9.96);
    expect(data.current.waveHeightM).toBeGreaterThan(0);
    expect(data.hourly.length).toBe(24);
    expect(["GO", "CAUTION", "NO_GO"]).toContain(data.marineSafety.verdict);
  });
});

import { calculateDistanceKm, calculateBearingDeg, getPfzZonesAroundLocation } from "./marineData";

describe("Geospatial & Port PFZ utilities", () => {
  it("calculates distance between GPS coordinates in KM", () => {
    // Distance from Kochi (9.96, 76.24) to nearby hotspot (9.68, 75.82)
    const dist = calculateDistanceKm(9.96, 76.24, 9.68, 75.82);
    expect(dist).toBeGreaterThan(35);
    expect(dist).toBeLessThan(60);
  });

  it("calculates navigational compass bearing accurately", () => {
    const bearing = calculateBearingDeg(9.96, 76.24, 9.68, 75.82);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThanOrEqual(360);
  });

  it("dynamically returns sorted PFZ hotspots relative to any selected location or port", () => {
    const kochiPfzs = getPfzZonesAroundLocation(9.96, 76.24);
    expect(kochiPfzs.length).toBeGreaterThan(5);
    // Nearest should have smallest distance
    expect(kochiPfzs[0].distanceKm).toBeLessThanOrEqual(kochiPfzs[1].distanceKm);

    const mumbaiPfzs = getPfzZonesAroundLocation(18.94, 72.85);
    expect(mumbaiPfzs[0].distanceKm).toBeLessThan(100);
  });
});
