export const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || "FIXTURE";

export function isFixtureMode(mode: string = DATA_MODE): boolean {
  return mode === "FIXTURE";
}

export function demoBanner(mode: string = DATA_MODE): string {
  return `${mode} DATA — simulated / mock sources. Not operational marine advice.`;
}
