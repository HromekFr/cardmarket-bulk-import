// Aliases from ManaBox set codes to MTGJSON set codes.
// Add an entry here when ManaBox exports a set code that doesn't match any key
// in the corresponding MTGJSON set (code, codeV3, mtgoCode, keyruneCode, name, etc.).
//
// Format: ManaBox set code → MTGJSON set code (the value in `code` field of the MTGJSON set).
//
// Case D root cause X — ManaBox code and MTGJSON code diverge for the same real set.

export const MANABOX_CODE_ALIASES: Record<string, string> = {};
