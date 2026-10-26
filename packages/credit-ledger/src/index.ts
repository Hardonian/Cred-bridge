import { createHash } from 'node:crypto';

export type ReservationStatus =
  | 'PENDING_VALIDATION'
  | 'RESERVED'
  | 'CONSUMED'
  | 'RELEASED'
  | 'EXPIRED';

export type Reservation = {
  idempotencyKey: string;
  tenantId: string;
  credits: number;
  status: ReservationStatus;
};

export const idempotencyKey = (
  tenantId: string,
  learnerId: string,
  achievementId: string,
  milestoneVersion: string
) =>
  createHash('sha256')
    .update(`${tenantId}${learnerId}${achievementId}${milestoneVersion}`)
    .digest('hex');

const valid: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING_VALIDATION: ['RESERVED'],
  RESERVED: ['CONSUMED', 'RELEASED', 'EXPIRED'],
  CONSUMED: [],
  RELEASED: [],
  EXPIRED: [],
};

export function transitionReservation(
  r: Reservation,
  next: ReservationStatus
): Reservation {
  if (!valid[r.status].includes(next)) {
    throw new Error(`Invalid reservation transition ${r.status} -> ${next}`);
  }
  return { ...r, status: next };
}

export class CreditLedger {
  private readonly reservations = new Map<string, Reservation>();

  constructor(public readonly pool = 10000) {}

  reserve(input: {
    tenantId: string;
    learnerId: string;
    achievementId: string;
    milestoneVersion: string;
    available: number;
  }) {
    const key = idempotencyKey(
      input.tenantId,
      input.learnerId,
      input.achievementId,
      input.milestoneVersion
    );
    const existing = this.reservations.get(key);
    if (existing) return existing;
    if (input.available < 1) throw new Error('Tenant hard cap reached');
    const r = transitionReservation(
      {
        idempotencyKey: key,
        tenantId: input.tenantId,
        credits: 1,
        status: 'PENDING_VALIDATION',
      },
      'RESERVED'
    );
    this.reservations.set(key, r);
    return r;
  }

  consume(key: string) {
    const r = this.reservations.get(key);
    if (!r) throw new Error('Reservation not found');
    const next = transitionReservation(r, 'CONSUMED');
    this.reservations.set(key, next);
    return next;
  }

  release(key: string) {
    const r = this.reservations.get(key);
    if (!r) throw new Error('Reservation not found');
    const next = transitionReservation(r, 'RELEASED');
    this.reservations.set(key, next);
    return next;
  }

  get all() {
    return [...this.reservations.values()];
  }
}

export function unitEconomics(input: {
  eligibleCohortSize: number;
  participationRate: number;
  paidAttachRate: number;
  licencePrice: number;
  creditCost: number;
  partnerSimulationCost: number;
  supportCost: number;
}) {
  const learners = input.eligibleCohortSize * input.participationRate;
  const paid = learners * input.paidAttachRate;
  const revenue = paid * input.licencePrice;
  const cost =
    learners * (input.creditCost + input.partnerSimulationCost + input.supportCost);
  const margin = revenue - cost;
  return {
    eligibleCohortSize: input.eligibleCohortSize,
    realizedLicenceRevenue: revenue,
    credentialCreditCost: learners * input.creditCost,
    netContributionMargin: margin,
    contributionMarginPerLearner: learners ? margin / learners : 0,
    breakEvenCohortSize:
      input.licencePrice > 0 ? Math.ceil(cost / input.licencePrice) : 0,
  };
}

export interface PricingTier {
  minCredits: number;
  maxCredits: number;
  ratePerCredit: number;
}

export const DEFAULT_PRICING_TIERS: PricingTier[] = [
  { minCredits: 0, maxCredits: 2500, ratePerCredit: 0.6 },
  { minCredits: 2501, maxCredits: 10000, ratePerCredit: 0.54 },
  { minCredits: 10001, maxCredits: Infinity, ratePerCredit: 0.45 },
];

export function calculateCreditCost(
  credits: number,
  tiers = DEFAULT_PRICING_TIERS
): number {
  for (const tier of tiers) {
    if (credits >= tier.minCredits && credits <= tier.maxCredits) {
      return credits * tier.ratePerCredit;
    }
  }
  return credits * 0.54;
}

export interface ContractForecastInput {
  months: number;
  monthlyCohortGrowthRate: number;
  initialMonthlyLearners: number;
  licensePricePerLearner: number;
  creditCostPerLearner: number;
  supportCostPerLearner: number;
}

export interface MonthlyForecastPoint {
  month: number;
  activeLearners: number;
  creditsRequired: number;
  projectedRevenue: number;
  projectedCosts: number;
  netMargin: number;
  cumulativeMargin: number;
}

export function contractForecast(input: ContractForecastInput): {
  points: MonthlyForecastPoint[];
  totalLearnersServed: number;
  totalCreditsBurned: number;
  totalRevenue: number;
  totalCosts: number;
  totalNetMargin: number;
  blendedMarginPercent: number;
} {
  const points: MonthlyForecastPoint[] = [];
  let currentLearners = input.initialMonthlyLearners;
  let cumulativeMargin = 0;
  let totalCredits = 0;
  let totalRev = 0;
  let totalCost = 0;

  for (let m = 1; m <= input.months; m++) {
    const learners = Math.round(currentLearners);
    const credits = learners;
    const rev = learners * input.licensePricePerLearner;
    const cost =
      learners * (input.creditCostPerLearner + input.supportCostPerLearner);
    const margin = rev - cost;
    cumulativeMargin += margin;
    totalCredits += credits;
    totalRev += rev;
    totalCost += cost;

    points.push({
      month: m,
      activeLearners: learners,
      creditsRequired: credits,
      projectedRevenue: rev,
      projectedCosts: cost,
      netMargin: margin,
      cumulativeMargin,
    });

    currentLearners *= 1 + input.monthlyCohortGrowthRate;
  }

  return {
    points,
    totalLearnersServed: points.reduce((acc, p) => acc + p.activeLearners, 0),
    totalCreditsBurned: totalCredits,
    totalRevenue: totalRev,
    totalCosts: totalCost,
    totalNetMargin: cumulativeMargin,
    blendedMarginPercent:
      totalRev > 0 ? Math.round((cumulativeMargin / totalRev) * 100) : 0,
  };
}
