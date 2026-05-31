// ═══════════════════════════════════════════════════════════════
// UNIVERSAL DYNASTY PICK VALUE MODEL v8
// Three-phase continuous decay with an explicit final floor zone
//
// Calibrated to: KeepTradeCut (April 2026, 25M+ crowdsourced data points),
// FantasyCalc, theScore/Justin Boone dynasty trade values
//
// Key design: THREE-PHASE continuous decay
//   Phase 1 (R1):  Controlled premium — 1.01 stands out without cratering 1.02+
//   Phase 2 (R2):  Moderate — 2nd rounders hold reasonable value
//   Phase 3 (R3+): Long lottery tail that stays above the true floor
//   Floor zone:     Only the final 12% of picks can be exactly 50 DHQ
//   Each phase starts where the previous one ends (smooth continuous handoff)
//
// Works for any league size (8-32 teams) and any draft length
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate the industry consensus value for any dynasty draft pick.
 * Returns a value on the DHQ 0-10000 scale.
 *
 * Three-phase continuous decay. Phase 1 keeps 1.01 as the
 * premium pick while avoiding an unrealistic cliff from 1.01 to the next
 * few first-rounders. The true 50-DHQ minimum is reserved for the final
 * 12% of the draft so late-round picks do not hit the floor too early.
 *
 * 16-team reference: 1.04≈6490, 1.08≈5350, 1.12≈4420, 1.16≈3650
 *
 * @param {number} pickNumber - Overall pick number (1-indexed)
 * @param {number} totalTeams - League size (8-32)
 * @param {number} draftRounds - Number of draft rounds (typically 4-10)
 * @returns {number} DHQ value (50-7500)
 */
function getIndustryPickValue(pickNumber, totalTeams, draftRounds) {
  const TOP = 7500;  // Pick 1.01 value (correctly calibrated)
  const FLOOR = 50;
  const SOFT_FLOOR = 75;

  const teams = Math.max(1, Number(totalTeams) || 12);
  const rounds = Math.max(1, Number(draftRounds) || 7);
  const totalPicks = teams * rounds;
  const pick = Math.max(1, Math.min(Math.round(Number(pickNumber) || 1), totalPicks));
  const floorPickCount = Math.max(1, Math.floor(totalPicks * 0.12));
  const floorStart = totalPicks - floorPickCount + 1;

  if (pick >= floorStart) return FLOOR;

  const r1End = teams;      // last pick of R1
  const r2End = teams * 2;  // last pick of R2
  const phase3End = Math.max(r2End + 1, floorStart - 1);

  // Phase 1 (R1): premium but smooth — no sharp 1.01 cliff
  const k1 = 0.048;
  // Phase 2 (R2): moderate — smooth descent from R1 endpoint
  const k2 = 0.035;

  // Transition values (each phase starts where previous ends)
  const t1 = TOP * Math.exp(-k1 * (r1End - 1));
  const t2 = t1 * Math.exp(-k2 * (r2End - r1End));

  function interpolateExp(start, end, step, totalSteps) {
    if (totalSteps <= 0) return end;
    const bounded = Math.max(0, Math.min(1, step / totalSteps));
    return start * Math.pow(end / start, bounded);
  }

  let value;
  if (pick <= r1End) {
    value = TOP * Math.exp(-k1 * (pick - 1));
  } else if (pick <= r2End) {
    value = t1 * Math.exp(-k2 * (pick - r1End));
  } else {
    value = interpolateExp(t2, SOFT_FLOOR, pick - r2End, phase3End - r2End);
  }

  return Math.max(FLOOR + 1, Math.round(value));
}

/**
 * Convenience: get value using round + slot instead of pick number
 */
function getPickValueBySlot(round, posInRound, totalTeams, draftRounds) {
  const teams = Math.max(1, Number(totalTeams) || 12);
  const pickNumber = (Math.max(1, Number(round) || 1) - 1) * teams + Math.max(1, Number(posInRound) || 1);
  return getIndustryPickValue(pickNumber, teams, draftRounds || 7);
}

/**
 * Generate a complete pick value table for a league.
 * Returns an object keyed by pick number (1-indexed).
 */
function buildIndustryPickTable(totalTeams, draftRounds) {
  const table = {};
  const teams = Math.max(1, Number(totalTeams) || 12);
  const rounds = Math.max(1, Number(draftRounds) || 7);
  const totalPicks = teams * rounds;
  for (let pick = 1; pick <= totalPicks; pick++) {
    table[pick] = getIndustryPickValue(pick, teams, rounds);
  }
  // Monotonic enforcement: each pick must be worth ≤ the previous pick.
  // Guards against any discount or phase-boundary inversion.
  for (let pick = 2; pick <= totalPicks; pick++) {
    if (table[pick] > table[pick - 1]) {
      table[pick] = Math.max(50, table[pick - 1] - 1);
    }
  }
  return table;
}

// Export for use in DHQ engine and Node.js tests
if (typeof window !== 'undefined') {
  window.getIndustryPickValue = getIndustryPickValue;
  window.getPickValueBySlot = getPickValueBySlot;
  window.buildIndustryPickTable = buildIndustryPickTable;
}
if (typeof module !== 'undefined') {
  module.exports = { getIndustryPickValue, getPickValueBySlot, buildIndustryPickTable };
}
