import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate,
  distributeByWeight,
  distributeEqually,
  type BillInput,
  type ParticipantInput,
} from './calc';

// Sensible defaults; individual tests override what they exercise.
function bill(overrides: Partial<BillInput> = {}): BillInput {
  return {
    mode: 'item_based',
    includeOrganizerInSplit: true,
    taxCents: 0,
    serviceChargeCents: 0,
    discountCents: 0,
    companyClaim: { type: 'none' },
    taxAlloc: 'proportional',
    serviceChargeAlloc: 'proportional',
    discountAlloc: 'proportional',
    companyClaimAlloc: 'proportional',
    farewellAlloc: 'equal_paying_participants',
    finalBillCents: null,
    manualRoundingCents: null,
    ...overrides,
  };
}

function p(
  id: string,
  ownSubtotalCents: number,
  opts: { role?: ParticipantInput['role']; isOrganizer?: boolean } = {},
): ParticipantInput {
  return {
    id,
    name: id,
    ownSubtotalCents,
    role: opts.role ?? 'paying_participant',
    isOrganizer: opts.isOrganizer ?? false,
  };
}

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

// ---- distribution helpers -------------------------------------------------

test('distributeEqually sums exactly and spreads the remainder', () => {
  assert.deepEqual(distributeEqually(100, 3), [34, 33, 33]);
  assert.equal(sum(distributeEqually(101, 7)), 101);
  assert.deepEqual(distributeEqually(0, 4), [0, 0, 0, 0]);
});

test('distributeByWeight sums exactly (largest remainder)', () => {
  assert.equal(sum(distributeByWeight(1000, [1, 1, 1])), 1000);
  assert.deepEqual(distributeByWeight(1000, [1, 1, 1]), [334, 333, 333]);
  assert.deepEqual(distributeByWeight(400, [1000, 3000]), [100, 300]);
  // zero weights fall back to an equal split
  assert.deepEqual(distributeByWeight(10, [0, 0, 0]), [4, 3, 3]);
});

// ---- Mode A: item-based ---------------------------------------------------

test('Mode A distributes tax proportionally and totals reconcile', () => {
  const out = calculate([p('a', 1000), p('b', 3000)], bill({ taxCents: 400, finalBillCents: 4400 }));
  const a = out.results.find((r) => r.id === 'a')!;
  const b = out.results.find((r) => r.id === 'b')!;
  assert.equal(a.taxCents, 100);
  assert.equal(b.taxCents, 300);
  assert.equal(a.totalDueCents, 1100);
  assert.equal(b.totalDueCents, 3300);
  assert.equal(out.summary.calculatedTotalCents, 4400);
  assert.equal(out.summary.mismatchCents, 0);
  assert.equal(out.summary.collectedFromParticipantsCents, 4400);
});

test('Mode A with company claim percentage reduces totals; sums to bill - claim', () => {
  const out = calculate(
    [p('a', 10000), p('b', 10000)],
    bill({ companyClaim: { type: 'percentage', percent: 25 }, finalBillCents: 20000 }),
  );
  assert.equal(out.summary.companyClaimAmountCents, 5000); // 25% of 20000
  const a = out.results.find((r) => r.id === 'a')!;
  assert.equal(a.companyClaimCents, 2500);
  assert.equal(a.totalDueCents, 7500);
  assert.equal(out.summary.collectedFromParticipantsCents, 15000); // bill - claim
});

test('Mode A discount organizer_only lands entirely on the organizer', () => {
  const out = calculate(
    [p('org', 5000, { isOrganizer: true }), p('b', 5000)],
    bill({ discountCents: 1000, discountAlloc: 'organizer_only' }),
  );
  const org = out.results.find((r) => r.id === 'org')!;
  const b = out.results.find((r) => r.id === 'b')!;
  assert.equal(org.discountCents, 1000);
  assert.equal(b.discountCents, 0);
  assert.equal(org.totalDueCents, 4000);
  assert.equal(b.totalDueCents, 5000);
});

// ---- Mode C: farewell -----------------------------------------------------

test('Mode C: honorees pay 0; their cost is shared equally across payers', () => {
  const out = calculate(
    [
      p('org', 1000, { isOrganizer: true }),
      p('b', 1000),
      p('h', 1000, { role: 'farewell_honoree' }),
    ],
    bill({ mode: 'farewell', taxCents: 300, finalBillCents: 3300 }),
  );
  const org = out.results.find((r) => r.id === 'org')!;
  const b = out.results.find((r) => r.id === 'b')!;
  const h = out.results.find((r) => r.id === 'h')!;

  assert.equal(h.totalDueCents, 0, 'honoree pays nothing');
  assert.equal(org.farewellSponsoredShareCents, 500);
  assert.equal(b.farewellSponsoredShareCents, 500);
  // base 1500 each, tax 300 split 150/150 -> 1650 each
  assert.equal(org.totalDueCents, 1650);
  assert.equal(b.totalDueCents, 1650);
  assert.equal(out.summary.collectedFromParticipantsCents, 3300);
  assert.equal(out.summary.mismatchCents, 0);
});

test('Mode C requires the honoree cost to be fully covered by payers', () => {
  const out = calculate(
    [p('x', 700), p('y', 300), p('h', 1000, { role: 'farewell_honoree' })],
    bill({ mode: 'farewell', farewellAlloc: 'proportional_paying_participants' }),
  );
  const x = out.results.find((r) => r.id === 'x')!;
  const y = out.results.find((r) => r.id === 'y')!;
  // honoree 1000 shared proportionally to 700:300 -> 700:300
  assert.equal(x.farewellSponsoredShareCents, 700);
  assert.equal(y.farewellSponsoredShareCents, 300);
  assert.equal(
    x.farewellSponsoredShareCents + y.farewellSponsoredShareCents,
    1000,
    'all honoree cost is allocated',
  );
});

// ---- Mode B: equal split --------------------------------------------------

test('Mode B splits the final bill equally and exactly', () => {
  const out = calculate([p('a', 1), p('b', 999), p('c', 0)], bill({ mode: 'equal_split', finalBillCents: 1000 }));
  const totals = out.results.map((r) => r.totalDueCents).sort((a, b) => a - b);
  assert.deepEqual(totals, [333, 333, 334]);
  assert.equal(out.summary.collectedFromParticipantsCents, 1000);
});

test('Mode B can exclude the organizer from the split', () => {
  const out = calculate(
    [p('org', 0, { isOrganizer: true }), p('b', 0), p('c', 0)],
    bill({ mode: 'equal_split', finalBillCents: 1000, includeOrganizerInSplit: false }),
  );
  const org = out.results.find((r) => r.id === 'org')!;
  assert.equal(org.totalDueCents, 0, 'organizer excluded pays nothing');
  assert.equal(out.summary.collectedFromParticipantsCents, 1000);
});

// ---- Rounding -------------------------------------------------------------

test('rounding difference vs final bill lands on the organizer', () => {
  const out = calculate(
    [p('org', 5149, { isOrganizer: true }), p('b', 5150)],
    bill({ finalBillCents: 10300 }), // calculated = 10299
  );
  const org = out.results.find((r) => r.id === 'org')!;
  assert.equal(org.roundingAdjustmentCents, 1);
  assert.equal(out.summary.collectedFromParticipantsCents, 10300);
  assert.equal(out.summary.mismatchCents, -1); // 10299 - 10300
});
