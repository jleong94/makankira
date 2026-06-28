/**
 * calc.ts — MakanKira bill-split calculation engine (README Sections 4 & 5).
 *
 * Pure, dependency-free domain logic. All money is INTEGER sen (RM 9.50 = 950).
 * Inputs are per-participant own subtotals (computed elsewhere from order items
 * × actual prices); this module never touches the DB.
 *
 * Modes:
 *   - item_based : each person pays for what they ordered; tax/service/discount/
 *                  company-claim distributed across participants.
 *   - equal_split: the final bill is split equally across the splitting members.
 *   - farewell   : honorees pay RM 0; the cost of their items is shared across the
 *                  paying participants, then adjustments apply on the own+share base.
 */

export type CalculationMode = 'item_based' | 'equal_split' | 'farewell';
export type ParticipantRole = 'paying_participant' | 'farewell_honoree';
export type SimpleAlloc = 'proportional' | 'equal' | 'manual';
export type DiscountAlloc =
  | 'proportional'
  | 'equal'
  | 'organizer_only'
  | 'selected_participants'
  | 'manual';
export type ClaimAlloc = 'proportional' | 'equal' | 'selected_participants' | 'manual';
export type FarewellAlloc =
  | 'equal_paying_participants'
  | 'proportional_paying_participants'
  | 'manual';

export interface CompanyClaim {
  type: 'none' | 'fixed' | 'percentage';
  amountCents?: number; // for type 'fixed'
  percent?: number; // for type 'percentage' (0..100)
}

export interface ParticipantInput {
  id: string;
  name: string;
  role: ParticipantRole;
  isOrganizer: boolean;
  ownSubtotalCents: number; // sum of this person's items at actual price
}

export interface BillInput {
  mode: CalculationMode;
  includeOrganizerInSplit: boolean;
  taxCents: number;
  serviceChargeCents: number;
  discountCents: number;
  companyClaim: CompanyClaim;
  taxAlloc: SimpleAlloc;
  serviceChargeAlloc: SimpleAlloc;
  discountAlloc: DiscountAlloc;
  companyClaimAlloc: ClaimAlloc;
  farewellAlloc: FarewellAlloc;
  finalBillCents?: number | null;
  manualRoundingCents?: number | null; // overrides the auto rounding adjustment
  discountSelectedIds?: string[];
  claimSelectedIds?: string[];
}

export interface ParticipantResult {
  id: string;
  name: string;
  role: ParticipantRole;
  subtotalCents: number; // own subtotal
  farewellSponsoredShareCents: number; // share of honorees' cost (paying participants only)
  taxCents: number;
  serviceChargeCents: number;
  discountCents: number;
  companyClaimCents: number;
  roundingAdjustmentCents: number;
  totalDueCents: number;
}

export interface CalcSummary {
  mode: CalculationMode;
  finalBillAmountCents: number | null;
  calculatedTotalCents: number; // line items + tax + service - discount
  companyClaimAmountCents: number;
  collectedFromParticipantsCents: number;
  mismatchCents: number; // calculatedTotal - finalBill (0 when finalBill is null)
}

export interface CalcOutput {
  results: ParticipantResult[];
  summary: CalcSummary;
}

// --------------------------------------------------------------------------
// Distribution helpers — split an integer-sen total so the parts sum EXACTLY.
// --------------------------------------------------------------------------

/** Split `totalCents` (>= 0) across `n` members as evenly as possible. */
export function distributeEqually(totalCents: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.trunc(totalCents / n);
  const remainder = totalCents - base * n; // 0..n-1
  return Array.from({ length: n }, (_unused, i) => base + (i < remainder ? 1 : 0));
}

/**
 * Split `totalCents` (>= 0) proportionally to `weights` using the largest-
 * remainder method, so the parts sum exactly to `totalCents`. If all weights
 * are zero, falls back to an equal split.
 */
