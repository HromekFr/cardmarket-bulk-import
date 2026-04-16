// Corrections and additions to MTGJSON's CardMarket expansion ID mappings.
// Each entry is: MTGJSON set code → correct CardMarket idExpansion.
//
// Case B — stale/wrong ID: MTGJSON's mcmId doesn't exist in CardMarket or points
//   to the wrong expansion. The extension would silently fail to match any cards.
//
// Case C — missing mapping: MTGJSON has no mcmId at all for the set, so the
//   extension filters it out entirely. These entries inject the correct ID.

export const MCM_ID_OVERRIDES: Record<string, number> = {
  // Case B
  M20: 2447, // MTGJSON points to 2490 (Core 2020: Extras) instead of 2447 (Core 2020)

  // Case C
  DD3: 1509, // Duel Decks: Anthology
  MB1: 2874, // Mystery Booster
  SLU: 3068, // Secret Lair: Ultimate Edition
  SOS: 6474, // Secrets of Strixhaven
  SPM: 6070, // Marvel's Spider-Man
  TLA: 6261, // Avatar: The Last Airbender
  TMT: 6345, // Teenage Mutant Ninja Turtles

  // Case D — ManaBox set codes with no mcmId in MTGJSON; CardMarket name differs from MTGJSON name
  ACR: 5655, // Assassin's Creed (Universes Beyond) → "Universes Beyond: Assassin's Creed"
  BRR: 5170, // The Brothers' War Retro Artifacts → "Retro Frame Artifacts"
  CLU: 5572, // Ravnica: Clue Edition → "Ravnica: Cluedo Edition" (different spelling)
  FDN: 5852, // Foundations → "Magic: The Gathering Foundations"
  H2R: 4244, // Modern Horizons 2 Timeshifts (retro-frame reprints) → "Modern Horizons 2: Extras"
  LTC: 5296, // Tales of Middle-earth Commander → "Commander: The Lord of the Rings: Tales of Middle-earth"
  NEC: 4474, // Neon Dynasty Commander → "Commander: Kamigawa: Neon Dynasty"
  PBRO: 5178, // The Brothers' War Promos → "The Brothers' War: Promos"
  TSB: 56,   // Time Spiral Timeshifted (purple-bordered bonus sheet) → "Time Spiral"
  WOT: 5442, // Wilds of Eldraine: Enchanting Tales (bonus sheet) → "Enchanting Tales"
};
