/**
 * Test accounts provisioned via scripts/dev/provision-test-accounts.mjs
 * These match real employee records in the database.
 */

export const TEST_PASSWORD = 'Password@123'

// ── SRO / BOA / ABH (L1 → SBH, L3 → Mansoor) ────────────────────────────

export const SRO_AP = {
  email: 'yohan.mutluri@nxtwave.co.in',
  label: 'SRO AP — Yohan Mutluri',
  designation: 'Student Relationship Officer',
  state: 'Andhra Pradesh',
}

// ── SBH / ZBH / PM (L3 → Mansoor directly) ────────────────────────────────

export const SBH_AP = {
  email: 'nagaraju.madugula@nxtwave.co.in',
  label: 'SBH AP — Madugula Nagaraju',
  designation: 'State Business Head',
  state: 'Andhra Pradesh',
}

export const PM_MANSOOR = {
  email: 'mansoor@nxtwave.co.in',
  label: 'PM — Mansoor Valli Gangupalli',
  designation: 'Program Manager',
}

// ── Finance Team ───────────────────────────────────────────────────────────

export const FINANCE_1 = {
  email: 'finance1@nxtwave.co.in',
  label: 'Finance User 1',
  designation: 'Finance',
}
