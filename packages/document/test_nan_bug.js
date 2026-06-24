import { estimateCost, DEFAULT_UNIT_PRICES } from './src/cost.ts';

const base = {
  wallLengthM: 0,
  wallElevationM2: 0,
  plasterAreaM2: 0,
  ceilingAreaM2: 0,
  paintAreaM2: 0,
  floorAreaM2: 100,
  skirtingM: 0,
  doorCount: 1,
  windowCount: 0,
  doorSchedule: [],
  windowSchedule: [],
  blockSchedule: [],
  wallByMaterial: [],
};

// Test: corrupt localStorage types
const corruptPrices = {
  ...DEFAULT_UNIT_PRICES,
  door: "not-a-number"  // String instead of number
};

const cost = estimateCost(base, corruptPrices);
console.log("Cost with corrupt door price:");
console.log(JSON.stringify(cost, null, 2));

// Check for NaN
const hasNaN = cost.lines.some(l => !Number.isFinite(l.total)) ||
               !Number.isFinite(cost.subtotal) ||
               !Number.isFinite(cost.overhead) ||
               !Number.isFinite(cost.total) ||
               !Number.isFinite(cost.perM2);
console.log("Has NaN values:", hasNaN);