export function distributeByWeight(totalCents: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) return distributeEqually(totalCents, n);

  const exact = weights.map((w) => (totalCents * w) / weightSum);
  const result = exact.map((x) => Math.floor(x));
  let remainder = totalCents - result.reduce((a, b) => a + b, 0);

  const byFraction = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; remainder > 0 && k < n; k++, remainder--) {
    const idx = byFraction[k]!.i;
    result[idx] = (result[idx] ?? 0) + 1;
  }
  return result;
}

// --------------------------------------------------------------------------
// Engine
// --------------------------------------------------------------------------

function blankResult(p: ParticipantInput): ParticipantResult {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    subtotalCents: p.ownSubtotalCents,
    farewellSponsoredShareCents: 0,
    taxCents: 0,
    serviceChargeCents: 0,
    discountCents: 0,
    companyClaimCents: 0,
    roundingAdjustmentCents: 0,
    totalDueCents: 0,
  };
}

export function calculate(participants: ParticipantInput[], bill: BillInput): CalcOutput {
  const results = new Map<string, ParticipantResult>();
  for (const p of participants) results.set(p.id, blankResult(p));

  // In farewell mode honorees pay 0 and their cost is shared; otherwise role is
  // ignored for payment and everyone pays for their own order.
  const isFarewell = bill.mode === 'farewell';
  const payers = participants.filter(
    (p) => !isFarewell || p.role === 'paying_participant',
  );
  const honorees = isFarewell
    ? participants.filter((p) => p.role === 'farewell_honoree')
    : [];

  // ---- Mode B: equal split of the final bill -----------------------------
  if (bill.mode === 'equal_split') {
    const finalBill = bill.finalBillCents ?? 0;
    let splitMembers = payers;
    if (!bill.includeOrganizerInSplit) {
      splitMembers = splitMembers.filter((p) => !p.isOrganizer);
    }
    const shares = distributeEqually(finalBill, splitMembers.length);
    splitMembers.forEach((p, i) => {
      results.get(p.id)!.totalDueCents = shares[i]!;
    });
    const collected = shares.reduce((a, b) => a + b, 0);
    return {
      results: participants.map((p) => results.get(p.id)!),
      summary: {
        mode: bill.mode,
        finalBillAmountCents: bill.finalBillCents ?? null,
        calculatedTotalCents: finalBill,
        companyClaimAmountCents: 0,
        collectedFromParticipantsCents: collected,
        mismatchCents: 0,
      },
    };
  }

  // ---- Modes A & C: item-based, with optional farewell sharing -----------

  // 1. Farewell shares: distribute honorees' subtotal across paying participants.
  const honoreeSubtotal = honorees.reduce((a, p) => a + p.ownSubtotalCents, 0);
  let shares: number[];
  if (honoreeSubtotal > 0 && payers.length > 0) {
    if (bill.farewellAlloc === 'proportional_paying_participants') {
      shares = distributeByWeight(honoreeSubtotal, payers.map((p) => p.ownSubtotalCents));
    } else {
      shares = distributeEqually(honoreeSubtotal, payers.length); // equal (default) + manual fallback
    }
  } else {
    shares = payers.map(() => 0);
  }
  payers.forEach((p, i) => {
    results.get(p.id)!.farewellSponsoredShareCents = shares[i]!;
  });

  // 2. Base per payer = own subtotal + farewell share. Sums to the total of all items.
  const base = payers.map((p, i) => p.ownSubtotalCents + shares[i]!);
  const totalBase = base.reduce((a, b) => a + b, 0);

  // 3. Allocate tax and service charge across payers.
  const allocSimple = (amount: number, method: SimpleAlloc): number[] => {
    if (method === 'equal') return distributeEqually(amount, payers.length);
    return distributeByWeight(amount, base); // proportional (default) + manual fallback
  };
  const tax = allocSimple(bill.taxCents, bill.taxAlloc);
  const service = allocSimple(bill.serviceChargeCents, bill.serviceChargeAlloc);

  // 4. Allocate discount across payers.
  const discount = ((): number[] => {
    const a = bill.discountCents;
    switch (bill.discountAlloc) {
      case 'equal':
        return distributeEqually(a, payers.length);
      case 'organizer_only': {
        const idx = payers.findIndex((p) => p.isOrganizer);
        const arr = payers.map(() => 0);
        if (idx >= 0) arr[idx] = a;
        else return distributeByWeight(a, base);
        return arr;
      }
      case 'selected_participants': {
        const set = new Set(bill.discountSelectedIds ?? []);
        const weights = payers.map((p, i) => (set.has(p.id) ? base[i]! : 0));
        if (weights.every((w) => w === 0)) return distributeByWeight(a, base);
        return distributeByWeight(a, weights);
      }
      default:
        return distributeByWeight(a, base); // proportional + manual fallback
    }
  })();

  // 5. Resolve the company claim amount, then allocate it across payers.
  const grossCalculated =
    totalBase + bill.taxCents + bill.serviceChargeCents - bill.discountCents;
  let claimAmount = 0;
  if (bill.companyClaim.type === 'fixed') {
    claimAmount = Math.max(0, bill.companyClaim.amountCents ?? 0);
  } else if (bill.companyClaim.type === 'percentage') {
    const pct = Math.min(100, Math.max(0, bill.companyClaim.percent ?? 0));
    const claimBase = bill.finalBillCents ?? grossCalculated; // full bill by default
    claimAmount = Math.round((pct / 100) * claimBase);
  }
  const claim = ((): number[] => {
    if (claimAmount <= 0) return payers.map(() => 0);
    switch (bill.companyClaimAlloc) {
      case 'equal':
        return distributeEqually(claimAmount, payers.length);
      case 'selected_participants': {
        const set = new Set(bill.claimSelectedIds ?? []);
        const weights = payers.map((p, i) => (set.has(p.id) ? base[i]! : 0));
        if (weights.every((w) => w === 0)) return distributeByWeight(claimAmount, base);
        return distributeByWeight(claimAmount, weights);
      }
      default:
        return distributeByWeight(claimAmount, base); // proportional + manual fallback
    }
  })();

  // 6. Assemble payer rows: total = base + tax + service - discount - claim.
  payers.forEach((p, i) => {
    const r = results.get(p.id)!;
    r.taxCents = tax[i]!;
    r.serviceChargeCents = service[i]!;
    r.discountCents = discount[i]!;
    r.companyClaimCents = claim[i]!;
    r.totalDueCents =
      base[i]! + tax[i]! + service[i]! - discount[i]! - claim[i]!;
  });

  const collectedBeforeRounding = payers.reduce(
    (a, p) => a + results.get(p.id)!.totalDueCents,
    0,
  );

  // 7. Rounding: by default reconcile the collected amount to (finalBill - claim),
  //    applied to the organizer's row (or the first payer if no organizer ordered).
  const target =
    bill.finalBillCents != null ? bill.finalBillCents - claimAmount : collectedBeforeRounding;
  const autoRounding = target - collectedBeforeRounding;
  const rounding = bill.manualRoundingCents ?? autoRounding;
  if (rounding !== 0 && payers.length > 0) {
    const organizer = payers.find((p) => p.isOrganizer) ?? payers[0]!;
    const r = results.get(organizer.id)!;
    r.roundingAdjustmentCents += rounding;
    r.totalDueCents += rounding;
  }

  const collected = payers.reduce((a, p) => a + results.get(p.id)!.totalDueCents, 0);
  const mismatch =
    bill.finalBillCents != null ? grossCalculated - bill.finalBillCents : 0;

  return {
    results: participants.map((p) => results.get(p.id)!),
    summary: {
      mode: bill.mode,
      finalBillAmountCents: bill.finalBillCents ?? null,
      calculatedTotalCents: grossCalculated,
      companyClaimAmountCents: claimAmount,
      collectedFromParticipantsCents: collected,
      mismatchCents: mismatch,
    },
  };
}
